import { supabase } from './supabase';

export const REPORT_BUCKET = 'private';
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'png', 'jpg', 'jpeg', 'webp', 'zip', 'msg',
];

export const REPORT_TYPES = [
  'Monthly Report',
  'Safety Report',
  'Financial Report',
  'Training Report',
  'Maintenance Report',
  'Incident Report',
];

export interface ReportFile {
  id: number;
  reference_number: string | null;
  name: string | null;
  original_filename: string | null;
  safe_filename: string | null;
  bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  type: string | null;
  status: string | null;
  report_date: string | null;
  created_by: string | null;
  uploaded_at: string | null;
  created_at: string;
}

export function rpcError(err: unknown): string {
  const e = err as { message?: string; hint?: string; details?: string } | null;
  if (e?.message) {
    const m = e.message.replace(/^.*?raised exception:\s*/i, '').trim();
    return m || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(name: string): string {
  return (name.split('.').pop() || '').toLowerCase();
}

export function validateFile(file: File | null): string | null {
  if (!file) return 'Select a file to upload.';
  if (file.size === 0) return 'Cannot upload an empty file.';
  if (file.size > MAX_FILE_BYTES) return 'File exceeds the maximum size of 25 MB.';
  const ext = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) return 'This file type is not allowed.';
  if (/\.(exe|sh|bat|com|cmd|ps1|msi|vbs|scr|jar|dll|lnk|hta)(\.|$)/i.test(file.name)) {
    return 'Executable files are not allowed.';
  }
  return null;
}

async function sha256(file: File): Promise<string | null> {
  try {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

export async function getCurrentOrgId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('current_org');
  if (error) return null;
  return (data as string) ?? null;
}

export async function fetchReportFiles(): Promise<ReportFile[]> {
  const { data, error } = await supabase
    .from('report_files')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ReportFile[]) ?? [];
}

export async function uploadReportFile(
  file: File,
  reportType: string,
): Promise<string> {
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error('You are not a member of an organisation.');

  const ext = fileExtension(file.name);
  const safeFilename = `${crypto.randomUUID()}.${ext}`;
  const path = `reports/${orgId}/${safeFilename}`;
  const checksum = await sha256(file);

  const { error: upErr } = await supabase.storage
    .from(REPORT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(upErr.message || 'Upload failed.');

  const { data, error } = await supabase.rpc('register_report_file', {
    p_bucket: REPORT_BUCKET,
    p_storage_path: path,
    p_original_filename: file.name,
    p_safe_filename: safeFilename,
    p_mime_type: file.type,
    p_size_bytes: file.size,
    p_report_type: reportType || 'General',
    p_checksum: checksum,
  });

  if (error) {
    await supabase.storage.from(REPORT_BUCKET).remove([path]);
    throw new Error(rpcError(error));
  }
  return (data as string) ?? '';
}

export async function downloadReportFile(file: ReportFile): Promise<void> {
  if (!file.storage_path || !file.bucket) throw new Error('File metadata is incomplete.');
  const { data, error } = await supabase.storage
    .from(file.bucket)
    .createSignedUrl(file.storage_path, 3600);
  if (error || !data?.signedUrl) throw new Error('Could not generate a download link.');

  const res = await fetch(data.signedUrl);
  if (!res.ok) throw new Error('Could not download the file.');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.original_filename || file.name || 'report';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function archiveReportFile(id: number): Promise<void> {
  const { error } = await supabase.rpc('archive_report_file', { p_id: id });
  if (error) throw error;
}

export async function restoreReportFile(id: number): Promise<void> {
  const { error } = await supabase.rpc('restore_report_file', { p_id: id });
  if (error) throw error;
}

export async function deleteReportFile(file: ReportFile): Promise<{ partial: boolean }> {
  const { error } = await supabase.rpc('delete_report_file', { p_id: file.id });
  if (error) throw error;

  if (file.storage_path && file.bucket) {
    const { error: rmErr } = await supabase.storage.from(file.bucket).remove([file.storage_path]);
    if (rmErr) return { partial: true };
  }
  return { partial: false };
}
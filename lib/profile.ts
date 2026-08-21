import { supabase } from './supabase';

export type Role = 'staff' | 'supervisor' | 'manager' | 'administrator';

export interface Profile {
  id: string;
  user_id: string;
  organisation_id: string | null;
  site_id: string | null;
  full_name: string | null;
  work_email: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  employee_number: string | null;
  shift: string | null;
  work_pattern: string | null;
  pattern_start_date: string | null;
  avatar_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileFields {
  full_name: string;
  work_email: string;
  phone: string;
  job_title: string;
  department: string;
  employee_number: string;
  shift: string;
  work_pattern: string;
  pattern_start_date: string;
}

export interface OrgMember {
  user_id: string;
  role: Role;
  full_name: string | null;
  status: string | null;
}

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_BUCKET = 'public';

export function toProfileFields(p: Profile | null): ProfileFields {
  return {
    full_name: p?.full_name ?? '',
    work_email: p?.work_email ?? '',
    phone: p?.phone ?? '',
    job_title: p?.job_title ?? '',
    department: p?.department ?? '',
    employee_number: p?.employee_number ?? '',
    shift: p?.shift ?? '',
    work_pattern: p?.work_pattern ?? '',
    pattern_start_date: p?.pattern_start_date ?? '',
  };
}

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function fetchOrgProfiles(orgId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organisation_id', orgId)
    .order('full_name');
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

export async function saveProfile(
  userId: string,
  existingId: string | null,
  fields: ProfileFields,
  avatarPath: string | null,
): Promise<void> {
  const payload: Record<string, unknown> = { ...fields, user_id: userId };
  if (!payload.pattern_start_date) payload.pattern_start_date = null;
  if (avatarPath) payload.avatar_path = avatarPath;
  if (existingId) {
    const { error } = await supabase.from('profiles').update(payload).eq('id', existingId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('profiles').insert(payload);
    if (error) throw error;
  }
}

export async function updateStaffProfile(profileId: string, fields: ProfileFields): Promise<void> {
  const cleanFields: Record<string, unknown> = { ...fields };
  if (!cleanFields.pattern_start_date) cleanFields.pattern_start_date = null;
  const { error } = await supabase.from('profiles').update(cleanFields).eq('id', profileId);
  if (error) throw error;
}

export async function setProfileStatus(profileId: string, status: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', profileId);
  if (error) throw error;
}

export async function checkDuplicate(
  orgId: string,
  field: 'work_email' | 'employee_number',
  value: string,
  excludeUserId?: string,
): Promise<boolean> {
  if (!value) return false;
  let q = supabase.from('profiles').select('id').eq('organisation_id', orgId).eq(field, value);
  if (excludeUserId) q = q.neq('user_id', excludeUserId);
  const { data, error } = await q;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `avatars/${userId}.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function getAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function getMyOrgs(): Promise<string[]> {
  const { data, error } = await supabase.rpc('user_orgs');
  if (error) throw error;
  return (data as string[]) ?? [];
}

export async function getMyOrgRole(orgId: string): Promise<Role | null> {
  const { data, error } = await supabase.rpc('user_org_role', { p_org: orgId });
  if (error) return null;
  return (data as Role) ?? null;
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase.rpc('list_org_members', { p_org: orgId });
  if (error) throw error;
  return (data as OrgMember[]) ?? [];
}

export async function setMemberRole(orgId: string, userId: string, role: Role): Promise<void> {
  const { error } = await supabase.rpc('admin_set_member_role', {
    p_org: orgId,
    p_user: userId,
    p_role: role,
  });
  if (error) throw error;
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_member', { p_org: orgId, p_user: userId });
  if (error) throw error;
}

export async function bootstrapOrg(name: string): Promise<void> {
  const { error } = await supabase.rpc('bootstrap_organisation', { p_name: name });
  if (error) throw error;
}

export async function logAudit(
  action: string,
  targetType: string,
  targetId: string,
  detail?: Record<string, unknown>,
  orgId?: string,
): Promise<void> {
  await supabase.rpc('log_audit', {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_detail: detail ?? {},
    p_org: orgId ?? null,
  });
}
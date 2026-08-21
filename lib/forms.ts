import { supabase } from './supabase';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type RecordStatus = 'submitted' | 'under_review' | 'resolved' | 'closed' | 'archived';

export const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
export const STATUSES: RecordStatus[] = ['submitted', 'under_review', 'resolved', 'closed', 'archived'];

export interface IncidentReport {
  id: number;
  reference_number: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  incident_date: string | null;
  incident_time: string | null;
  location: string | null;
  incident_type: string | null;
  severity: string | null;
  persons_involved: string | null;
  witness_name: string | null;
  witness_contact: string | null;
  description: string | null;
  action_taken: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface CctvReport {
  id: number;
  reference_number: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface DobEntry {
  id: number;
  reference_number: string | null;
  entry_date: string | null;
  entry_time: string | null;
  officer: string | null;
  entry_type: string | null;
  description: string | null;
  location: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface FireDoorReport {
  id: number;
  reference_number: string | null;
  report_date: string | null;
  completed_by: string | null;
  checklist: unknown;
  actions_recommendations: string | null;
  line_manager_name: string | null;
  operations_comments: string | null;
  contract_comments: string | null;
  status: string;
  created_at: string;
}

export interface CommsLogRow {
  id: number;
  year: number;
  month: number;
  day: number;
  lights_working: string | null;
  any_smells: string | null;
  any_alarms: string | null;
  officer: string | null;
  notes: string | null;
}

export function rpcError(err: unknown): string {
  const e = err as { message?: string; hint?: string; details?: string } | null;
  if (e?.message) {
    const m = e.message.replace(/^.*?raised exception:\s*/i, '').trim();
    return m || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

export async function fetchIncidents(): Promise<IncidentReport[]> {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as IncidentReport[]) ?? [];
}

export async function submitIncident(payload: {
  incidentDate: string;
  incidentTime: string;
  location: string;
  incidentType: string;
  severity: string;
  personsInvolved: string;
  witnessName: string;
  witnessContact: string;
  description: string;
  actionTaken: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('submit_incident_report', {
    p_incident_date: payload.incidentDate,
    p_incident_time: payload.incidentTime,
    p_location: payload.location,
    p_incident_type: payload.incidentType,
    p_severity: payload.severity,
    p_persons_involved: payload.personsInvolved,
    p_witness_name: payload.witnessName,
    p_witness_contact: payload.witnessContact,
    p_description: payload.description,
    p_action_taken: payload.actionTaken,
  });
  if (error) throw error;
  return (data as string) ?? '';
}

export async function updateIncident(
  id: number,
  payload: {
    incidentDate: string;
    incidentTime: string;
    location: string;
    incidentType: string;
    severity: string;
    personsInvolved: string;
    witnessName: string;
    witnessContact: string;
    description: string;
    actionTaken: string;
  },
): Promise<void> {
  const { error } = await supabase.rpc('update_incident_report', {
    p_id: id,
    p_incident_date: payload.incidentDate,
    p_incident_time: payload.incidentTime,
    p_location: payload.location,
    p_incident_type: payload.incidentType,
    p_severity: payload.severity,
    p_persons_involved: payload.personsInvolved,
    p_witness_name: payload.witnessName,
    p_witness_contact: payload.witnessContact,
    p_description: payload.description,
    p_action_taken: payload.actionTaken,
  });
  if (error) throw error;
}

export async function fetchCctv(): Promise<CctvReport[]> {
  const { data, error } = await supabase
    .from('cctv_incident_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CctvReport[]) ?? [];
}

export async function submitCctv(payload: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.rpc('submit_cctv_report', { p_data: payload });
  if (error) throw error;
  return (data as string) ?? '';
}

export async function fetchDob(): Promise<DobEntry[]> {
  const { data, error } = await supabase
    .from('dob_entries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DobEntry[]) ?? [];
}

export async function submitDob(payload: {
  entryDate: string;
  entryTime: string;
  entryType: string;
  description: string;
  location: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('submit_dob_entry', {
    p_entry_date: payload.entryDate,
    p_entry_time: payload.entryTime,
    p_entry_type: payload.entryType,
    p_description: payload.description,
    p_location: payload.location,
  });
  if (error) throw error;
  return (data as string) ?? '';
}

export async function updateDob(
  id: number,
  payload: {
    entryDate: string;
    entryTime: string;
    entryType: string;
    description: string;
    location: string;
  },
): Promise<void> {
  const { error } = await supabase.rpc('update_dob_entry', {
    p_id: id,
    p_entry_date: payload.entryDate,
    p_entry_time: payload.entryTime,
    p_entry_type: payload.entryType,
    p_description: payload.description,
    p_location: payload.location,
  });
  if (error) throw error;
}

export async function fetchFireDoorLatest(): Promise<FireDoorReport | null> {
  const { data, error } = await supabase
    .from('fire_door_inspection_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as FireDoorReport) ?? null;
}

export async function submitFireDoor(payload: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.rpc('submit_fire_door_report', { p_data: payload });
  if (error) throw error;
  return (data as string) ?? '';
}

export async function fetchCommsLog(year: number, month: number): Promise<CommsLogRow[]> {
  const { data, error } = await supabase
    .from('comms_room_log')
    .select('*')
    .eq('year', year)
    .eq('month', month);
  if (error) throw error;
  return (data as CommsLogRow[]) ?? [];
}

export async function saveCommsLog(
  year: number,
  month: number,
  entries: { day: number; lights_working: string; any_smells: string; any_alarms: string; officer: string; notes: string }[],
): Promise<void> {
  const { error } = await supabase.rpc('save_comms_room_log', {
    p_year: year,
    p_month: month,
    p_entries: entries,
  });
  if (error) throw error;
}

export async function setRecordStatus(table: string, id: number, status: string): Promise<void> {
  const { error } = await supabase.rpc('set_record_status', {
    p_table: table,
    p_id: id,
    p_status: status,
  });
  if (error) throw error;
}

export async function deleteRecord(table: string, id: number): Promise<void> {
  const { error } = await supabase.rpc('delete_record', { p_table: table, p_id: id });
  if (error) throw error;
}

export async function submitKpiSubmission(payload: {
  department: string;
  date: string;
  subject: string;
  description: string;
  priority: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('submit_kpi_submission', {
    p_department: payload.department,
    p_date: payload.date,
    p_subject: payload.subject,
    p_description: payload.description,
    p_priority: payload.priority,
  });
  if (error) throw error;
  return (data as string) ?? '';
}

export async function logExport(table: string, count: number): Promise<void> {
  const { data } = await supabase.rpc('current_org');
  const orgId = (data as string | null) ?? null;
  await supabase.rpc('log_audit', {
    p_action: 'export',
    p_target_type: table,
    p_target_id: 'bulk',
    p_detail: { count },
    p_org: orgId,
  });
}

export function csvInjectionGuard(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const cell = (v: unknown): string => {
    let s = csvInjectionGuard(v);
    if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = headers.map((h) => cell(h)).join(',');
  const body = rows.map((r) => headers.map((h) => cell(r[h])).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
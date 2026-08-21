import { supabase } from './supabase';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RotaStaffRow {
  id: number;
  user_id: string | null;
  organisation_id: string | null;
  initials: string;
  name: string;
  shift: string | null;
  shift_time: string | null;
  shift_pattern: string | null;
  color: string | null;
  total_leave_days: number | null;
  sort_order: number | null;
}

export interface ShiftType {
  id: string;
  organisation_id: string;
  code: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  sort_order: number;
}

export interface ShiftAssignment {
  id: string;
  organisation_id: string;
  staff_user_id: string;
  shift_type_id: string | null;
  assignment_date: string;
}

export interface LeaveRequest {
  id: string;
  organisation_id: string;
  staff_user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: RequestStatus;
  reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface OvertimeRequest {
  id: string;
  organisation_id: string;
  staff_user_id: string;
  overtime_date: string;
  start_time: string | null;
  end_time: string | null;
  hours: number | null;
  reason: string | null;
  status: RequestStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface OrgSettings {
  id: string;
  organisation_id: string;
  annual_leave_entitlement: number;
}

export async function getMyOrgId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('user_orgs');
  if (error) return null;
  const orgs = (data as string[]) ?? [];
  return orgs.length ? orgs[0] : null;
}

export async function fetchRotaStaff(orgId: string): Promise<RotaStaffRow[]> {
  const { data, error } = await supabase
    .from('rota_staff')
    .select('*')
    .eq('organisation_id', orgId)
    .order('sort_order');
  if (error) throw error;
  return (data as RotaStaffRow[]) ?? [];
}

export async function fetchShiftTypes(orgId: string): Promise<ShiftType[]> {
  const { data, error } = await supabase
    .from('shift_types')
    .select('*')
    .eq('organisation_id', orgId)
    .order('sort_order');
  if (error) throw error;
  return (data as ShiftType[]) ?? [];
}

export async function fetchAssignments(
  orgId: string,
  startDate: string,
  endDate: string,
): Promise<ShiftAssignment[]> {
  const { data, error } = await supabase
    .from('rota_assignments')
    .select('*')
    .eq('organisation_id', orgId)
    .gte('assignment_date', startDate)
    .lte('assignment_date', endDate);
  if (error) throw error;
  return (data as ShiftAssignment[]) ?? [];
}

export async function fetchLeaveRequests(orgId: string): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('organisation_id', orgId)
    .order('start_date', { ascending: true });
  if (error) throw error;
  return (data as LeaveRequest[]) ?? [];
}

export async function fetchOvertimeRequests(orgId: string): Promise<OvertimeRequest[]> {
  const { data, error } = await supabase
    .from('overtime_requests')
    .select('*')
    .eq('organisation_id', orgId)
    .order('overtime_date', { ascending: true });
  if (error) throw error;
  return (data as OvertimeRequest[]) ?? [];
}

export async function fetchOrgSettings(orgId: string): Promise<OrgSettings | null> {
  const { data, error } = await supabase
    .from('organisation_settings')
    .select('*')
    .eq('organisation_id', orgId)
    .maybeSingle();
  if (error) throw error;
  return (data as OrgSettings) ?? null;
}

export async function submitLeaveRequest(
  orgId: string,
  staffUserId: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  reason?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_leave_request', {
    p_org: orgId,
    p_staff: staffUserId,
    p_type: leaveType,
    p_start: startDate,
    p_end: endDate,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function submitOvertimeRequest(
  orgId: string,
  staffUserId: string,
  overtimeDate: string,
  startTime?: string,
  endTime?: string,
  hours?: number,
  reason?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_overtime_request', {
    p_org: orgId,
    p_staff: staffUserId,
    p_date: overtimeDate,
    p_start: startTime ?? null,
    p_end: endTime ?? null,
    p_hours: hours ?? null,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function decideLeaveRequest(requestId: string, decision: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase.rpc('decide_leave_request', {
    p_request: requestId,
    p_decision: decision,
  });
  if (error) throw new Error(error.message);
}

export async function decideOvertimeRequest(requestId: string, decision: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase.rpc('decide_overtime_request', {
    p_request: requestId,
    p_decision: decision,
  });
  if (error) throw new Error(error.message);
}

export async function withdrawLeaveRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('withdraw_leave_request', { p_request: requestId });
  if (error) throw new Error(error.message);
}

export async function assignShift(
  orgId: string,
  staffUserId: string,
  assignmentDate: string,
  shiftTypeId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('assign_shift', {
    p_org: orgId,
    p_staff: staffUserId,
    p_date: assignmentDate,
    p_shift_type_id: shiftTypeId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function removeShiftAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_shift_assignment', { p_assignment: assignmentId });
  if (error) throw new Error(error.message);
}
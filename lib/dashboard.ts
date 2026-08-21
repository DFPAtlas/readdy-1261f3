import { supabase } from './supabase';

export interface DashboardStats {
  staffCount: number;
  totalSubmissions: number;
  activeIncidents: number;
  pendingRequests: number;
}

export interface TrendPoint {
  label: string;
  submissions: number;
}

export interface CategoryPoint {
  category: string;
  count: number;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  entity: string;
  time: string;
}

export interface KpiSummary {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
}

export interface KpiSubmission {
  id: number;
  reference_number: string | null;
  department: string | null;
  subject: string | null;
  priority: string | null;
  status: string | null;
  date: string | null;
  reporter_name: string | null;
  created_at: string;
}

const ACTIVE_INCIDENT_STATUSES = ['submitted', 'under_review'];

export async function getOrgId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('current_org');
  if (error) return null;
  return (data as string | null) ?? null;
}

function exactCount(r: { count: number | null } | null): number {
  return r?.count ?? 0;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('en-GB', { month: 'short' });
}

function lastNMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export async function fetchDashboardStats(orgId: string): Promise<DashboardStats> {
  const [
    staff,
    inc,
    cctv,
    dob,
    idc,
    rep,
    leave,
    ot,
    incActive,
    cctvActive,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('status', 'active'),
    supabase.from('incident_reports').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId),
    supabase.from('cctv_incident_reports').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId),
    supabase.from('dob_entries').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId),
    supabase.from('id_card_requests').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).is('deleted_at', null),
    supabase.from('report_files').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).is('deleted_at', null),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('status', 'pending'),
    supabase.from('overtime_requests').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('status', 'pending'),
    supabase.from('incident_reports').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).in('status', ACTIVE_INCIDENT_STATUSES),
    supabase.from('cctv_incident_reports').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).in('status', ACTIVE_INCIDENT_STATUSES),
  ]);

  return {
    staffCount: exactCount(staff),
    totalSubmissions: exactCount(inc) + exactCount(cctv) + exactCount(dob) + exactCount(idc) + exactCount(rep),
    activeIncidents: exactCount(incActive) + exactCount(cctvActive),
    pendingRequests: exactCount(leave) + exactCount(ot),
  };
}

export async function fetchSubmissionTrend(orgId: string): Promise<TrendPoint[]> {
  const [inc, dob, idc, rep] = await Promise.all([
    supabase.from('incident_reports').select('created_at').eq('organisation_id', orgId),
    supabase.from('dob_entries').select('created_at').eq('organisation_id', orgId),
    supabase.from('id_card_requests').select('created_at').eq('organisation_id', orgId).is('deleted_at', null),
    supabase.from('report_files').select('created_at').eq('organisation_id', orgId).is('deleted_at', null),
  ]);

  const buckets = lastNMonths(6).reduce<Record<string, number>>((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {});

  const all: string[] = [];
  (inc.data || []).forEach((r) => all.push(r.created_at));
  (dob.data || []).forEach((r) => all.push(r.created_at));
  (idc.data || []).forEach((r) => all.push(r.created_at));
  (rep.data || []).forEach((r) => all.push(r.created_at));

  all.forEach((iso) => {
    const k = monthKey(iso);
    if (k in buckets) buckets[k] += 1;
  });

  return lastNMonths(6).map((k) => ({ label: monthLabel(k), submissions: buckets[k] }));
}

export async function fetchIncidentCategories(orgId: string): Promise<CategoryPoint[]> {
  const { data } = await supabase
    .from('incident_reports')
    .select('incident_type')
    .eq('organisation_id', orgId);

  const map = new Map<string, number>();
  (data || []).forEach((r) => {
    const cat = r.incident_type?.trim() || 'Other';
    map.set(cat, (map.get(cat) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function fetchRecentActivity(orgId: string): Promise<ActivityItem[]> {
  const { data } = await supabase
    .from('audit_log')
    .select('id, actor_id, action, target_type, target_id, created_at')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false })
    .limit(8);

  const rows = (data as any[]) || [];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean)));

  let names: Record<string, string> = {};
  if (actorIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', actorIds);
    (profs || []).forEach((p) => {
      names[p.user_id] = p.full_name || 'Team member';
    });
  }

  return rows.map((r) => ({
    id: String(r.id),
    actor: names[r.actor_id] || 'Unknown',
    action: formatAction(r.action),
    entity: formatEntity(r.target_type, r.target_id),
    time: r.created_at,
  }));
}

function formatAction(action: string): string {
  const words = (action || '').replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatEntity(type: string | null, id: string | null): string {
  if (!type) return '';
  const base = (type || '').replace(/_/g, ' ');
  return id && id !== 'bulk' ? `${base} #${id}` : base;
}

export async function fetchKpiSubmissions(orgId: string, sinceIso?: string): Promise<KpiSubmission[]> {
  let q = supabase
    .from('kpi_submissions')
    .select('*')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });
  if (sinceIso) q = q.gte('created_at', sinceIso);
  const { data, error } = await q;
  if (error) throw error;
  return (data as KpiSubmission[]) ?? [];
}

export function periodStartIso(period: string): string | undefined {
  const now = new Date();
  const d = new Date(now);
  switch (period) {
    case 'week':
      d.setDate(now.getDate() - 7);
      break;
    case 'month':
      d.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      d.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      d.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return undefined;
  }
  return d.toISOString();
}

export function summariseKpi(rows: KpiSubmission[]): KpiSummary {
  const total = rows.length;
  const completed = rows.filter((r) => r.status === 'completed' || r.status === 'resolved').length;
  const pending = rows.filter((r) => r.status === 'pending' || r.status === 'submitted').length;
  const inProgress = rows.filter((r) => r.status === 'in-progress' || r.status === 'under_review').length;
  return { total, completed, pending, inProgress };
}

export function departmentBreakdown(rows: KpiSubmission[]): CategoryPoint[] {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = r.department?.trim() || 'Unassigned';
    map.set(d, (map.get(d) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

export function priorityBreakdown(rows: KpiSubmission[]): { name: string; value: number; color: string }[] {
  const colors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
  };
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const p = (r.priority || 'medium').toLowerCase();
    map.set(p, (map.get(p) || 0) + 1);
  });
  const order = ['low', 'medium', 'high', 'urgent'];
  return order
    .filter((k) => map.has(k))
    .map((name) => ({ name, value: map.get(name) || 0, color: colors[name] }));
}

export function weeklyTrend(rows: KpiSubmission[]): TrendPoint[] {
  const buckets: { label: string; start: Date }[] = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
    buckets.push({ label: `Week ${4 - i}`, start });
  }
  return buckets.map((b) => {
    const end = new Date(b.start.getTime() + 7 * 86400000);
    const count = rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= b.start.getTime() && t < end.getTime();
    }).length;
    return { label: b.label, submissions: count };
  });
}
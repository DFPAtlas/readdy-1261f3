import { supabase } from './supabase';

export interface AuditEntry {
  id: number;
  actor_id: string | null;
  actor_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  correlation_id: string | null;
  created_at: string;
}

export const AUDIT_PAGE_SIZE = 25;

export async function fetchAuditLog(opts: {
  page: number;
  action?: string;
  targetType?: string;
  query?: string;
}): Promise<{ rows: AuditEntry[]; total: number }> {
  let q = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (opts.action) q = q.eq('action', opts.action);
  if (opts.targetType) q = q.eq('target_type', opts.targetType);
  if (opts.query) {
    const term = `%${opts.query}%`;
    q = q.or(`action.ilike.${term},target_type.ilike.${term},target_id.ilike.${term},correlation_id.ilike.${term}`);
  }

  const from = (opts.page - 1) * AUDIT_PAGE_SIZE;
  const to = from + AUDIT_PAGE_SIZE - 1;
  const { data, error, count } = await q.range(from, to);
  if (error) throw error;

  const rows = (data as any[]) || [];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean)));

  let names: Record<string, string> = {};
  if (actorIds.length) {
    const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', actorIds);
    (profs || []).forEach((p) => {
      names[p.user_id] = p.full_name || 'Unknown';
    });
  }

  return {
    rows: rows.map((r) => ({
      id: r.id,
      actor_id: r.actor_id,
      actor_name: names[r.actor_id] || 'Unknown',
      action: r.action,
      target_type: r.target_type,
      target_id: r.target_id,
      detail: r.detail,
      correlation_id: r.correlation_id,
      created_at: r.created_at,
    })),
    total: count ?? 0,
  };
}

export async function fetchAuditFacets(): Promise<{ actions: string[]; targetTypes: string[] }> {
  const { data } = await supabase.from('audit_log').select('action, target_type');
  const actions = Array.from(new Set((data || []).map((r) => r.action).filter(Boolean))).sort();
  const targetTypes = Array.from(new Set((data || []).map((r) => r.target_type).filter(Boolean))).sort();
  return { actions, targetTypes };
}
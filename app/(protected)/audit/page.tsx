'use client';

import Header from '@/components/Header';
import { useCallback, useEffect, useState } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import { fetchAuditLog, fetchAuditFacets, AUDIT_PAGE_SIZE, type AuditEntry } from '@/lib/audit';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDetail(detail: Record<string, unknown> | null): string {
  if (!detail || Object.keys(detail).length === 0) return '—';
  return Object.entries(detail)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ');
}

export default function AuditPage() {
  const { role } = useAuth();
  const isAdmin = roleRank(role) >= 4;

  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [query, setQuery] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [targetTypes, setTargetTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { rows, total } = await fetchAuditLog({
        page,
        action: action || undefined,
        targetType: targetType || undefined,
        query: query.trim() || undefined,
      });
      setRows(rows);
      setTotal(total);
    } catch {
      setError('Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  }, [page, action, targetType, query]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [load, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAuditFacets()
      .then((f) => {
        setActions(f.actions);
        setTargetTypes(f.targetTypes);
      })
      .catch(() => {});
  }, [isAdmin]);

  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="px-6 py-16">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
            <div className="w-14 h-14 mx-auto flex items-center justify-center bg-red-100 rounded-full mb-4">
              <i className="ri-shield-user-line text-2xl text-red-600"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Access denied</h2>
            <p className="text-sm text-gray-500">Only administrators can view the audit log.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Log</h1>
            <p className="text-gray-600">Immutable record of privileged and sensitive actions</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <i className="ri-search-line text-gray-400 text-sm"></i>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search action, entity or reference..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8">
                <option value="">All actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <select value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8">
                <option value="">All entity types</option>
                {targetTypes.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button
                onClick={() => { setAction(''); setTargetType(''); setQuery(''); setPage(1); }}
                className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 whitespace-nowrap cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-gray-400">
                <div className="w-8 h-8 mx-auto flex items-center justify-center">
                  <i className="ri-loader-4-line text-3xl animate-spin"></i>
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 mx-auto flex items-center justify-center bg-gray-100 rounded-full mb-3">
                  <i className="ri-history-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">No audit entries match your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Entity</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 align-top">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatTime(r.created_at)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{r.actor_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">{r.action.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {r.target_type ? (
                            <span className="capitalize">{r.target_type.replace(/_/g, ' ')}</span>
                          ) : '—'}
                          {r.target_id && r.target_id !== 'bulk' && <span className="text-gray-400"> #{r.target_id}</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">{formatDetail(r.detail)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * AUDIT_PAGE_SIZE) + 1}–{Math.min(page * AUDIT_PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 whitespace-nowrap cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 whitespace-nowrap cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
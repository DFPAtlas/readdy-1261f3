'use client';

import Header from '@/components/Header';
import { useCallback, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getOrgId,
  fetchKpiSubmissions,
  periodStartIso,
  summariseKpi,
  departmentBreakdown,
  priorityBreakdown,
  weeklyTrend,
  type KpiSubmission,
} from '@/lib/dashboard';
import { logExport, toCsv, downloadCsv } from '@/lib/forms';

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_COLOR: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  resolved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'under_review': 'bg-blue-100 text-blue-700',
};

const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

export default function KPIDashboardPage() {
  const [period, setPeriod] = useState('month');
  const [rows, setRows] = useState<KpiSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noOrg, setNoOrg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const orgId = await getOrgId();
      if (!orgId) {
        setNoOrg(true);
        return;
      }
      setNoOrg(false);
      const data = await fetchKpiSubmissions(orgId, periodStartIso(period));
      setRows(data);
    } catch {
      setError('Could not load KPI data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = summariseKpi(rows);
  const depts = departmentBreakdown(rows);
  const priorities = priorityBreakdown(rows);
  const trend = weeklyTrend(rows);

  const completionRate = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  const deptCompletion: { name: string; rate: number; color: string }[] = depts.map((d, i) => {
    const deptRows = rows.filter((r) => (r.department || 'Unassigned') === d.category);
    const done = deptRows.filter((r) => r.status === 'completed' || r.status === 'resolved').length;
    return { name: d.category, rate: deptRows.length ? Math.round((done / deptRows.length) * 100) : 0, color: DEPT_COLORS[i % DEPT_COLORS.length] };
  });

  const handleExport = async () => {
    if (rows.length === 0) return;
    const headers = ['Reference', 'Department', 'Subject', 'Priority', 'Status', 'Date', 'Submitted By'];
    const data = rows.map((r) => ({
      Reference: r.reference_number || '',
      Department: r.department || '',
      Subject: r.subject || '',
      Priority: r.priority || '',
      Status: (r.status || '').replace('_', ' '),
      Date: r.date || '',
      'Submitted By': r.reporter_name || '',
    }));
    downloadCsv(`kpi-submissions-${new Date().toISOString().split('T')[0]}.csv`, toCsv(data, headers));
    await logExport('kpi_submissions', rows.length).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">KPI Dashboard</h1>
              <p className="text-gray-600">Visualize and analyze submitted form data</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                {['week', 'month', 'quarter', 'year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      period === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExport}
                disabled={rows.length === 0}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-download-line"></i>
                </div>
                Export
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          {noOrg ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 mx-auto flex items-center justify-center bg-gray-100 rounded-full mb-4">
                <i className="ri-building-line text-2xl text-gray-400"></i>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Set up your organisation</h2>
              <p className="text-sm text-gray-500">KPI metrics appear once you join an organisation.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard icon="ri-file-list-line" tint="bg-blue-100 text-blue-600" label="Total Submissions" value={loading ? '—' : String(summary.total)} badge="This period" />
                <StatCard icon="ri-check-double-line" tint="bg-green-100 text-green-600" label="Completed" value={loading ? '—' : String(summary.completed)} badge={`${completionRate}%`} />
                <StatCard icon="ri-time-line" tint="bg-yellow-100 text-yellow-600" label="Awaiting Review" value={loading ? '—' : String(summary.pending)} badge="Pending" />
                <StatCard icon="ri-loader-line" tint="bg-purple-100 text-purple-600" label="In Progress" value={loading ? '—' : String(summary.inProgress)} badge="Active" />
                <StatCard icon="ri-percent-line" tint="bg-cyan-100 text-cyan-600" label="Completion Rate" value={loading ? '—' : `${completionRate}%`} badge="Overall" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Submission Trends</h2>
                  {trend.length === 0 ? (
                    <EmptyBox text="No submissions in this period." />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <YAxis allowDecimals={false} stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Priority Distribution</h2>
                  {priorities.length === 0 ? (
                    <EmptyBox text="No priority data yet." />
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={priorities} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                            {priorities.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {priorities.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm text-gray-600 capitalize">{item.name}: {item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Submissions by Department</h2>
                  {depts.length === 0 ? (
                    <EmptyBox text="No department data yet." />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={depts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" allowDecimals={false} stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <YAxis dataKey="category" type="category" stroke="#9ca3af" style={{ fontSize: '12px' }} width={90} />
                        <Tooltip />
                        <Bar dataKey="count" name="Submissions" radius={[0, 8, 8, 0]}>
                          {depts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Completion Rate by Department</h2>
                  {deptCompletion.length === 0 ? (
                    <EmptyBox text="No department data yet." />
                  ) : (
                    <div className="space-y-4">
                      {deptCompletion.map((dept) => (
                        <div key={dept.name} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium text-gray-700 truncate">{dept.name}</div>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${dept.rate}%`, backgroundColor: dept.color }}></div>
                          </div>
                          <div className="w-12 text-sm font-semibold text-gray-900 text-right">{dept.rate}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Submissions</h2>
                {rows.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    <div className="w-12 h-12 mx-auto flex items-center justify-center bg-gray-100 rounded-full mb-3">
                      <i className="ri-inbox-line text-2xl text-gray-400"></i>
                    </div>
                    <p className="text-sm">No submissions in this period.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reference</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Submitted By</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Subject</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Priority</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => (
                          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-blue-600">{s.reference_number || `KPI-${s.id}`}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{s.reporter_name || '—'}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{s.department || '—'}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{s.subject || '—'}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${PRIORITY_COLOR[(s.priority || 'medium').toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
                                {s.priority || 'medium'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLOR[(s.status || '').toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
                                {(s.status || '').replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{s.date || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, tint, label, value, badge }: { icon: string; tint: string; label: string; value: string; badge: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${tint}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
        <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">{badge}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center text-gray-400">
      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full mb-3">
        <i className="ri-bar-chart-line text-2xl"></i>
      </div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
'use client';

import Header from '@/components/Header';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getOrgId,
  fetchDashboardStats,
  fetchSubmissionTrend,
  fetchIncidentCategories,
  fetchRecentActivity,
  type DashboardStats,
  type TrendPoint,
  type CategoryPoint,
  type ActivityItem,
} from '@/lib/dashboard';

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  submit: { icon: 'ri-file-text-line', color: 'bg-blue-100 text-blue-600' },
  role_change: { icon: 'ri-user-settings-line', color: 'bg-purple-100 text-purple-600' },
  account_deactivated: { icon: 'ri-pause-circle-line', color: 'bg-amber-100 text-amber-600' },
  account_activated: { icon: 'ri-check-line', color: 'bg-green-100 text-green-600' },
  member_removed: { icon: 'ri-user-unfollow-line', color: 'bg-red-100 text-red-600' },
  archive_all: { icon: 'ri-archive-line', color: 'bg-purple-100 text-purple-600' },
  export: { icon: 'ri-download-line', color: 'bg-green-100 text-green-600' },
  approve: { icon: 'ri-check-double-line', color: 'bg-green-100 text-green-600' },
  reject: { icon: 'ri-close-circle-line', color: 'bg-red-100 text-red-600' },
};

const EMPTY_STATS: DashboardStats = { staffCount: 0, totalSubmissions: 0, activeIncidents: 0, pendingRequests: 0 };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
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
      const [s, t, c, a] = await Promise.all([
        fetchDashboardStats(orgId),
        fetchSubmissionTrend(orgId),
        fetchIncidentCategories(orgId),
        fetchRecentActivity(orgId),
      ]);
      setStats(s);
      setTrend(t);
      setCategories(c);
      setActivity(a);
    } catch {
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">Monitor your operations and key metrics</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
              </div>
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          {noOrg ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 mx-auto flex items-center justify-center bg-gray-100 rounded-full mb-4">
                <i className="ri-building-line text-2xl text-gray-400"></i>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Set up your organisation</h2>
              <p className="text-sm text-gray-500 mb-4">Your dashboard metrics appear once you join an organisation.</p>
              <Link
                href="/staff"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap cursor-pointer"
              >
                Go to Staff Directory
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
                      <i className="ri-user-line text-blue-600 text-2xl"></i>
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Active</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '—' : stats.staffCount}</p>
                  <p className="text-sm text-gray-600">Staff Members</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg">
                      <i className="ri-alert-line text-red-600 text-2xl"></i>
                    </div>
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Open</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '—' : stats.activeIncidents}</p>
                  <p className="text-sm text-gray-600">Active Incidents</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg">
                      <i className="ri-file-list-line text-green-600 text-2xl"></i>
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">All time</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '—' : stats.totalSubmissions}</p>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg">
                      <i className="ri-calendar-check-line text-purple-600 text-2xl"></i>
                    </div>
                    <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">Awaiting</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '—' : stats.pendingRequests}</p>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Submissions</h2>
                  {trend.length === 0 ? (
                    <EmptyChart text="No submissions yet this period." />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <YAxis allowDecimals={false} stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#3b82f6" fill="#93c5fd" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Incidents by Category</h2>
                  {categories.length === 0 ? (
                    <EmptyChart text="No incidents recorded yet." />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categories}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="category" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <YAxis allowDecimals={false} stroke="#9ca3af" style={{ fontSize: '12px' }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Incidents" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
                  {activity.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                      <div className="w-12 h-12 mx-auto flex items-center justify-center bg-gray-100 rounded-full mb-3">
                        <i className="ri-history-line text-2xl text-gray-400"></i>
                      </div>
                      <p className="text-sm">No activity recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activity.map((a) => {
                        const meta = ACTIVITY_ICONS[a.action.toLowerCase()] || { icon: 'ri-file-list-line', color: 'bg-gray-100 text-gray-600' };
                        return (
                          <div key={a.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${meta.color}`}>
                              <i className={`${meta.icon} text-lg`}></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{a.actor}</p>
                              <p className="text-sm text-gray-600">{a.action} · {a.entity}</p>
                              <p className="text-xs text-gray-500 mt-1">{timeAgo(a.time)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    <Link href="/form" className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                      <div className="w-5 h-5 flex items-center justify-center"><i className="ri-add-line text-xl"></i></div>
                      New Form Submission
                    </Link>
                    <Link href="/incident-report" className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                      <div className="w-5 h-5 flex items-center justify-center"><i className="ri-alert-line text-xl"></i></div>
                      Report Incident
                    </Link>
                    <Link href="/reports" className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                      <div className="w-5 h-5 flex items-center justify-center"><i className="ri-upload-line text-xl"></i></div>
                      Upload Report
                    </Link>
                    <Link href="/rota" className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                      <div className="w-5 h-5 flex items-center justify-center"><i className="ri-calendar-line text-xl"></i></div>
                      Manage Rota
                    </Link>
                    <Link href="/id-cards" className="w-full px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                      <div className="w-5 h-5 flex items-center justify-center"><i className="ri-id-card-line text-xl"></i></div>
                      Generate ID Card
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full mb-3">
        <i className="ri-bar-chart-line text-2xl"></i>
      </div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
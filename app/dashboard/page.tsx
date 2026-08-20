'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Activity = { id: string; user: string; action: string; time: string; icon: string; color: string };

export default function DashboardPage() {
  const submissionsData = [
    { month: 'Jan', submissions: 45 },
    { month: 'Feb', submissions: 52 },
    { month: 'Mar', submissions: 48 },
    { month: 'Apr', submissions: 61 },
    { month: 'May', submissions: 55 },
    { month: 'Jun', submissions: 67 },
  ];

  const incidentData = [
    { category: 'Safety', count: 12 },
    { category: 'Equipment', count: 8 },
    { category: 'Personnel', count: 15 },
    { category: 'Security', count: 6 },
    { category: 'Other', count: 9 },
  ];

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [activeIncidents, setActiveIncidents] = useState(0);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      const [incidents, dobEntries, idCards, reports, incCount, cctvCount, dobCount, idCount, repCount] = await Promise.all([
        supabase.from('incident_reports').select('id, reporter_name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('dob_entries').select('id, officer, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('id_card_requests').select('id, forename, surname, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('report_files').select('id, name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('incident_reports').select('id', { count: 'exact', head: true }),
        supabase.from('cctv_incident_reports').select('id', { count: 'exact', head: true }),
        supabase.from('dob_entries').select('id', { count: 'exact', head: true }),
        supabase.from('id_card_requests').select('id', { count: 'exact', head: true }),
        supabase.from('report_files').select('id', { count: 'exact', head: true }),
      ]);

      const raw: Array<{ ts: string; item: Activity }> = [];
      (incidents.data || []).forEach((r: any) => raw.push({ ts: r.created_at, item: { id: `inc-${r.id}`, user: r.reporter_name || 'Unknown', action: 'Submitted incident report', time: timeAgo(r.created_at), icon: 'ri-file-text-line', color: 'bg-red-100 text-red-600' } }));
      (dobEntries.data || []).forEach((r: any) => raw.push({ ts: r.created_at, item: { id: `dob-${r.id}`, user: r.officer || 'Unknown', action: 'Added DOB entry', time: timeAgo(r.created_at), icon: 'ri-book-line', color: 'bg-purple-100 text-purple-600' } }));
      (idCards.data || []).forEach((r: any) => raw.push({ ts: r.created_at, item: { id: `idc-${r.id}`, user: `${r.forename || ''} ${r.surname || ''}`.trim() || 'Unknown', action: 'Submitted ID card request', time: timeAgo(r.created_at), icon: 'ri-id-card-line', color: 'bg-yellow-100 text-yellow-600' } }));
      (reports.data || []).forEach((r: any) => raw.push({ ts: r.created_at, item: { id: `rep-${r.id}`, user: r.name || 'Unknown', action: 'Uploaded report', time: timeAgo(r.created_at), icon: 'ri-upload-line', color: 'bg-green-100 text-green-600' } }));

      raw.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      setRecentActivities(raw.slice(0, 5).map((e) => e.item));

      const inc = incCount.count || 0;
      const cctv = cctvCount.count || 0;
      const dob = dobCount.count || 0;
      const ids = idCount.count || 0;
      const reps = repCount.count || 0;
      setActiveIncidents(inc + cctv);
      setTotalSubmissions(inc + cctv + dob + ids + reps);
    };
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Monitor your operations and key metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
                  <i className="ri-file-list-line text-blue-600 text-2xl"></i>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalSubmissions}</p>
              <p className="text-sm text-gray-600">Total Submissions</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg">
                  <i className="ri-alert-line text-red-600 text-2xl"></i>
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">+5</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{activeIncidents}</p>
              <p className="text-sm text-gray-600">Active Incidents</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg">
                  <i className="ri-user-line text-green-600 text-2xl"></i>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">156</p>
              <p className="text-sm text-gray-600">Staff Members</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg">
                  <i className="ri-calendar-check-line text-purple-600 text-2xl"></i>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">This Week</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">94%</p>
              <p className="text-sm text-gray-600">Rota Completion</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Submissions</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={submissionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="submissions" stroke="#3b82f6" fill="#93c5fd" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Incidents by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incidentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${activity.color}`}>
                      <i className={`${activity.icon} text-lg`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-add-line text-xl"></i>
                  </div>
                  New Form Submission
                </button>
                <button className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-alert-line text-xl"></i>
                  </div>
                  Report Incident
                </button>
                <button className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-upload-line text-xl"></i>
                  </div>
                  Upload Report
                </button>
                <button className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-calendar-line text-xl"></i>
                  </div>
                  Manage Rota
                </button>
                <button className="w-full px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium transition-colors flex items-center gap-3 whitespace-nowrap cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-id-card-line text-xl"></i>
                  </div>
                  Generate ID Card
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

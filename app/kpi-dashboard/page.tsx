'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Submission = {
    id: string;
    name: string;
    department: string;
    subject: string;
    priority: string;
    status: string;
    date: string;
  };

export default function KPIDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);

  const submissionTrends = [
    { date: 'Week 1', submissions: 28, completed: 24, pending: 4 },
    { date: 'Week 2', submissions: 35, completed: 30, pending: 5 },
    { date: 'Week 3', submissions: 42, completed: 38, pending: 4 },
    { date: 'Week 4', submissions: 38, completed: 35, pending: 3 },
  ];

  const departmentData = [
    { name: 'Operations', submissions: 45, color: '#3b82f6' },
    { name: 'HR', submissions: 32, color: '#10b981' },
    { name: 'Finance', submissions: 28, color: '#f59e0b' },
    { name: 'IT', submissions: 24, color: '#8b5cf6' },
    { name: 'Marketing', submissions: 18, color: '#ef4444' },
    { name: 'Sales', submissions: 15, color: '#06b6d4' },
  ];

  const priorityDistribution = [
    { name: 'Low', value: 35, color: '#22c55e' },
    { name: 'Medium', value: 45, color: '#f59e0b' },
    { name: 'High', value: 28, color: '#f97316' },
    { name: 'Urgent', value: 12, color: '#ef4444' },
  ];

  const responseTimeData = [
    { day: 'Mon', avgTime: 2.4 },
    { day: 'Tue', avgTime: 1.8 },
    { day: 'Wed', avgTime: 3.2 },
    { day: 'Thu', avgTime: 2.1 },
    { day: 'Fri', avgTime: 2.8 },
    { day: 'Sat', avgTime: 4.5 },
    { day: 'Sun', avgTime: 5.2 },
  ];

  useEffect(() => {
    const fetchSubmissions = async () => {
      const [incidents, idCards] = await Promise.all([
        supabase.from('incident_reports').select('id, reporter_name, description, severity, incident_date, location').order('created_at', { ascending: false }).limit(20),
        supabase.from('id_card_requests').select('id, forename, surname, department, badge_id_complete, date_received').order('created_at', { ascending: false }).limit(20),
      ]);

      const rows: Submission[] = [];
      (incidents.data || []).forEach((r: any) => {
        const priority = r.severity === 'critical' ? 'urgent' : (r.severity || 'medium');
        rows.push({
          id: `INC-${r.id}`,
          name: r.reporter_name || 'Unknown',
          department: r.location || 'Security',
          subject: r.description || 'Incident report',
          priority,
          status: 'completed',
          date: r.incident_date || '',
        });
      });
      (idCards.data || []).forEach((r: any) => {
        rows.push({
          id: `IDC-${r.id}`,
          name: `${r.forename || ''} ${r.surname || ''}`.trim() || 'Unknown',
          department: r.department || '—',
          subject: 'ID card request',
          priority: 'medium',
          status: r.badge_id_complete === 'Yes' ? 'completed' : 'pending',
          date: r.date_received || '',
        });
      });

      setRecentSubmissions(rows);
    };
    fetchSubmissions();
  }, []);

  const monthlyComparison = [
    { month: 'Aug', current: 98, previous: 85 },
    { month: 'Sep', current: 112, previous: 95 },
    { month: 'Oct', current: 125, previous: 108 },
    { month: 'Nov', current: 118, previous: 112 },
    { month: 'Dec', current: 135, previous: 120 },
    { month: 'Jan', current: 143, previous: 128 },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalSubmissions = recentSubmissions.length;
  const completedSubmissions = recentSubmissions.filter((s) => s.status === 'completed').length;
  const pendingSubmissions = recentSubmissions.filter((s) => s.status === 'pending').length;
  const inProgressSubmissions = recentSubmissions.filter((s) => s.status === 'in-progress').length;
  const completionRate = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;
  const avgResponseTime = 2.7;

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
                {['week', 'month', 'quarter', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedPeriod === period
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap cursor-pointer">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-download-line"></i>
                </div>
                Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                  <i className="ri-file-list-line text-blue-600 text-xl"></i>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+18%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
              <p className="text-sm text-gray-600">Total Submissions</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                  <i className="ri-check-double-line text-green-600 text-xl"></i>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{completionRate}%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completedSubmissions}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 rounded-lg">
                  <i className="ri-time-line text-yellow-600 text-xl"></i>
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Pending</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{pendingSubmissions}</p>
              <p className="text-sm text-gray-600">Awaiting Review</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                  <i className="ri-loader-line text-purple-600 text-xl"></i>
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{inProgressSubmissions}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-cyan-100 rounded-lg">
                  <i className="ri-timer-line text-cyan-600 text-xl"></i>
                </div>
                <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-1 rounded">Avg</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{avgResponseTime}h</p>
              <p className="text-sm text-gray-600">Response Time</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Submission Trends</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">Submissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Completed</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={submissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="submissions" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="#86efac" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Priority Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {priorityDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Submissions by Department</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" style={{ fontSize: '12px' }} width={80} />
                  <Tooltip />
                  <Bar dataKey="submissions" radius={[0, 8, 8, 0]}>
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Year-over-Year Comparison</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="This Year" />
                  <Line type="monotone" dataKey="previous" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#9ca3af' }} name="Last Year" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Avg Response Time (Hours)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey="avgTime" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate by Department</h2>
              <div className="space-y-4">
                {departmentData.map((dept) => {
                  const rate = Math.floor(Math.random() * 20) + 75;
                  return (
                    <div key={dept.name} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-gray-700">{dept.name}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${rate}%`, backgroundColor: dept.color }}
                        ></div>
                      </div>
                      <div className="w-12 text-sm font-semibold text-gray-900 text-right">{rate}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Submitted By</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Priority</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-blue-600">{submission.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{submission.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{submission.department}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{submission.subject}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getPriorityColor(submission.priority)}`}>
                          {submission.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getStatusColor(submission.status)}`}>
                          {submission.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{submission.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

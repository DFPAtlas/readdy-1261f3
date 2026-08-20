'use client';

import Header from '@/components/Header';
import { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedGuard, setSelectedGuard] = useState('ME');
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const guards = [
    { 
      id: 'ME',
      name: 'M Easton', 
      initials: 'ME', 
      role: 'Security Officer',
      shift: 'Day',
      email: 'm.easton@security.com',
      phone: '+44 7700 900123',
      employeeId: 'SEC-2024-001',
      startDate: '2022-03-15',
      status: 'active',
      color: 'blue',
      certifications: ['SIA Door Supervisor', 'First Aid', 'Fire Safety'],
      totalHours: 168,
      overtimeHours: 12,
      leaveBalance: 17
    },
    { 
      id: 'VK',
      name: 'V King', 
      initials: 'VK', 
      role: 'Security Officer',
      shift: 'Night',
      email: 'v.king@security.com',
      phone: '+44 7700 900124',
      employeeId: 'SEC-2024-002',
      startDate: '2021-08-20',
      status: 'on-leave',
      color: 'sky',
      certifications: ['SIA Door Supervisor', 'CCTV Operator', 'First Aid'],
      totalHours: 144,
      overtimeHours: 8,
      leaveBalance: 13
    },
    { 
      id: 'PG',
      name: 'P Gill', 
      initials: 'PG', 
      role: 'Senior Security Officer',
      shift: 'Day',
      email: 'p.gill@security.com',
      phone: '+44 7700 900125',
      employeeId: 'SEC-2023-003',
      startDate: '2020-01-10',
      status: 'active',
      color: 'emerald',
      certifications: ['SIA Door Supervisor', 'First Aid', 'Fire Safety', 'Team Leader'],
      totalHours: 176,
      overtimeHours: 24,
      leaveBalance: 20
    },
    { 
      id: 'MC',
      name: 'M Conway', 
      initials: 'MC', 
      role: 'Security Officer',
      shift: 'Night',
      email: 'm.conway@security.com',
      phone: '+44 7700 900126',
      employeeId: 'SEC-2024-004',
      startDate: '2023-06-01',
      status: 'sick',
      color: 'teal',
      certifications: ['SIA Door Supervisor', 'First Aid'],
      totalHours: 120,
      overtimeHours: 0,
      leaveBalance: 15
    },
    { 
      id: 'MW',
      name: 'M Woszczyk', 
      initials: 'MW', 
      role: 'Part-time Security Officer',
      shift: 'Day',
      email: 'm.woszczyk@security.com',
      phone: '+44 7700 900127',
      employeeId: 'SEC-2024-005',
      startDate: '2024-02-15',
      status: 'active',
      color: 'amber',
      certifications: ['SIA Door Supervisor'],
      totalHours: 48,
      overtimeHours: 4,
      leaveBalance: 10
    },
    { 
      id: 'MH',
      name: 'M Hewett', 
      initials: 'MH', 
      role: 'Security Officer',
      shift: 'Day',
      email: 'm.hewett@security.com',
      phone: '+44 7700 900128',
      employeeId: 'SEC-2023-006',
      startDate: '2023-01-20',
      status: 'training',
      color: 'rose',
      certifications: ['SIA Door Supervisor', 'First Aid', 'Fire Safety'],
      totalHours: 160,
      overtimeHours: 16,
      leaveBalance: 10
    },
  ];

  const overtimeRecords = [
    { id: 1, guardId: 'ME', date: '2026-01-15', hours: 4, reason: 'Event Coverage', status: 'approved', amount: 75.00 },
    { id: 2, guardId: 'ME', date: '2026-01-18', hours: 6, reason: 'Staff Shortage', status: 'approved', amount: 112.50 },
    { id: 3, guardId: 'PG', date: '2026-01-16', hours: 8, reason: 'Emergency Cover', status: 'approved', amount: 168.00 },
    { id: 4, guardId: 'PG', date: '2026-01-20', hours: 4, reason: 'Event Coverage', status: 'pending', amount: 84.00 },
    { id: 5, guardId: 'VK', date: '2026-01-14', hours: 4, reason: 'Night Shift Extension', status: 'approved', amount: 78.00 },
    { id: 6, guardId: 'MW', date: '2026-01-19', hours: 4, reason: 'Weekend Cover', status: 'pending', amount: 72.00 },
    { id: 7, guardId: 'MH', date: '2026-01-17', hours: 6, reason: 'Staff Shortage', status: 'approved', amount: 112.50 },
  ];

  const selectedGuardData = guards.find(g => g.id === selectedGuard);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'on-leave': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sick': return 'bg-red-100 text-red-700 border-red-200';
      case 'training': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'on-leave': return 'On Leave';
      case 'sick': return 'Sick Leave';
      case 'training': return 'Training';
      default: return status;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string; border: string } } = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      sky: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
      rose: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    };
    return colorMap[color] || colorMap.blue;
  };

  const guardOvertimeRecords = overtimeRecords.filter(r => r.guardId === selectedGuard);
  const totalOvertimePay = guardOvertimeRecords.reduce((sum, r) => sum + r.amount, 0);
  const pendingOvertimePay = guardOvertimeRecords.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);

  const getShiftPattern = (guardId: string) => {
    switch (guardId) {
      case 'MH':
        return {
          description: 'Monday - Friday',
          time: '07:00 - 17:00',
          type: 'weekday'
        };
      case 'MW':
        return {
          description: 'Saturdays Only',
          time: '06:00 - 18:00',
          type: 'saturday'
        };
      case 'ME':
      case 'VK':
        return {
          description: '4 days on / 4 days off',
          time: guardId === 'ME' ? '06:00 - 18:00' : '18:00 - 06:00',
          type: 'rotation-a'
        };
      case 'PG':
      case 'MC':
        return {
          description: '4 days on / 4 days off',
          time: guardId === 'PG' ? '06:00 - 18:00' : '18:00 - 06:00',
          type: 'rotation-b'
        };
      default:
        return {
          description: 'Standard',
          time: '06:00 - 18:00',
          type: 'standard'
        };
    }
  };

  const getUpcomingShifts = (guardId: string) => {
    const shifts = [];
    const referenceDate = new Date(2026, 0, 1);
    const today = new Date(2026, 0, 20);
    
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dayOfWeek = checkDate.getDay();
      
      const diffTime = checkDate.getTime() - referenceDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      let cycleDay = diffDays % 8;
      if (cycleDay < 0) cycleDay += 8;
      
      let isWorking = false;
      let shiftTime = '';
      
      switch (guardId) {
        case 'MH':
          isWorking = dayOfWeek >= 1 && dayOfWeek <= 5;
          shiftTime = '07:00 - 17:00';
          break;
        case 'MW':
          isWorking = dayOfWeek === 6;
          shiftTime = '06:00 - 18:00';
          break;
        case 'ME':
          isWorking = cycleDay < 4;
          shiftTime = '06:00 - 18:00';
          break;
        case 'VK':
          isWorking = cycleDay < 4;
          shiftTime = '18:00 - 06:00';
          break;
        case 'PG':
          isWorking = cycleDay >= 4;
          shiftTime = '06:00 - 18:00';
          break;
        case 'MC':
          isWorking = cycleDay >= 4;
          shiftTime = '18:00 - 06:00';
          break;
      }
      
      if (isWorking && shifts.length < 5) {
        shifts.push({
          date: checkDate,
          time: shiftTime,
          type: guardId === 'VK' || guardId === 'MC' ? 'Night' : 'Day'
        });
      }
    }
    
    return shifts;
  };

  const getWeeklySchedule = (guardId: string) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const pattern = getShiftPattern(guardId);
    
    return days.map((day, idx) => {
      const dayOfWeek = idx + 1;
      let isWorkDay = false;
      let time = '';
      
      switch (guardId) {
        case 'MH':
          isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 5;
          time = '07:00-17:00';
          break;
        case 'MW':
          isWorkDay = dayOfWeek === 6;
          time = '06:00-18:00';
          break;
        case 'ME':
        case 'PG':
          isWorkDay = null;
          time = '06:00-18:00';
          break;
        case 'VK':
        case 'MC':
          isWorkDay = null;
          time = '18:00-06:00';
          break;
      }
      
      return { day, isWorkDay, time };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center">
                <i className="ri-user-settings-line text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Guard Profiles & Overtime</h1>
                <p className="text-slate-600 mt-1">Manage staff information and overtime payments</p>
              </div>
            </div>
            <Link 
              href="/rota"
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-calendar-line text-lg"></i>
              </div>
              <span>View Rota</span>
            </Link>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Security Staff</h2>
                <div className="space-y-2">
                  {guards.map((guard) => {
                    const colors = getColorClasses(guard.color);
                    return (
                      <button
                        key={guard.id}
                        onClick={() => setSelectedGuard(guard.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                          selectedGuard === guard.id 
                            ? `${colors.bg} ${colors.border} border-2` 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                          <span className={`${colors.text} font-bold text-sm`}>{guard.initials}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-800">{guard.name}</p>
                          <p className="text-xs text-slate-500">{guard.role}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(guard.status)}`}>
                          {getStatusLabel(guard.status)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-span-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="border-b border-slate-200">
                  <div className="flex">
                    {[
                      { id: 'profile', label: 'Profile', icon: 'ri-user-line' },
                      { id: 'overtime', label: 'Overtime', icon: 'ri-time-line' },
                      { id: 'schedule', label: 'Schedule', icon: 'ri-calendar-check-line' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors cursor-pointer ${
                          activeTab === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <i className={`${tab.icon} text-lg`}></i>
                        </div>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'profile' && selectedGuardData && (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-20 h-20 ${getColorClasses(selectedGuardData.color).bg} rounded-full flex items-center justify-center`}>
                            <span className={`${getColorClasses(selectedGuardData.color).text} font-bold text-2xl`}>
                              {selectedGuardData.initials}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-slate-800">{selectedGuardData.name}</h3>
                            <p className="text-slate-600">{selectedGuardData.role}</p>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border mt-2 ${getStatusColor(selectedGuardData.status)}`}>
                              {getStatusLabel(selectedGuardData.status)}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowEditModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-edit-line text-sm"></i>
                          </div>
                          <span>Edit Profile</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <i className="ri-contacts-line text-slate-600"></i>
                            </div>
                            Contact Information
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
                                <i className="ri-mail-line text-slate-600"></i>
                              </div>
                              <span className="text-slate-700">{selectedGuardData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
                                <i className="ri-phone-line text-slate-600"></i>
                              </div>
                              <span className="text-slate-700">{selectedGuardData.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
                                <i className="ri-id-card-line text-slate-600"></i>
                              </div>
                              <span className="text-slate-700">{selectedGuardData.employeeId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <i className="ri-briefcase-line text-slate-600"></i>
                            </div>
                            Employment Details
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
                                <i className="ri-calendar-line text-slate-600"></i>
                              </div>
                              <span className="text-slate-700">Started: {new Date(selectedGuardData.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
                                <i className="ri-sun-line text-slate-600"></i>
                              </div>
                              <span className="text-slate-700">{selectedGuardData.shift} Shift</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
                                <i className="ri-calendar-check-line text-slate-600"></i>
                              </div>
                              <span className="text-slate-700">{selectedGuardData.leaveBalance} days leave remaining</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                          <div className="w-5 h-5 flex items-center justify-center">
                            <i className="ri-award-line text-slate-600"></i>
                          </div>
                          Certifications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedGuardData.certifications.map((cert, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <p className="text-sm text-emerald-600 mb-1">Hours This Month</p>
                          <p className="text-2xl font-bold text-emerald-900">{selectedGuardData.totalHours}h</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <p className="text-sm text-purple-600 mb-1">Overtime Hours</p>
                          <p className="text-2xl font-bold text-purple-900">{selectedGuardData.overtimeHours}h</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'overtime' && selectedGuardData && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Overtime Records - {selectedGuardData.name}</h3>
                        <button 
                          onClick={() => setShowOvertimeModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-add-line text-sm"></i>
                          </div>
                          <span>Add Overtime</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <p className="text-sm text-emerald-600 mb-1">Total Overtime Pay</p>
                          <p className="text-2xl font-bold text-emerald-900">£{totalOvertimePay.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-sm text-blue-600 mb-1">Total Overtime Hours</p>
                          <p className="text-2xl font-bold text-blue-900">{selectedGuardData.overtimeHours}h</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Hours</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Reason</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guardOvertimeRecords.length > 0 ? (
                              guardOvertimeRecords.map((record) => (
                                <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="py-3 px-4 text-sm text-slate-700">
                                    {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="py-3 px-4 text-sm font-medium text-slate-800">{record.hours}h</td>
                                  <td className="py-3 px-4 text-sm text-slate-700">{record.reason}</td>
                                  <td className="py-3 px-4 text-sm font-semibold text-emerald-700">£{record.amount.toFixed(2)}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                      record.status === 'approved' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {record.status === 'approved' ? 'Approved' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      {record.status === 'pending' && (
                                        <>
                                          <button className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors cursor-pointer">
                                            <i className="ri-check-line"></i>
                                          </button>
                                          <button className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors cursor-pointer">
                                            <i className="ri-close-line"></i>
                                          </button>
                                        </>
                                      )}
                                      <button className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                                        <i className="ri-eye-line"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500">
                                  No overtime records found for this guard
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'schedule' && selectedGuardData && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Schedule - {selectedGuardData.name}</h3>
                        <Link 
                          href="/rota"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-calendar-line text-sm"></i>
                          </div>
                          <span>Full Rota</span>
                        </Link>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                            <i className="ri-time-line text-blue-600 text-xl"></i>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Current Shift Pattern</p>
                            <p className="text-sm text-slate-600">{getShiftPattern(selectedGuard).description}</p>
                          </div>
                        </div>
                        
                        {(selectedGuard === 'MH' || selectedGuard === 'MW') ? (
                          <div className="grid grid-cols-7 gap-2">
                            {getWeeklySchedule(selectedGuard).map((item) => (
                              <div 
                                key={item.day}
                                className={`p-3 rounded-lg text-center ${
                                  item.isWorkDay 
                                    ? 'bg-blue-100 border border-blue-200' 
                                    : 'bg-slate-100 border border-slate-200'
                                }`}
                              >
                                <p className="text-xs font-medium text-slate-600 mb-1">{item.day}</p>
                                <p className={`text-sm font-semibold ${item.isWorkDay ? 'text-blue-700' : 'text-slate-400'}`}>
                                  {item.isWorkDay ? item.time : 'Off'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                                <i className="ri-refresh-line text-blue-600"></i>
                              </div>
                              <div>
                                <p className="font-medium text-blue-800">Rotating 8-Day Cycle</p>
                                <p className="text-sm text-blue-600">4 days working, 4 days off</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-8 gap-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((day) => {
                                const isWorkDay = (selectedGuard === 'ME' || selectedGuard === 'VK') 
                                  ? day <= 4 
                                  : day > 4;
                                return (
                                  <div 
                                    key={day}
                                    className={`p-2 rounded text-center ${
                                      isWorkDay 
                                        ? 'bg-blue-200 border border-blue-300' 
                                        : 'bg-slate-100 border border-slate-200'
                                    }`}
                                  >
                                    <p className="text-xs font-medium text-slate-600">Day {day}</p>
                                    <p className={`text-xs font-semibold ${isWorkDay ? 'text-blue-700' : 'text-slate-400'}`}>
                                      {isWorkDay ? 'Work' : 'Off'}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
                              <i className="ri-information-line"></i>
                              <span>
                                {(selectedGuard === 'ME' || selectedGuard === 'VK') 
                                  ? 'Works opposite rotation to P Gill & M Conway'
                                  : 'Works opposite rotation to M Easton & V King'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded">
                              <i className="ri-time-line text-slate-600 text-sm"></i>
                            </div>
                            <span className="text-slate-600">Shift Time:</span>
                            <span className="font-semibold text-slate-800">{getShiftPattern(selectedGuard).time}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              selectedGuard === 'VK' || selectedGuard === 'MC' 
                                ? 'bg-indigo-100 text-indigo-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {selectedGuard === 'VK' || selectedGuard === 'MC' ? 'Night Shift' : 'Day Shift'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200">
                        <div className="p-4 border-b border-slate-200">
                          <h4 className="font-semibold text-slate-800">Upcoming Shifts - January 2026</h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {getUpcomingShifts(selectedGuard).map((shift, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${
                                  shift.type === 'Night' 
                                    ? 'bg-indigo-50 border-indigo-200' 
                                    : 'bg-amber-50 border-amber-200'
                                }`}>
                                  <span className={`text-xs ${shift.type === 'Night' ? 'text-indigo-600' : 'text-amber-600'}`}>
                                    {shift.date.toLocaleDateString('en-GB', { month: 'short' })}
                                  </span>
                                  <span className={`text-lg font-bold ${shift.type === 'Night' ? 'text-indigo-800' : 'text-amber-800'}`}>
                                    {shift.date.getDate()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{shift.type} Shift</p>
                                  <p className="text-sm text-slate-500">{shift.time}</p>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                Scheduled
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showOvertimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Add Overtime Record</h3>
              <button 
                onClick={() => setShowOvertimeModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input type="date" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hours Worked</label>
                <input type="number" min="1" max="12" placeholder="Enter hours" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <select className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                  <option>Event Coverage</option>
                  <option>Staff Shortage</option>
                  <option>Emergency Cover</option>
                  <option>Night Shift Extension</option>
                  <option>Weekend Cover</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea 
                  placeholder="Additional details..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  rows={3}
                  maxLength={500}
                ></textarea>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setShowOvertimeModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowOvertimeModal(false)}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Edit Profile - {selectedGuardData?.name}</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input type="text" defaultValue={selectedGuardData?.name} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <input type="text" defaultValue={selectedGuardData?.role} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input type="email" defaultValue={selectedGuardData?.email} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input type="tel" defaultValue={selectedGuardData?.phone} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Shift</label>
                <select defaultValue={selectedGuardData?.shift} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                  <option>Day</option>
                  <option>Night</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select defaultValue={selectedGuardData?.status} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="training">Training</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

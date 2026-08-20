'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  StaffMember,
  LeaveEntry,
  LeaveRecord,
  months,
  calculateLeaveDays,
  isDateInRange,
} from './types';
import { getMonthlyLeaveForMonth } from './calendar';
import { defaultStaffRows } from './seed';
import StaffAvailability from './components/StaffAvailability';
import LeaveSummary from './components/LeaveSummary';
import CalendarSection from './components/CalendarSection';
import {
  BookingModal,
  HolidayModal,
  QuickBookModal,
  EditLeaveModal,
  HolidayForm,
  emptyHolidayForm,
} from './components/RotaModals';

interface Conflict {
  start: string;
  end: string;
  type: string;
}

function deriveFromRecords(records: LeaveRecord[], totalLeaveDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentLeave = records.find(l => isDateInRange(today, l.start, l.end));
  const upcomingLeave = records
    .filter(l => new Date(l.start) > today)
    .sort((a, b) => a.start.localeCompare(b.start))[0] || null;

  let status: StaffMember['status'] = 'available';
  let statusLabel = 'Available';
  let sickNote: string | undefined;
  let trainingInfo: string | undefined;

  if (currentLeave) {
    if (currentLeave.type === 'Sick Leave') {
      status = 'sick';
      statusLabel = 'Sick Leave';
      sickNote = `Expected return: ${new Date(currentLeave.end).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;
    } else if (currentLeave.type === 'Training') {
      status = 'training';
      statusLabel = 'Training';
      trainingInfo = `Training - ${new Date(currentLeave.start).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}-${new Date(currentLeave.end).toLocaleDateString('en-GB', { day: 'numeric' })}`;
    } else {
      status = 'on-leave';
      statusLabel = 'On Leave';
    }
  }

  const usedLeaveDays = records
    .filter(l => l.type === 'Annual Leave')
    .reduce((sum, l) => sum + calculateLeaveDays(l.start, l.end), 0);

  return { currentLeave, upcomingLeave, status, statusLabel, sickNote, trainingInfo, usedLeaveDays };
}

function buildStaffData(rows: any[], leaveRows: any[]): StaffMember[] {
  return rows.map(r => {
    const records: LeaveRecord[] = leaveRows
      .filter(l => l.staff_initials === r.initials)
      .map(l => ({ id: l.id, start: l.start_date, end: l.end_date, type: l.leave_type }))
      .sort((a, b) => a.start.localeCompare(b.start));

    return {
      initials: r.initials,
      name: r.name,
      shift: r.shift,
      time: r.shift_time,
      pattern: r.shift_pattern,
      color: r.color,
      totalLeaveDays: r.total_leave_days,
      monthlyLeave: { annualLeave: 0, sickLeave: 0, training: 0, other: 0 },
      leaveRecords: records,
      ...deriveFromRecords(records, r.total_leave_days),
    };
  });
}

export default function RotaPage() {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidaySaved, setHolidaySaved] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState({ month: 0, year: 2026 });
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [quickBookDate, setQuickBookDate] = useState<{ day: number; month: number; year: number } | null>(null);
  const [showEditLeaveModal, setShowEditLeaveModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveEntry | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; month: number; year: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; month: number; year: number } | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [leaveConflicts, setLeaveConflicts] = useState<Conflict[]>([]);
  const [holidayForm, setHolidayForm] = useState<HolidayForm>(emptyHolidayForm);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [staffRes, leaveRes] = await Promise.all([
        supabase.from('rota_staff').select('*').order('sort_order'),
        supabase.from('leave_records').select('*').order('id', { ascending: true }),
      ]);
      if (cancelled) return;
      const rows = staffRes.data && staffRes.data.length ? staffRes.data : defaultStaffRows;
      setStaffData(buildStaffData(rows, leaveRes.data || []));
    })();
    return () => { cancelled = true; };
  }, []);

  const insertLeaveRecord = async (staffInitials: string, staffName: string, start: string, end: string, type: string) => {
    const { data, error } = await supabase
      .from('leave_records')
      .insert({ staff_initials: staffInitials, staff_name: staffName, start_date: start, end_date: end, leave_type: type })
      .select('id')
      .single();
    if (error) {
      console.error('Insert error:', error);
      return null;
    }
    return data.id as number;
  };

  const updateLeaveRecord = async (id: number | undefined, start: string, end: string, type: string) => {
    if (!id) return;
    const { error } = await supabase
      .from('leave_records')
      .update({ start_date: start, end_date: end, leave_type: type })
      .eq('id', id);
    if (error) console.error('Update error:', error);
  };

  const deleteLeaveRecord = async (id: number | undefined) => {
    if (!id) return;
    const { error } = await supabase.from('leave_records').delete().eq('id', id);
    if (error) console.error('Delete error:', error);
  };

  const checkLeaveConflicts = (staffName: string, startDate: string, endDate: string, excludeIndex?: number) => {
    const staff = staffData.find(s => s.name === staffName);
    if (!staff || !startDate || !endDate) {
      setLeaveConflicts([]);
      return [];
    }

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    const conflicts = staff.leaveRecords.filter((leave, idx) => {
      if (excludeIndex !== undefined && idx === excludeIndex) return false;
      const existingStart = new Date(leave.start);
      const existingEnd = new Date(leave.end);
      return (newStart <= existingEnd && newEnd >= existingStart);
    });

    setLeaveConflicts(conflicts);
    return conflicts;
  };

  const handleHolidayFormChange = (field: string, value: string) => {
    const newForm = { ...holidayForm, [field]: value };
    setHolidayForm(newForm);

    if (newForm.staffMember && newForm.startDate && newForm.endDate) {
      checkLeaveConflicts(newForm.staffMember, newForm.startDate, newForm.endDate);
    } else {
      setLeaveConflicts([]);
    }
  };

  const handleEditLeaveChange = (field: string, value: string) => {
    if (!editingLeave) return;
    const newLeave = { ...editingLeave, [field]: value };
    setEditingLeave(newLeave);
    if (newLeave.start && newLeave.end) {
      checkLeaveConflicts(newLeave.staffName, newLeave.start, newLeave.end, newLeave.index);
    } else {
      setLeaveConflicts([]);
    }
  };

  const resetHolidayForm = () => setHolidayForm({ ...emptyHolidayForm });

  const closeBooking = () => {
    setShowBookingModal(false);
    setBookingSubmitted(false);
  };

  const closeHoliday = () => {
    setShowHolidayModal(false);
    setHolidaySaved(false);
    setLeaveConflicts([]);
    resetHolidayForm();
  };

  const closeQuickBook = () => {
    setShowQuickBookModal(false);
    setQuickBookDate(null);
    setHolidaySaved(false);
    setLeaveConflicts([]);
    resetHolidayForm();
  };

  const closeEditLeave = () => {
    setShowEditLeaveModal(false);
    setEditingLeave(null);
    setHolidaySaved(false);
    setLeaveConflicts([]);
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.staffMember || !holidayForm.startDate || !holidayForm.endDate) return;
    if (leaveConflicts.length > 0) return;

    const staff = staffData.find(s => s.name === holidayForm.staffMember);
    if (!staff) return;

    const newId = await insertLeaveRecord(staff.initials, staff.name, holidayForm.startDate, holidayForm.endDate, holidayForm.leaveType);

    setStaffData(prev =>
      prev.map(member => {
        if (member.name !== holidayForm.staffMember) return member;
        const newRecords: LeaveRecord[] = [...member.leaveRecords, {
          id: newId ?? undefined,
          start: holidayForm.startDate,
          end: holidayForm.endDate,
          type: holidayForm.leaveType,
        }];
        return { ...member, ...deriveFromRecords(newRecords, member.totalLeaveDays), leaveRecords: newRecords };
      })
    );

    setHolidaySaved(true);
    setTimeout(() => {
      setShowHolidayModal(false);
      setHolidaySaved(false);
      resetHolidayForm();
    }, 1500);
  };

  const handleQuickBookClick = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setQuickBookDate({ day, month, year });
    setHolidayForm({ ...holidayForm, startDate: dateStr, endDate: dateStr });
    setShowQuickBookModal(true);
  };

  const handleQuickBookSave = async () => {
    if (!holidayForm.staffMember || !holidayForm.startDate || !holidayForm.endDate) return;
    if (leaveConflicts.length > 0) return;

    const staff = staffData.find(s => s.name === holidayForm.staffMember);
    if (!staff) return;

    const newId = await insertLeaveRecord(staff.initials, staff.name, holidayForm.startDate, holidayForm.endDate, holidayForm.leaveType);

    setStaffData(prev =>
      prev.map(member => {
        if (member.name !== holidayForm.staffMember) return member;
        const newRecords: LeaveRecord[] = [...member.leaveRecords, {
          id: newId ?? undefined,
          start: holidayForm.startDate,
          end: holidayForm.endDate,
          type: holidayForm.leaveType,
        }];
        return { ...member, ...deriveFromRecords(newRecords, member.totalLeaveDays), leaveRecords: newRecords };
      })
    );

    setHolidaySaved(true);
    setTimeout(() => {
      setShowQuickBookModal(false);
      setHolidaySaved(false);
      setQuickBookDate(null);
      resetHolidayForm();
    }, 1500);
  };

  const handleDragStart = (day: number, month: number, year: number) => {
    setIsDragging(true);
    setDragStart({ day, month, year });
    setDragEnd({ day, month, year });
  };

  const handleDragEnter = (day: number, month: number, year: number) => {
    if (isDragging) setDragEnd({ day, month, year });
  };

  const handleDragEnd = () => {
    if (isDragging && dragStart && dragEnd) {
      const startDate = new Date(dragStart.year, dragStart.month, dragStart.day);
      const endDate = new Date(dragEnd.year, dragEnd.month, dragEnd.day);

      const actualStart = startDate <= endDate ? dragStart : dragEnd;
      const actualEnd = startDate <= endDate ? dragEnd : dragStart;

      const startStr = `${actualStart.year}-${String(actualStart.month + 1).padStart(2, '0')}-${String(actualStart.day).padStart(2, '0')}`;
      const endStr = `${actualEnd.year}-${String(actualEnd.month + 1).padStart(2, '0')}-${String(actualEnd.day).padStart(2, '0')}`;

      setHolidayForm({ ...holidayForm, startDate: startStr, endDate: endStr });
      setQuickBookDate(actualStart);
      setShowQuickBookModal(true);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleLeaveClick = (e: React.MouseEvent, staffInitials: string, date: Date) => {
    e.stopPropagation();
    const staff = staffData.find(s => s.initials === staffInitials);
    if (!staff) return;

    const leaveIndex = staff.leaveRecords.findIndex(leave => isDateInRange(date, leave.start, leave.end));
    if (leaveIndex !== -1) {
      const leave = staff.leaveRecords[leaveIndex];
      setEditingLeave({
        id: leave.id,
        staffInitials: staff.initials,
        staffName: staff.name,
        start: leave.start,
        end: leave.end,
        type: leave.type,
        index: leaveIndex,
      });
      setShowEditLeaveModal(true);
    }
  };

  const handleUpdateLeave = async () => {
    if (!editingLeave) return;
    if (leaveConflicts.length > 0) return;

    await updateLeaveRecord(editingLeave.id, editingLeave.start, editingLeave.end, editingLeave.type);

    setStaffData(prev =>
      prev.map(member => {
        if (member.initials !== editingLeave.staffInitials) return member;
        const newRecords = [...member.leaveRecords];
        newRecords[editingLeave.index] = {
          id: editingLeave.id,
          start: editingLeave.start,
          end: editingLeave.end,
          type: editingLeave.type,
        };
        return { ...member, ...deriveFromRecords(newRecords, member.totalLeaveDays), leaveRecords: newRecords };
      })
    );

    setHolidaySaved(true);
    setTimeout(() => {
      setShowEditLeaveModal(false);
      setHolidaySaved(false);
      setEditingLeave(null);
    }, 1500);
  };

  const handleCancelLeave = async () => {
    if (!editingLeave) return;

    await deleteLeaveRecord(editingLeave.id);

    setStaffData(prev =>
      prev.map(member => {
        if (member.initials !== editingLeave.staffInitials) return member;
        const newRecords = member.leaveRecords.filter((_, idx) => idx !== editingLeave.index);
        return { ...member, ...deriveFromRecords(newRecords, member.totalLeaveDays), leaveRecords: newRecords };
      })
    );

    setHolidaySaved(true);
    setTimeout(() => {
      setShowEditLeaveModal(false);
      setHolidaySaved(false);
      setEditingLeave(null);
    }, 1500);
  };

  const selectedMonthStaffData = staffData.map(member => ({
    ...member,
    monthlyLeave: getMonthlyLeaveForMonth(member, selectedSummaryMonth.month, selectedSummaryMonth.year),
  }));

  const totalTeamDaysOff = selectedMonthStaffData.reduce((sum, m) => sum + m.monthlyLeave.annualLeave + m.monthlyLeave.sickLeave + m.monthlyLeave.training + m.monthlyLeave.other, 0);
  const totalAnnualLeave = selectedMonthStaffData.reduce((sum, m) => sum + m.monthlyLeave.annualLeave, 0);
  const totalSickLeave = selectedMonthStaffData.reduce((sum, m) => sum + m.monthlyLeave.sickLeave, 0);
  const totalTraining = selectedMonthStaffData.reduce((sum, m) => sum + m.monthlyLeave.training, 0);

  const exportToCSV = () => {
    const headers = ['Staff Member', 'Annual Leave', 'Sick Leave', 'Training', 'Other', 'Total Days Off'];
    const rows = selectedMonthStaffData.map(member => [
      member.name,
      member.monthlyLeave.annualLeave,
      member.monthlyLeave.sickLeave,
      member.monthlyLeave.training,
      member.monthlyLeave.other,
      member.monthlyLeave.annualLeave + member.monthlyLeave.sickLeave + member.monthlyLeave.training + member.monthlyLeave.other,
    ]);

    rows.push(['', '', '', '', '', '']);
    rows.push(['TOTALS', totalAnnualLeave, totalSickLeave, totalTraining, 0, totalTeamDaysOff]);

    const csvContent = [
      [`Monthly Leave Summary - ${months[selectedSummaryMonth.month]} ${selectedSummaryMonth.year}`],
      [''],
      headers,
      ...rows,
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leave_summary_${months[selectedSummaryMonth.month].toLowerCase()}_${selectedSummaryMonth.year}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setShowExportDropdown(false);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = selectedMonthStaffData.map(member => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${member.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.annualLeave}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.sickLeave}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.training}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.other}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${member.monthlyLeave.annualLeave + member.monthlyLeave.sickLeave + member.monthlyLeave.training + member.monthlyLeave.other}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Leave Summary - ${months[selectedSummaryMonth.month]} ${selectedSummaryMonth.year}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
          h1 { color: #1e293b; margin-bottom: 8px; }
          .subtitle { color: #64748b; margin-bottom: 30px; }
          .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
          .card { padding: 16px 24px; border-radius: 8px; flex: 1; }
          .card-blue { background: #eff6ff; border: 1px solid #bfdbfe; }
          .card-red { background: #fef2f2; border: 1px solid #fecaca; }
          .card-purple { background: #faf5ff; border: 1px solid #e9d5ff; }
          .card-gray { background: #f8fafc; border: 1px solid #e2e8f0; }
          .card-label { font-size: 14px; color: #64748b; margin-bottom: 4px; }
          .card-value { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
          th:not(:first-child) { text-align: center; }
          .totals-row { background: #f8fafc; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Monthly Leave Summary</h1>
        <p class="subtitle">${months[selectedSummaryMonth.month]} ${selectedSummaryMonth.year}</p>
        <div class="summary-cards">
          <div class="card card-blue"><div class="card-label">Annual Leave</div><div class="card-value" style="color: #1d4ed8;">${totalAnnualLeave} days</div></div>
          <div class="card card-red"><div class="card-label">Sick Leave</div><div class="card-value" style="color: #dc2626;">${totalSickLeave} days</div></div>
          <div class="card card-purple"><div class="card-label">Training</div><div class="card-value" style="color: #7c3aed;">${totalTraining} days</div></div>
          <div class="card card-gray"><div class="card-label">Total Days Off</div><div class="card-value" style="color: #1e293b;">${totalTeamDaysOff} days</div></div>
        </div>
        <table>
          <thead><tr><th>Staff Member</th><th>Annual Leave</th><th>Sick Leave</th><th>Training</th><th>Other</th><th>Total Days Off</th></tr></thead>
          <tbody>
            ${tableRows}
            <tr class="totals-row"><td style="padding: 12px; border-top: 2px solid #e2e8f0;">TOTALS</td><td style="padding: 12px; border-top: 2px solid #e2e8f0; text-align: center;">${totalAnnualLeave}</td><td style="padding: 12px; border-top: 2px solid #e2e8f0; text-align: center;">${totalSickLeave}</td><td style="padding: 12px; border-top: 2px solid #e2e8f0; text-align: center;">${totalTraining}</td><td style="padding: 12px; border-top: 2px solid #e2e8f0; text-align: center;">0</td><td style="padding: 12px; border-top: 2px solid #e2e8f0; text-align: center;">${totalTeamDaysOff}</td></tr>
          </tbody>
        </table>
        <div class="footer">Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
    setShowExportDropdown(false);
  };

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await fetch('https://readdy.ai/api/form/d66uf4iud6iuf6if10fg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });
      setBookingSubmitted(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSubmitted(false);
        form.reset();
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const availableCount = staffData.filter(s => s.status === 'available').length;
  const unavailableCount = staffData.filter(s => s.status !== 'available').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center">
                <i className="ri-calendar-line text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800">2026 Staff Rota</h1>
                <p className="text-slate-600 mt-1">12-hour shift schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/staff"
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-team-line text-lg"></i>
                </div>
                <span>Manage Staff</span>
              </Link>
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-shield-user-line text-lg"></i>
                </div>
                <span>Book Samsic Guard</span>
              </button>
              <button
                onClick={() => setShowHolidayModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-plane-line text-lg"></i>
                </div>
                <span>Manage Holidays</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-sm px-5 py-3.5 border border-emerald-500 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg">
                  <i className="ri-shield-user-line text-white text-lg"></i>
                </div>
                <p className="text-emerald-50 text-sm">Need additional security coverage? Book a Samsic Guard for events, cover shifts, or extra security.</p>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors font-semibold whitespace-nowrap cursor-pointer shadow"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-calendar-check-line text-base"></i>
                </div>
                <span>Book Now</span>
              </button>
            </div>
          </div>

          <CalendarSection
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            staffData={staffData}
            handleQuickBookClick={handleQuickBookClick}
            handleLeaveClick={handleLeaveClick}
            isDragging={isDragging}
            dragStart={dragStart}
            dragEnd={dragEnd}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragEnd={handleDragEnd}
            showLegend={showLegend}
            setShowLegend={setShowLegend}
          />

          <StaffAvailability
            staffData={staffData}
            availableCount={availableCount}
            unavailableCount={unavailableCount}
          />

          <LeaveSummary
            selectedMonthStaffData={selectedMonthStaffData}
            selectedSummaryMonth={selectedSummaryMonth}
            setSelectedSummaryMonth={setSelectedSummaryMonth}
            showMonthPicker={showMonthPicker}
            setShowMonthPicker={setShowMonthPicker}
            showExportDropdown={showExportDropdown}
            setShowExportDropdown={setShowExportDropdown}
            onExportCSV={exportToCSV}
            onExportPDF={exportToPDF}
            totalTeamDaysOff={totalTeamDaysOff}
            totalAnnualLeave={totalAnnualLeave}
            totalSickLeave={totalSickLeave}
            totalTraining={totalTraining}
          />
        </div>
      </main>

      <BookingModal
        open={showBookingModal}
        onClose={closeBooking}
        submitted={bookingSubmitted}
        setSubmitted={setBookingSubmitted}
        submitting={bookingSubmitting}
        onSubmit={handleBookingSubmit}
      />

      <HolidayModal
        open={showHolidayModal}
        onClose={closeHoliday}
        saved={holidaySaved}
        setSaved={setHolidaySaved}
        conflicts={leaveConflicts}
        form={holidayForm}
        onChange={handleHolidayFormChange}
        onSave={handleSaveHoliday}
        staffData={staffData}
      />

      <QuickBookModal
        open={showQuickBookModal}
        date={quickBookDate}
        onClose={closeQuickBook}
        saved={holidaySaved}
        setSaved={setHolidaySaved}
        conflicts={leaveConflicts}
        form={holidayForm}
        onChange={handleHolidayFormChange}
        onSave={handleQuickBookSave}
        staffData={staffData}
      />

      <EditLeaveModal
        open={showEditLeaveModal}
        leave={editingLeave}
        onClose={closeEditLeave}
        saved={holidaySaved}
        setSaved={setHolidaySaved}
        conflicts={leaveConflicts}
        onChange={handleEditLeaveChange}
        onUpdate={handleUpdateLeave}
        onCancelLeave={handleCancelLeave}
      />
    </div>
  );
}
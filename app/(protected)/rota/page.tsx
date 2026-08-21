'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import { fetchOrgProfiles } from '@/lib/profile';
import * as rota from '@/lib/rota';
import type { Profile } from '@/lib/profile';
import type { ShiftType } from '@/lib/rota';
import {
  StaffMember,
  LeaveRecord,
  ShiftAssignment,
  months,
  calculateLeaveDays,
  isDateInRange,
  initialsFromName,
} from './types';
import { getMonthlyLeaveForMonth } from './calendar';

import StaffAvailability from './components/StaffAvailability';
import LeaveSummary from './components/LeaveSummary';
import CalendarSection from './components/CalendarSection';
import RequestPanel from './components/RequestPanel';
import {
  BookingModal,
  HolidayModal,
  QuickBookModal,
  OvertimeModal,
  AssignShiftModal,
  HolidayForm,
  emptyHolidayForm,
  OvertimeForm,
  emptyOvertimeForm,
  AssignShiftForm,
  emptyAssignShiftForm,
} from './components/RotaModals';

const PALETTE = ['blue', 'sky', 'emerald', 'teal', 'amber', 'rose', 'indigo'];

interface Conflict {
  start: string;
  end: string;
  type: string;
}

function deriveFromRecords(records: LeaveRecord[], totalLeaveDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentLeave = records.find((l) => isDateInRange(today, l.start, l.end));
  const upcomingLeave =
    records
      .filter((l) => new Date(l.start) > today)
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
    .filter((l) => l.type === 'Annual Leave')
    .reduce((sum, l) => sum + calculateLeaveDays(l.start, l.end), 0);

  return { currentLeave, upcomingLeave, status, statusLabel, sickNote, trainingInfo, usedLeaveDays };
}

function buildStaffData(profiles: Profile[], leaveRequests: rota.LeaveRequest[], entitlement: number): StaffMember[] {
  const active = profiles.filter((p) => p.status !== 'inactive');
  return active.map((p, i) => {
    const records: LeaveRecord[] = leaveRequests
      .filter((l) => l.staff_user_id === p.user_id && l.status === 'approved')
      .map((l) => ({ id: l.id, start: l.start_date, end: l.end_date, type: l.leave_type }))
      .sort((a, b) => a.start.localeCompare(b.start));

    return {
      userId: p.user_id,
      initials: initialsFromName(p.full_name || ''),
      name: p.full_name || 'Unnamed',
      shift: (p.shift === 'Night' ? 'Night' : 'Day') as 'Day' | 'Night',
      time: p.shift === 'Night' ? '18:00-06:00' : '06:00-18:00',
      pattern: p.work_pattern ?? '',
      patternStartDate: p.pattern_start_date ?? null,
      color: PALETTE[i % PALETTE.length],
      totalLeaveDays: entitlement,
      monthlyLeave: { annualLeave: 0, sickLeave: 0, training: 0, other: 0 },
      leaveRecords: records,
      ...deriveFromRecords(records, entitlement),
    };
  });
}

export default function RotaPage() {
  const { user, role } = useAuth();
  const canManage = roleRank(role) >= 2;

  const [orgId, setOrgId] = useState<string | null>(null);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [assignmentsByDate, setAssignmentsByDate] = useState<Record<string, ShiftAssignment[]>>({});
  const [leaveRequests, setLeaveRequests] = useState<rota.LeaveRequest[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<rota.OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dataVersion, setDataVersion] = useState(0);

  const [currentMonth, setCurrentMonth] = useState(0);
  const now = new Date();
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState({ month: now.getMonth(), year: now.getFullYear() });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidaySaved, setHolidaySaved] = useState(false);
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);
  const [holidayError, setHolidayError] = useState('');

  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [quickBookDate, setQuickBookDate] = useState<{ day: number; month: number; year: number } | null>(null);

  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeSaved, setOvertimeSaved] = useState(false);
  const [overtimeSubmitting, setOvertimeSubmitting] = useState(false);
  const [overtimeError, setOvertimeError] = useState('');

  const [showAssignShiftModal, setShowAssignShiftModal] = useState(false);
  const [assignSaved, setAssignSaved] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [leaveConflicts, setLeaveConflicts] = useState<Conflict[]>([]);
  const [requestError, setRequestError] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; month: number; year: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; month: number; year: number } | null>(null);

  const [holidayForm, setHolidayForm] = useState<HolidayForm>(emptyHolidayForm);
  const [overtimeForm, setOvertimeForm] = useState<OvertimeForm>(emptyOvertimeForm);
  const [assignShiftForm, setAssignShiftForm] = useState<AssignShiftForm>(emptyAssignShiftForm);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const org = await rota.getMyOrgId();
        if (!org) {
          if (!cancelled) {
            setOrgId(null);
            setStaffData([]);
            setLoading(false);
          }
          return;
        }
        setOrgId(org);
        const y = new Date().getFullYear();
        const [profiles, shifts, settings, leave, overtime, assignments] = await Promise.all([
          fetchOrgProfiles(org),
          rota.fetchShiftTypes(org),
          rota.fetchOrgSettings(org),
          rota.fetchLeaveRequests(org),
          rota.fetchOvertimeRequests(org),
          rota.fetchAssignments(org, `${y - 2}-01-01`, `${y + 2}-12-31`),
        ]);
        if (cancelled) return;
        const entitlement = settings?.annual_leave_entitlement ?? 25;
        setStaffData(buildStaffData(profiles, leave, entitlement));
        setShiftTypes(shifts);
        setLeaveRequests(leave);
        setOvertimeRequests(overtime);

        const byDate: Record<string, ShiftAssignment[]> = {};
        assignments.forEach((a) => {
          const st = shifts.find((t) => t.id === a.shift_type_id);
          const key = a.assignment_date;
          if (!byDate[key]) byDate[key] = [];
          byDate[key].push({ ...a, code: st?.code || '', name: st?.name || '', color: st?.color || 'blue' });
        });
        setAssignmentsByDate(byDate);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load rota data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  const reload = useCallback(() => setDataVersion((v) => v + 1), []);

  const checkLeaveConflicts = (staffUserId: string, startDate: string, endDate: string) => {
    const staff = staffData.find((s) => s.userId === staffUserId);
    if (!staff || !startDate || !endDate) {
      setLeaveConflicts([]);
      return [];
    }
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    const conflicts = staff.leaveRecords.filter((leave) => {
      const existingStart = new Date(leave.start);
      const existingEnd = new Date(leave.end);
      return newStart <= existingEnd && newEnd >= existingStart;
    });
    setLeaveConflicts(conflicts);
    return conflicts;
  };

  const handleHolidayFormChange = (field: string, value: string) => {
    const newForm = { ...holidayForm, [field]: value };
    setHolidayForm(newForm);
    if (newForm.staffUserId && newForm.startDate && newForm.endDate) {
      checkLeaveConflicts(newForm.staffUserId, newForm.startDate, newForm.endDate);
    } else {
      setLeaveConflicts([]);
    }
  };

  const resetHolidayForm = () => setHolidayForm({ ...emptyHolidayForm, staffUserId: user?.id ?? '' });

  const openHoliday = () => {
    setHolidayForm({ ...emptyHolidayForm, staffUserId: user?.id ?? '' });
    setHolidayError('');
    setHolidaySaved(false);
    setLeaveConflicts([]);
    setShowHolidayModal(true);
  };

  const closeHoliday = () => {
    setShowHolidayModal(false);
    setHolidaySaved(false);
    setHolidayError('');
    setLeaveConflicts([]);
    resetHolidayForm();
  };

  const closeQuickBook = () => {
    setShowQuickBookModal(false);
    setQuickBookDate(null);
    setHolidaySaved(false);
    setHolidayError('');
    setLeaveConflicts([]);
    resetHolidayForm();
  };

  const closeOvertime = () => {
    setShowOvertimeModal(false);
    setOvertimeSaved(false);
    setOvertimeError('');
    setOvertimeForm({ ...emptyOvertimeForm, staffUserId: user?.id ?? '' });
  };

  const closeAssignShift = () => {
    setShowAssignShiftModal(false);
    setAssignSaved(false);
    setAssignError('');
    setAssignShiftForm(emptyAssignShiftForm);
  };

  const closeBooking = () => {
    setShowBookingModal(false);
    setBookingSubmitted(false);
    setBookingError('');
  };

  const submitLeaveFromForm = async (): Promise<string | null> => {
    if (!orgId || !holidayForm.staffUserId || !holidayForm.startDate || !holidayForm.endDate) {
      return 'Please complete all required fields.';
    }
    if (leaveConflicts.length > 0) return 'Please resolve the leave conflict first.';
    try {
      await rota.submitLeaveRequest(
        orgId,
        holidayForm.staffUserId,
        holidayForm.leaveType,
        holidayForm.startDate,
        holidayForm.endDate,
        holidayForm.notes || undefined,
      );
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Could not submit the leave request.';
    }
  };

  const handleSaveHoliday = async () => {
    setHolidaySubmitting(true);
    setHolidayError('');
    const err = await submitLeaveFromForm();
    if (!err) {
      setHolidaySaved(true);
      setTimeout(() => closeHoliday(), 1500);
      reload();
    } else {
      setHolidayError(err);
    }
    setHolidaySubmitting(false);
  };

  const handleQuickBookSave = async () => {
    setHolidaySubmitting(true);
    setHolidayError('');
    const err = await submitLeaveFromForm();
    if (!err) {
      setHolidaySaved(true);
      setTimeout(() => closeQuickBook(), 1500);
      reload();
    } else {
      setHolidayError(err);
    }
    setHolidaySubmitting(false);
  };

  const handleSaveOvertime = async () => {
    if (!orgId || !overtimeForm.staffUserId || !overtimeForm.overtimeDate) return;
    setOvertimeSubmitting(true);
    setOvertimeError('');
    try {
      await rota.submitOvertimeRequest(
        orgId,
        overtimeForm.staffUserId,
        overtimeForm.overtimeDate,
        overtimeForm.startTime || undefined,
        overtimeForm.endTime || undefined,
        overtimeForm.hours ? parseFloat(overtimeForm.hours) : undefined,
        overtimeForm.reason || undefined,
      );
      setOvertimeSaved(true);
      setTimeout(() => closeOvertime(), 1500);
      reload();
    } catch (e) {
      setOvertimeError(e instanceof Error ? e.message : 'Could not submit the overtime request.');
    } finally {
      setOvertimeSubmitting(false);
    }
  };

  const handleSaveAssignShift = async () => {
    if (!orgId || !assignShiftForm.staffUserId || !assignShiftForm.assignmentDate || !assignShiftForm.shiftTypeId) return;
    setAssignSubmitting(true);
    setAssignError('');
    try {
      await rota.assignShift(orgId, assignShiftForm.staffUserId, assignShiftForm.assignmentDate, assignShiftForm.shiftTypeId);
      setAssignSaved(true);
      setTimeout(() => closeAssignShift(), 1500);
      reload();
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Could not assign the shift.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleQuickBookClick = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setQuickBookDate({ day, month, year });
    setHolidayForm({ ...emptyHolidayForm, staffUserId: user?.id ?? '', startDate: dateStr, endDate: dateStr });
    setHolidayError('');
    setLeaveConflicts([]);
    setShowQuickBookModal(true);
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
      setHolidayForm({ ...holidayForm, staffUserId: user?.id ?? '', startDate: startStr, endDate: endStr });
      setQuickBookDate(actualStart);
      setShowQuickBookModal(true);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const runRequestAction = async (fn: () => Promise<void>) => {
    setRequestError('');
    try {
      await fn();
      reload();
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : 'Action failed.');
    }
  };

  const handleApproveLeave = (id: string) => runRequestAction(() => rota.decideLeaveRequest(id, 'approved'));
  const handleRejectLeave = (id: string) => runRequestAction(() => rota.decideLeaveRequest(id, 'rejected'));
  const handleWithdrawLeave = (id: string) => runRequestAction(() => rota.withdrawLeaveRequest(id));
  const handleApproveOvertime = (id: string) => runRequestAction(() => rota.decideOvertimeRequest(id, 'approved'));
  const handleRejectOvertime = (id: string) => runRequestAction(() => rota.decideOvertimeRequest(id, 'rejected'));

  const handleRemoveAssignment = (assignmentId: string) => {
    if (!window.confirm('Remove this shift assignment?')) return;
    runRequestAction(() => rota.removeShiftAssignment(assignmentId));
  };

  const selectedMonthStaffData = staffData.map((member) => ({
    ...member,
    monthlyLeave: getMonthlyLeaveForMonth(member, selectedSummaryMonth.month, selectedSummaryMonth.year),
  }));

  const totalTeamDaysOff = selectedMonthStaffData.reduce(
    (sum, m) => sum + m.monthlyLeave.annualLeave + m.monthlyLeave.sickLeave + m.monthlyLeave.training + m.monthlyLeave.other,
    0,
  );
  const totalAnnualLeave = selectedMonthStaffData.reduce((sum, m) => sum + m.monthlyLeave.annualLeave, 0);
  const totalSickLeave = selectedMonthStaffData.reduce((sum, m) => sum + m.monthlyLeave.sickLeave, 0);
  const totalTraining = selectedMonthStaffData.reduce((sum, m) => sum + m.monthlyLeave.training, 0);

  const exportToCSV = () => {
    const headers = ['Staff Member', 'Annual Leave', 'Sick Leave', 'Training', 'Other', 'Total Days Off'];
    const rows = selectedMonthStaffData.map((member) => [
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
    ]
      .map((row) => row.join(','))
      .join('\n');
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
    const tableRows = selectedMonthStaffData
      .map(
        (member) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${member.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.annualLeave}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.sickLeave}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.training}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${member.monthlyLeave.other}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${member.monthlyLeave.annualLeave + member.monthlyLeave.sickLeave + member.monthlyLeave.training + member.monthlyLeave.other}</td>
      </tr>`,
      )
      .join('');
    const htmlContent = `
      <!DOCTYPE html><html><head><title>Leave Summary</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}h1{color:#1e293b}.subtitle{color:#64748b;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f8fafc;padding:12px;text-align:left;border-bottom:2px solid #e2e8f0}th:not(:first-child){text-align:center}</style>
      </head><body>
      <h1>Monthly Leave Summary</h1>
      <p class="subtitle">${months[selectedSummaryMonth.month]} ${selectedSummaryMonth.year}</p>
      <table><thead><tr><th>Staff Member</th><th>Annual Leave</th><th>Sick Leave</th><th>Training</th><th>Other</th><th>Total Days Off</th></tr></thead>
      <tbody>${tableRows}</tbody></table></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
    setShowExportDropdown(false);
  };

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = (formData.get('website_alt') as string | null) ?? '';
    if (honeypot.trim() !== '') {
      formData.delete('website_alt');
      setBookingSubmitted(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSubmitted(false);
        setBookingError('');
        form.reset();
      }, 2000);
      return;
    }
    formData.delete('website_alt');

    setBookingSubmitting(true);
    setBookingError('');
    try {
      const response = await fetch('https://readdy.ai/api/form/da3q6eh0938upkd4he90', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });
      const responseText = await response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }
      const code = parsed?.code;
      const serverMsg = parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || responseText;
      const isSpam = typeof serverMsg === 'string' && /spam/i.test(serverMsg);

      if (response.ok && code === 'OK' && !isSpam) {
        setBookingSubmitted(true);
        setTimeout(() => {
          setShowBookingModal(false);
          setBookingSubmitted(false);
          setBookingError('');
          form.reset();
        }, 2000);
      } else {
        setBookingError(typeof serverMsg === 'string' && serverMsg ? serverMsg : 'Could not submit the booking request. Please try again.');
      }
    } catch (err) {
      setBookingError('Could not submit the booking request. Please check your connection and try again.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const availableCount = staffData.filter((s) => s.status === 'available').length;
  const unavailableCount = staffData.filter((s) => s.status !== 'available').length;

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
                <h1 className="text-4xl font-bold text-slate-800">Staff Rota</h1>
                <p className="text-slate-600 mt-1">12-hour shift schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
                onClick={openHoliday}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-plane-line text-lg"></i>
                </div>
                <span>Request Leave</span>
              </button>
              <button
                onClick={() => {
                  setOvertimeForm({ ...emptyOvertimeForm, staffUserId: user?.id ?? '' });
                  setOvertimeError('');
                  setOvertimeSaved(false);
                  setShowOvertimeModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-time-line text-lg"></i>
                </div>
                <span>Request Overtime</span>
              </button>
              {canManage && (
                <button
                  onClick={() => {
                    setAssignShiftForm(emptyAssignShiftForm);
                    setAssignError('');
                    setAssignSaved(false);
                    setShowAssignShiftModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-calendar-todo-line text-lg"></i>
                  </div>
                  <span>Assign Shift</span>
                </button>
              )}
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-shield-user-line text-lg"></i>
                </div>
                <span>Book Samsic Guard</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-loader-4-line text-3xl animate-spin text-slate-400"></i>
              </div>
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
              <p className="text-red-600 mb-2">Could not load rota data.</p>
              <p className="text-sm text-slate-500">{loadError}</p>
            </div>
          ) : !orgId ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
              <div className="w-14 h-14 mx-auto flex items-center justify-center bg-slate-100 rounded-full mb-4">
                <i className="ri-building-2-line text-2xl text-slate-400"></i>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">No organisation set up</h2>
              <p className="text-sm text-slate-500 mb-5">Set up your organisation to start building the rota.</p>
              <Link
                href="/staff"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
              >
                <i className="ri-team-line"></i>
                <span>Go to Staff</span>
              </Link>
            </div>
          ) : (
            <>
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

              {requestError && (
                <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                  <i className="ri-error-warning-line"></i>
                  {requestError}
                </div>
              )}

              <CalendarSection
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                staffData={staffData}
                assignmentsByDate={assignmentsByDate}
                canManage={canManage}
                onRemoveAssignment={handleRemoveAssignment}
                handleQuickBookClick={handleQuickBookClick}
                handleLeaveClick={() => {}}
                isDragging={isDragging}
                dragStart={dragStart}
                dragEnd={dragEnd}
                handleDragStart={handleDragStart}
                handleDragEnter={handleDragEnter}
                handleDragEnd={handleDragEnd}
                showLegend={showLegend}
                setShowLegend={setShowLegend}
              />

              <RequestPanel
                leaveRequests={leaveRequests}
                overtimeRequests={overtimeRequests}
                staffData={staffData}
                currentUserId={user?.id ?? null}
                canManage={canManage}
                onApproveLeave={handleApproveLeave}
                onRejectLeave={handleRejectLeave}
                onWithdrawLeave={handleWithdrawLeave}
                onApproveOvertime={handleApproveOvertime}
                onRejectOvertime={handleRejectOvertime}
              />

              <StaffAvailability staffData={staffData} availableCount={availableCount} unavailableCount={unavailableCount} />

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
            </>
          )}
        </div>
      </main>

      <BookingModal
        open={showBookingModal}
        onClose={closeBooking}
        submitted={bookingSubmitted}
        setSubmitted={setBookingSubmitted}
        submitting={bookingSubmitting}
        error={bookingError}
        onSubmit={handleBookingSubmit}
      />

      <HolidayModal
        open={showHolidayModal}
        onClose={closeHoliday}
        saved={holidaySaved}
        setSaved={setHolidaySaved}
        error={holidayError}
        submitting={holidaySubmitting}
        conflicts={leaveConflicts}
        form={holidayForm}
        onChange={handleHolidayFormChange}
        onSave={handleSaveHoliday}
        staffData={staffData}
        currentUserId={user?.id ?? null}
        canManage={canManage}
      />

      <QuickBookModal
        open={showQuickBookModal}
        date={quickBookDate}
        onClose={closeQuickBook}
        saved={holidaySaved}
        setSaved={setHolidaySaved}
        error={holidayError}
        submitting={holidaySubmitting}
        conflicts={leaveConflicts}
        form={holidayForm}
        onChange={handleHolidayFormChange}
        onSave={handleQuickBookSave}
        staffData={staffData}
        currentUserId={user?.id ?? null}
        canManage={canManage}
      />

      <OvertimeModal
        open={showOvertimeModal}
        onClose={closeOvertime}
        saved={overtimeSaved}
        setSaved={setOvertimeSaved}
        error={overtimeError}
        submitting={overtimeSubmitting}
        form={overtimeForm}
        onChange={(f, v) => setOvertimeForm((prev) => ({ ...prev, [f]: v }))}
        onSave={handleSaveOvertime}
        staffData={staffData}
        currentUserId={user?.id ?? null}
        canManage={canManage}
      />

      <AssignShiftModal
        open={showAssignShiftModal}
        onClose={closeAssignShift}
        saved={assignSaved}
        setSaved={setAssignSaved}
        error={assignError}
        submitting={assignSubmitting}
        form={assignShiftForm}
        onChange={(f, v) => setAssignShiftForm((prev) => ({ ...prev, [f]: v }))}
        onSave={handleSaveAssignShift}
        staffData={staffData}
        shiftTypes={shiftTypes.map((st) => ({ id: st.id, code: st.code, name: st.name }))}
      />
    </div>
  );
}
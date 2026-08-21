import { StaffMember, ShiftAssignment, isDateInRange } from './types';
import { isWorkingOn } from '@/lib/work-pattern';

export function getMonthData(offset: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  return { year, month, firstDay, daysInMonth, monthName };
}

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isStaffOnLeave(staffData: StaffMember[], staffUserId: string, date: Date) {
  const staff = staffData.find((s) => s.userId === staffUserId);
  if (!staff) return false;
  return staff.leaveRecords.some((leave) => isDateInRange(date, leave.start, leave.end));
}

export function getLeaveTypeForDate(staffData: StaffMember[], staffUserId: string, date: Date) {
  const staff = staffData.find((s) => s.userId === staffUserId);
  if (!staff) return null;
  const leave = staff.leaveRecords.find((leave) => isDateInRange(date, leave.start, leave.end));
  return leave ? leave.type : null;
}

export function getPatternOnStaffForDay(
  day: number,
  month: number,
  year: number,
  staffData: StaffMember[],
  assignmentsByDate: Record<string, ShiftAssignment[]>,
) {
  const date = new Date(year, month, day);
  const key = dateKey(year, month, day);
  const manuallyAssigned = new Set((assignmentsByDate[key] || []).map((a) => a.staff_user_id));

  return staffData
    .filter((s) => {
      if (!s.pattern || !s.userId) return false;
      if (manuallyAssigned.has(s.userId)) return false;
      if (isStaffOnLeave(staffData, s.userId, date)) return false;
      return isWorkingOn(s.pattern, s.patternStartDate, date);
    })
    .map((s) => ({
      userId: s.userId as string,
      initials: s.initials,
      name: s.name,
      color: s.color,
      shift: s.shift,
      shiftCode: s.shift === 'Night' ? 'N' : 'D',
    }));
}

export function getShiftsForDay(
  day: number,
  month: number,
  year: number,
  assignmentsByDate: Record<string, ShiftAssignment[]>,
  staffData: StaffMember[],
) {
  const key = dateKey(year, month, day);
  const dayAssignments = assignmentsByDate[key] || [];
  const date = new Date(year, month, day);
  const shifts: { staff: string; staffUserId: string; type: string; color: string; onLeave?: boolean; leaveType?: string; assignmentId: string }[] = [];

  dayAssignments.forEach((a) => {
    const staff = staffData.find((s) => s.userId === a.staff_user_id);
    if (!staff) return;
    const onLeave = isStaffOnLeave(staffData, a.staff_user_id, date);
    const leaveType = getLeaveTypeForDate(staffData, a.staff_user_id, date);
    shifts.push({
      staff: staff.initials,
      staffUserId: a.staff_user_id,
      type: a.code || '',
      color: staff.color,
      onLeave,
      leaveType: leaveType || undefined,
      assignmentId: a.id,
    });
  });

  return shifts;
}

export function getMonthlyLeaveForMonth(member: StaffMember, monthIndex: number, year: number) {
  const result = { annualLeave: 0, sickLeave: 0, training: 0, other: 0 };

  member.leaveRecords.forEach((leave) => {
    const leaveStart = new Date(leave.start);
    const leaveEnd = new Date(leave.end);
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    if (leaveEnd < monthStart || leaveStart > monthEnd) return;

    const effectiveStart = leaveStart < monthStart ? monthStart : leaveStart;
    const effectiveEnd = leaveEnd > monthEnd ? monthEnd : leaveEnd;
    const daysInMonth = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (leave.type === 'Annual Leave') result.annualLeave += daysInMonth;
    else if (leave.type === 'Sick Leave') result.sickLeave += daysInMonth;
    else if (leave.type === 'Training') result.training += daysInMonth;
    else result.other += daysInMonth;
  });

  return result;
}

export function getTotalDaysOffForMonth(member: StaffMember, monthIndex: number, year: number) {
  const leave = getMonthlyLeaveForMonth(member, monthIndex, year);
  return leave.annualLeave + leave.sickLeave + leave.training + leave.other;
}

export function isDateInDragRange(
  isDragging: boolean,
  dragStart: { day: number; month: number; year: number } | null,
  dragEnd: { day: number; month: number; year: number } | null,
  day: number,
  month: number,
  year: number
) {
  if (!isDragging || !dragStart || !dragEnd) return false;

  const checkDate = new Date(year, month, day);
  const startDate = new Date(dragStart.year, dragStart.month, dragStart.day);
  const endDate = new Date(dragEnd.year, dragEnd.month, dragEnd.day);

  const rangeStart = startDate <= endDate ? startDate : endDate;
  const rangeEnd = startDate <= endDate ? endDate : startDate;

  return checkDate >= rangeStart && checkDate <= rangeEnd;
}
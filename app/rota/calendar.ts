import { StaffMember, isDateInRange } from './types';

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

export function isStaffOnLeave(staffData: StaffMember[], staffInitials: string, date: Date) {
  const staff = staffData.find(s => s.initials === staffInitials);
  if (!staff) return false;
  return staff.leaveRecords.some(leave => isDateInRange(date, leave.start, leave.end));
}

export function getLeaveTypeForDate(staffData: StaffMember[], staffInitials: string, date: Date) {
  const staff = staffData.find(s => s.initials === staffInitials);
  if (!staff) return null;
  const leave = staff.leaveRecords.find(leave => isDateInRange(date, leave.start, leave.end));
  return leave ? leave.type : null;
}

export function getShiftsForDay(day: number, month: number, year: number, staffData: StaffMember[]) {
  const shifts: { staff: string; type: string; color: string; onLeave?: boolean; leaveType?: string }[] = [];
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();

  const referenceDate = new Date(2026, 0, 1);
  const diffTime = date.getTime() - referenceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let cycleDay = diffDays % 8;
  if (cycleDay < 0) cycleDay += 8;

  const meStaff = staffData.find(s => s.initials === 'ME');
  const vkStaff = staffData.find(s => s.initials === 'VK');
  const pgStaff = staffData.find(s => s.initials === 'PG');
  const mcStaff = staffData.find(s => s.initials === 'MC');
  const mwStaff = staffData.find(s => s.initials === 'MW');
  const mhStaff = staffData.find(s => s.initials === 'MH');

  const pushShift = (staff: StaffMember | undefined, type: string) => {
    if (!staff) return;
    const onLeave = isStaffOnLeave(staffData, staff.initials, date);
    const leaveType = getLeaveTypeForDate(staffData, staff.initials, date);
    shifts.push({ staff: staff.initials, type, color: staff.color, onLeave, leaveType: leaveType || undefined });
  };

  if (cycleDay < 4) {
    pushShift(meStaff, 'D');
    pushShift(vkStaff, 'N');
  } else {
    pushShift(pgStaff, 'D');
    pushShift(mcStaff, 'N');
  }

  if (dayOfWeek === 6) pushShift(mwStaff, 'D');
  if (dayOfWeek >= 1 && dayOfWeek <= 5) pushShift(mhStaff, 'D');

  return shifts;
}

export function getMonthlyLeaveForMonth(member: StaffMember, monthIndex: number, year: number) {
  const result = { annualLeave: 0, sickLeave: 0, training: 0, other: 0 };

  member.leaveRecords.forEach(leave => {
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
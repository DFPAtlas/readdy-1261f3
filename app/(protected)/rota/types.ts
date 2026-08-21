export interface LeaveRecord {
  id?: string;
  start: string;
  end: string;
  type: string;
}

export interface StaffMember {
  userId: string | null;
  initials: string;
  name: string;
  shift: 'Day' | 'Night';
  time: string;
  pattern: string;
  patternStartDate: string | null;
  color: string;
  status: 'available' | 'on-leave' | 'sick' | 'training';
  statusLabel: string;
  currentLeave?: { start: string; end: string; type: string };
  upcomingLeave?: { start: string; end: string; type: string } | null;
  sickNote?: string;
  trainingInfo?: string;
  totalLeaveDays: number;
  usedLeaveDays: number;
  monthlyLeave: { annualLeave: number; sickLeave: number; training: number; other: number };
  leaveRecords: LeaveRecord[];
}

export interface LeaveEntry {
  id?: string;
  staffUserId: string;
  staffName: string;
  staffInitials: string;
  start: string;
  end: string;
  type: string;
  index: number;
}

export interface ShiftAssignment {
  id: string;
  staff_user_id: string;
  shift_type_id: string | null;
  assignment_date: string;
  code: string;
  name: string;
  color: string;
}

export const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Training', 'Personal Leave', 'Other'];

export const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function availableYears(): number[] {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}

export function calculateLeaveDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function isDateInRange(checkDate: Date, startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return checkDate >= start && checkDate <= end;
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-700 border-green-200';
    case 'on-leave': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'sick': return 'bg-red-100 text-red-700 border-red-200';
    case 'training': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'available': return 'ri-checkbox-circle-line';
    case 'on-leave': return 'ri-plane-line';
    case 'sick': return 'ri-hospital-line';
    case 'training': return 'ri-book-open-line';
    default: return 'ri-question-line';
  }
}

export function getLeaveTypeShorthand(leaveType: string) {
  switch (leaveType) {
    case 'Annual Leave': return 'AL';
    case 'Sick Leave': return 'SL';
    case 'Training': return 'TR';
    case 'Personal Leave': return 'PL';
    default: return 'L';
  }
}

export function getLeaveTypeColorClasses(leaveType: string) {
  switch (leaveType) {
    case 'Annual Leave': return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
    case 'Sick Leave': return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
    case 'Training': return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
    case 'Personal Leave': return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200';
  }
}

export function getStaffColorClasses(color: string) {
  const colorMap: { [key: string]: { border: string; bg: string; text: string; progressBg: string } } = {
    blue: { border: 'border-blue-200', bg: 'bg-blue-100', text: 'text-blue-700', progressBg: 'bg-blue-500' },
    sky: { border: 'border-sky-200', bg: 'bg-sky-100', text: 'text-sky-700', progressBg: 'bg-sky-500' },
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-100', text: 'text-emerald-700', progressBg: 'bg-emerald-500' },
    teal: { border: 'border-teal-200', bg: 'bg-teal-100', text: 'text-teal-700', progressBg: 'bg-teal-500' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-100', text: 'text-amber-700', progressBg: 'bg-amber-500' },
    rose: { border: 'border-rose-200', bg: 'bg-rose-100', text: 'text-rose-700', progressBg: 'bg-rose-500' },
    indigo: { border: 'border-indigo-200', bg: 'bg-indigo-100', text: 'text-indigo-700', progressBg: 'bg-indigo-500' },
  };
  return colorMap[color] || colorMap.blue;
}

export function getShiftColorClasses(color: string) {
  const colorMap: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-800',
    sky: 'bg-sky-100 text-sky-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    teal: 'bg-teal-100 text-teal-800',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-800',
    indigo: 'bg-indigo-100 text-indigo-800',
  };
  return colorMap[color] || colorMap.blue;
}

export function getDayNightColorClasses(shift: 'Day' | 'Night') {
  return shift === 'Day' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800';
}

export function getShiftCode(shift: 'Day' | 'Night') {
  return shift === 'Day' ? 'D' : 'N';
}

export function getLegendColorClasses(color: string) {
  const colorMap: { [key: string]: string } = {
    blue: 'bg-blue-100 border-blue-300',
    sky: 'bg-sky-100 border-sky-300',
    emerald: 'bg-emerald-100 border-emerald-300',
    teal: 'bg-teal-100 border-teal-300',
    amber: 'bg-amber-100 border-amber-300',
    rose: 'bg-rose-100 border-rose-300',
    indigo: 'bg-indigo-100 border-indigo-300',
  };
  return colorMap[color] || colorMap.blue;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
import { useState } from 'react';
import {
  StaffMember,
  ShiftAssignment,
  getLeaveTypeShorthand,
  getLeaveTypeColorClasses,
  getShiftColorClasses,
  getDayNightColorClasses,
  getLegendColorClasses,
} from '../types';
import { getMonthData, getShiftsForDay, getPatternOnStaffForDay, isDateInDragRange } from '../calendar';

interface Props {
  currentMonth: number;
  setCurrentMonth: (value: number) => void;
  staffData: StaffMember[];
  assignmentsByDate: Record<string, ShiftAssignment[]>;
  canManage: boolean;
  onRemoveAssignment: (assignmentId: string) => void;
  handleQuickBookClick: (day: number, month: number, year: number) => void;
  handleLeaveClick: (e: React.MouseEvent, staffUserId: string, date: Date) => void;
  isDragging: boolean;
  dragStart: { day: number; month: number; year: number } | null;
  dragEnd: { day: number; month: number; year: number } | null;
  handleDragStart: (day: number, month: number, year: number) => void;
  handleDragEnter: (day: number, month: number, year: number) => void;
  handleDragEnd: () => void;
  showLegend: boolean;
  setShowLegend: (value: boolean) => void;
}

export default function CalendarSection(props: Props) {
  const {
    currentMonth,
    setCurrentMonth,
    staffData,
    assignmentsByDate,
    canManage,
    onRemoveAssignment,
    handleQuickBookClick,
    handleLeaveClick,
    isDragging,
    dragStart,
    dragEnd,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    showLegend,
    setShowLegend,
  } = props;

  const { year, month, firstDay, daysInMonth, monthName } = getMonthData(currentMonth);
  const [showPattern, setShowPattern] = useState(true);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(currentMonth - 1)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-arrow-left-s-line text-lg"></i>
          </div>
          <span className="font-medium">Previous</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{monthName}</h2>
        <button
          onClick={() => setCurrentMonth(currentMonth + 1)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <span className="font-medium">Next</span>
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-arrow-right-s-line text-lg"></i>
          </div>
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 text-sm">
          <i className="ri-information-line"></i>
          <span>
            <strong>Tip:</strong> Work-pattern days are filled in automatically. Click and drag across dates to book leave. Click a leave entry (highlighted) to edit it.
            {canManage && ' Click a shift chip to remove an assignment.'}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-2 select-none"
        onMouseUp={handleDragEnd}
        onMouseLeave={() => {
          if (isDragging) handleDragEnd();
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-slate-700 py-3 bg-slate-50 rounded-lg">
            {day}
          </div>
        ))}

        {emptyDays.map((i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {days.map((day) => {
          const shifts = getShiftsForDay(day, month, year, assignmentsByDate, staffData);
          const patternOn = showPattern ? getPatternOnStaffForDay(day, month, year, staffData, assignmentsByDate) : [];
          const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
          const isInDragRange = isDateInDragRange(isDragging, dragStart, dragEnd, day, month, year);

          return (
            <div
              key={day}
              onMouseDown={() => handleDragStart(day, month, year)}
              onMouseEnter={() => handleDragEnter(day, month, year)}
              onClick={() => handleQuickBookClick(day, month, year)}
              className={`aspect-square border-2 rounded-xl p-2 transition-all cursor-pointer group ${
                isInDragRange
                  ? 'bg-blue-100 border-blue-400 shadow-md'
                  : isWeekend
                    ? 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-md'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">{day}</span>
                <div className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 rounded-lg">
                  <i className="ri-add-line text-blue-600 text-xs"></i>
                </div>
              </div>
              <div className="space-y-0.5 text-xs">
                {shifts.map((shift, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (shift.onLeave) {
                        handleLeaveClick(e, shift.staffUserId, new Date(year, month, day));
                      } else if (canManage) {
                        onRemoveAssignment(shift.assignmentId);
                      }
                    }}
                    className={`px-1.5 py-1 rounded-lg font-medium ${
                      shift.onLeave
                        ? `${getLeaveTypeColorClasses(shift.leaveType || '')} border cursor-pointer`
                        : getShiftColorClasses(shift.color)
                    }`}
                    title={
                      shift.onLeave
                        ? `${shift.staff} - ${shift.leaveType} (Click to edit)`
                        : canManage
                          ? `${shift.staff} - ${shift.type === 'D' ? 'Day' : 'Night'} Shift (Click to remove)`
                          : `${shift.staff} - ${shift.type === 'D' ? 'Day' : 'Night'} Shift`
                    }
                  >
                    {shift.onLeave ? `${shift.staff} ${getLeaveTypeShorthand(shift.leaveType || '')}` : `${shift.staff} ${shift.type}`}
                  </div>
                ))}
              </div>

              {patternOn.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {patternOn.slice(0, 6).map((s) => (
                    <span
                      key={s.userId}
                      className={`px-1 py-0.5 rounded text-[10px] font-semibold leading-none ${getDayNightColorClasses(s.shift)}`}
                      title={`${s.name} — ${s.shift} shift (work pattern)`}
                    >
                      {s.initials} {s.shiftCode}
                    </span>
                  ))}
                  {patternOn.length > 6 && (
                    <span className="text-[10px] text-slate-400 font-medium">+{patternOn.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-palette-line text-slate-600"></i>
            Legend
          </h3>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
          >
            <i className={showLegend ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
            {showLegend ? 'Hide' : 'Show'}
          </button>
        </div>

        {showLegend && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Staff</p>
              <div className="flex flex-wrap gap-3">
                {staffData.map((member) => (
                  <div key={member.initials} className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${getLegendColorClasses(member.color)} border rounded-lg flex items-center justify-center`}>
                      <span className="text-xs font-bold text-slate-700">{member.initials.charAt(0)}</span>
                    </div>
                    <span className="text-sm text-slate-700">{member.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${member.shift === 'Day' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {member.shift}
                    </span>
                  </div>
                ))}
                {staffData.length === 0 && (
                  <span className="text-sm text-slate-400">No staff added yet.</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Shift Types</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">D</div>
                  <span className="text-sm text-slate-700">Day Shift (06:00-18:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-medium">N</div>
                  <span className="text-sm text-slate-700">Night Shift (18:00-06:00)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Work Pattern (Auto-filled)</p>
                <button
                  onClick={() => setShowPattern(!showPattern)}
                  className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                >
                  <i className={showPattern ? 'ri-eye-line' : 'ri-eye-off-line'}></i>
                  {showPattern ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">AB D</div>
                  <span className="text-sm text-slate-700">Day shift (auto from pattern + start date)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-medium">AB N</div>
                  <span className="text-sm text-slate-700">Night shift (auto from pattern + start date)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Rest days shown blank</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Leave Types</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 border rounded-lg text-xs font-medium ${getLeaveTypeColorClasses('Annual Leave')}`}>AL</div>
                  <span className="text-sm text-slate-700">Annual Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 border rounded-lg text-xs font-medium ${getLeaveTypeColorClasses('Sick Leave')}`}>SL</div>
                  <span className="text-sm text-slate-700">Sick Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 border rounded-lg text-xs font-medium ${getLeaveTypeColorClasses('Training')}`}>TR</div>
                  <span className="text-sm text-slate-700">Training</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 border rounded-lg text-xs font-medium ${getLeaveTypeColorClasses('Personal Leave')}`}>PL</div>
                  <span className="text-sm text-slate-700">Personal Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 border rounded-lg text-xs font-medium ${getLeaveTypeColorClasses('Other')}`}>L</div>
                  <span className="text-sm text-slate-700">Other Leave</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
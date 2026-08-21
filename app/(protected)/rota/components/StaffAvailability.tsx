import { StaffMember, getStaffColorClasses, getStatusColor, getStatusIcon, getLeaveTypeColorClasses } from '../types';

interface Props {
  staffData: StaffMember[];
  availableCount: number;
  unavailableCount: number;
}

export default function StaffAvailability({ staffData, availableCount, unavailableCount }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <i className="ri-user-settings-line text-slate-700 text-lg"></i>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Staff Availability</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">{availableCount} Available</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-orange-700">{unavailableCount} Unavailable</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffData.map((member) => {
          const colors = getStaffColorClasses(member.color);
          return (
            <div key={member.initials} className={`bg-white p-4 rounded-lg border-2 ${colors.border} hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                    <span className={`${colors.text} font-bold text-sm`}>{member.initials}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.shift} Shift</p>
                    {member.pattern && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {member.pattern}
                        {member.patternStartDate && (
                          <> · from {new Date(member.patternStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                  <div className="flex items-center gap-1">
                    <i className={`${getStatusIcon(member.status)} text-xs`}></i>
                    {member.statusLabel}
                  </div>
                </span>
              </div>

              <div className="space-y-2">
                {member.status === 'on-leave' && member.currentLeave && (
                  <div className={`p-2.5 rounded-lg border ${getLeaveTypeColorClasses(member.currentLeave.type)}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-calendar-event-line"></i>
                      <span className="font-medium">{member.currentLeave.type}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">
                      {new Date(member.currentLeave.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(member.currentLeave.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                )}

                {member.status === 'sick' && member.sickNote && (
                  <div className={`p-2.5 rounded-lg border ${getLeaveTypeColorClasses('Sick Leave')}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-heart-pulse-line"></i>
                      <span className="font-medium">Sick Leave</span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{member.sickNote}</p>
                  </div>
                )}

                {member.status === 'training' && member.trainingInfo && (
                  <div className={`p-2.5 rounded-lg border ${getLeaveTypeColorClasses('Training')}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-graduation-cap-line"></i>
                      <span className="font-medium">Training</span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{member.trainingInfo}</p>
                  </div>
                )}

                {member.status === 'available' && member.upcomingLeave && (
                  <div className={`p-2.5 rounded-lg border ${getLeaveTypeColorClasses(member.upcomingLeave.type)}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-time-line"></i>
                      <span className="font-medium">Upcoming {member.upcomingLeave.type}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">
                      {new Date(member.upcomingLeave.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(member.upcomingLeave.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                )}

                {member.status === 'available' && !member.upcomingLeave && (
                  <div className="bg-green-50 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <i className="ri-checkbox-circle-line"></i>
                      <span className="font-medium">No upcoming leave scheduled</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                    <span>Leave Balance</span>
                    <span className="font-medium">{member.usedLeaveDays}/{member.totalLeaveDays} days used</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className={`${colors.progressBg} h-1.5 rounded-full transition-all`}
                      style={{ width: `${Math.min(100, (member.usedLeaveDays / member.totalLeaveDays) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { StaffMember, getStaffColorClasses } from '../types';
import type { LeaveRequest, OvertimeRequest } from '@/lib/rota';

interface Props {
  leaveRequests: LeaveRequest[];
  overtimeRequests: OvertimeRequest[];
  staffData: StaffMember[];
  currentUserId: string | null;
  canManage: boolean;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
  onWithdrawLeave: (id: string) => void;
  onApproveOvertime: (id: string) => void;
  onRejectOvertime: (id: string) => void;
}

function staffName(staffData: StaffMember[], userId: string): { name: string; initials: string; color: string } {
  const s = staffData.find((m) => m.userId === userId);
  return s
    ? { name: s.name, initials: s.initials, color: s.color }
    : { name: 'Unknown', initials: '?', color: 'blue' };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function RequestPanel(props: Props) {
  const {
    leaveRequests,
    overtimeRequests,
    staffData,
    currentUserId,
    canManage,
    onApproveLeave,
    onRejectLeave,
    onWithdrawLeave,
    onApproveOvertime,
    onRejectOvertime,
  } = props;

  const pendingLeave = leaveRequests.filter((l) => l.status === 'pending');
  const pendingOvertime = overtimeRequests.filter((o) => o.status === 'pending');

  const hasPending = pendingLeave.length > 0 || pendingOvertime.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <i className="ri-inbox-line text-slate-700 text-lg"></i>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Requests</h2>
          {hasPending && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
              {pendingLeave.length + pendingOvertime.length} pending
            </span>
          )}
        </div>
      </div>

      {!hasPending ? (
        <p className="text-sm text-slate-400 py-4 text-center">No pending requests.</p>
      ) : (
        <div className="space-y-6">
          {pendingLeave.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <i className="ri-plane-line"></i> Leave
              </h3>
              <div className="space-y-2">
                {pendingLeave.map((req) => {
                  const s = staffName(staffData, req.staff_user_id);
                  const colors = getStaffColorClasses(s.color);
                  const isOwn = req.staff_user_id === currentUserId;
                  return (
                    <div key={req.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className={`w-9 h-9 ${colors.bg} rounded-full flex items-center justify-center shrink-0`}>
                        <span className={`${colors.text} font-bold text-xs`}>{s.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {s.name}
                          {isOwn && <span className="text-xs text-slate-400 ml-2">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {req.leave_type}: {new Date(req.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(req.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      {canManage && !isOwn && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => onApproveLeave(req.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 whitespace-nowrap cursor-pointer">Approve</button>
                          <button onClick={() => onRejectLeave(req.id)} className="px-3 py-1.5 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-medium hover:bg-red-50 whitespace-nowrap cursor-pointer">Reject</button>
                        </div>
                      )}
                      {isOwn && (
                        <button onClick={() => onWithdrawLeave(req.id)} className="px-3 py-1.5 bg-white text-slate-600 border border-slate-300 rounded-lg text-xs font-medium hover:bg-slate-100 whitespace-nowrap cursor-pointer shrink-0">
                          Withdraw
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pendingOvertime.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <i className="ri-time-line"></i> Overtime
              </h3>
              <div className="space-y-2">
                {pendingOvertime.map((req) => {
                  const s = staffName(staffData, req.staff_user_id);
                  const colors = getStaffColorClasses(s.color);
                  return (
                    <div key={req.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className={`w-9 h-9 ${colors.bg} rounded-full flex items-center justify-center shrink-0`}>
                        <span className={`${colors.text} font-bold text-xs`}>{s.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(req.overtime_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {req.hours ? ` · ${req.hours} hrs` : ''}
                          {req.start_time ? ` · ${req.start_time}` : ''}
                          {req.end_time ? `-${req.end_time}` : ''}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => onApproveOvertime(req.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 whitespace-nowrap cursor-pointer">Approve</button>
                          <button onClick={() => onRejectOvertime(req.id)} className="px-3 py-1.5 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-medium hover:bg-red-50 whitespace-nowrap cursor-pointer">Reject</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
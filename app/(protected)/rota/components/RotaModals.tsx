import { StaffMember, calculateLeaveDays, LEAVE_TYPES } from '../types';

export interface HolidayForm {
  staffUserId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const emptyHolidayForm: HolidayForm = {
  staffUserId: '',
  leaveType: 'Annual Leave',
  startDate: '',
  endDate: '',
  notes: ''
};

export { emptyHolidayForm };

interface Conflict {
  start: string;
  end: string;
  type: string;
}

function ConflictNotice({ conflicts }: { conflicts: Conflict[] }) {
  return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full flex-shrink-0">
          <i className="ri-error-warning-line text-red-600 text-lg"></i>
        </div>
        <div>
          <p className="font-semibold text-red-800 mb-1">Leave Conflict Detected</p>
          <p className="text-sm text-red-700 mb-2">This staff member already has leave booked during the selected dates:</p>
          <div className="space-y-1">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                <span className="font-medium">{conflict.type}</span>: {new Date(conflict.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(conflict.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-2">Please choose different dates or cancel the existing leave first.</p>
        </div>
      </div>
    </div>
  );
}

function DayCountBadge({ start, end }: { start: string; end: string }) {
  if (!start || !end) return null;
  const days = calculateLeaveDays(start, end);
  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 text-blue-700 text-sm">
        <i className="ri-calendar-check-line"></i>
        <span className="font-medium">
          {days} day{days !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function ErrorNotice({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
      <div className="flex items-center gap-2 text-red-700 text-sm">
        <i className="ri-error-warning-line"></i>
        <span>{error}</span>
      </div>
    </div>
  );
}

function StaffSelect({ form, onChange, staffData }: { form: HolidayForm; onChange: (f: string, v: string) => void; staffData: StaffMember[] }) {
  return (
    <select
      value={form.staffUserId}
      onChange={(e) => onChange('staffUserId', e.target.value)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
    >
      <option value="">Select staff member</option>
      {staffData.map((member) => (
        <option key={member.userId} value={member.userId || ''}>{member.name}</option>
      ))}
    </select>
  );
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  submitted: boolean;
  setSubmitted: (value: boolean) => void;
  submitting: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function BookingModal({ open, onClose, submitted, setSubmitted, submitting, error, onSubmit }: BookingModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <style>{`.guest-contact-extra{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;overflow:hidden;}`}</style>
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <i className="ri-shield-user-line text-emerald-600 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Book a Samsic Guard</h3>
              <p className="text-sm text-gray-500">Request additional security coverage</p>
            </div>
          </div>
          <button onClick={() => { onClose(); setSubmitted(false); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-emerald-600 text-3xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Booking Request Submitted!</h4>
            <p className="text-gray-600">Your request has been sent. You will receive confirmation shortly.</p>
          </div>
        ) : (
          <form id="samsic-guard-booking" data-readdy-form onSubmit={onSubmit} className="space-y-4">
            <input
              type="text"
              name="website_alt"
              className="guest-contact-extra"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              readOnly
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Required <span className="text-red-500">*</span></label>
                <input type="date" name="date_required" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guards <span className="text-red-500">*</span></label>
                <input type="number" name="number_of_guards" min="1" max="10" defaultValue="1" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time <span className="text-red-500">*</span></label>
                <input type="time" name="start_time" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time <span className="text-red-500">*</span></label>
                <input type="time" name="end_time" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
              <input type="text" name="location" placeholder="Enter the location/site address" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Request <span className="text-red-500">*</span></label>
              <div className="space-y-2">
                {['Staff Absence Cover', 'Special Event', 'Additional Security', 'Emergency Cover', 'Other'].map((reason) => (
                  <label key={reason} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="reason" value={reason} required className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
              <textarea name="additional_details" placeholder="Provide any additional information about the booking request" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none" rows={3} maxLength={500}></textarea>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                <i className="ri-error-warning-line"></i>
                <span>{error}</span>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { onClose(); setSubmitted(false); }} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line"></i>
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface HolidayModalProps {
  open: boolean;
  onClose: () => void;
  saved: boolean;
  setSaved: (value: boolean) => void;
  error: string;
  submitting: boolean;
  conflicts: Conflict[];
  form: HolidayForm;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  staffData: StaffMember[];
  currentUserId: string | null;
  canManage: boolean;
}

export function HolidayModal({ open, onClose, saved, setSaved, error, submitting, conflicts, form, onChange, onSave, staffData, currentUserId, canManage }: HolidayModalProps) {
  if (!open) return null;
  const selfName = staffData.find((s) => s.userId === currentUserId)?.name || 'You';
  const invalidRange = form.startDate && form.endDate ? form.endDate < form.startDate : false;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Request Leave</h3>
          <button onClick={() => { onClose(); setSaved(false); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {saved ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-green-600 text-3xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Leave Request Submitted</h4>
            <p className="text-gray-600">Your request is pending approval.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member <span className="text-red-500">*</span></label>
                {canManage ? (
                  <StaffSelect form={form} onChange={onChange} staffData={staffData} />
                ) : (
                  <div className="w-full px-4 py-2.5 border border-gray-200 bg-slate-50 rounded-lg text-sm text-slate-700">{selfName}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type <span className="text-red-500">*</span></label>
                <select value={form.leaveType} onChange={(e) => onChange('leaveType', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                  {LEAVE_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.startDate} onChange={(e) => onChange('startDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.endDate} onChange={(e) => onChange('endDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              {invalidRange && <p className="text-xs text-red-500">End date must be on or after the start date.</p>}
              <DayCountBadge start={form.startDate} end={form.endDate} />
              {conflicts.length > 0 && <ConflictNotice conflicts={conflicts} />}
              <ErrorNotice error={error} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea placeholder="Add any notes about the leave" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" rows={3} maxLength={500}></textarea>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button
                onClick={onSave}
                disabled={!form.staffUserId || !form.startDate || !form.endDate || invalidRange || conflicts.length > 0 || submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface QuickBookModalProps {
  open: boolean;
  date: { day: number; month: number; year: number } | null;
  onClose: () => void;
  saved: boolean;
  setSaved: (value: boolean) => void;
  error: string;
  submitting: boolean;
  conflicts: Conflict[];
  form: HolidayForm;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  staffData: StaffMember[];
  currentUserId: string | null;
  canManage: boolean;
}

export function QuickBookModal({ open, date, onClose, saved, setSaved, error, submitting, conflicts, form, onChange, onSave, staffData, currentUserId, canManage }: QuickBookModalProps) {
  if (!open || !date) return null;
  const selfName = staffData.find((s) => s.userId === currentUserId)?.name || 'You';
  const invalidRange = form.startDate && form.endDate ? form.endDate < form.startDate : false;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <i className="ri-calendar-check-line text-blue-600 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Book Leave</h3>
              <p className="text-sm text-gray-500">
                {new Date(date.year, date.month, date.day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={() => { onClose(); setSaved(false); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {saved ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-green-600 text-3xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Leave Request Submitted</h4>
            <p className="text-gray-600">Your request is pending approval.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member <span className="text-red-500">*</span></label>
                {canManage ? (
                  <StaffSelect form={form} onChange={onChange} staffData={staffData} />
                ) : (
                  <div className="w-full px-4 py-2.5 border border-gray-200 bg-slate-50 rounded-lg text-sm text-slate-700">{selfName}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type <span className="text-red-500">*</span></label>
                <select value={form.leaveType} onChange={(e) => onChange('leaveType', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                  {LEAVE_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => onChange('startDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => onChange('endDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>
              {invalidRange && <p className="text-xs text-red-500">End date must be on or after the start date.</p>}
              <DayCountBadge start={form.startDate} end={form.endDate} />
              {conflicts.length > 0 && <ConflictNotice conflicts={conflicts} />}
              <ErrorNotice error={error} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea placeholder="Add any notes about the leave" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" rows={2} maxLength={500}></textarea>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button
                onClick={onSave}
                disabled={!form.staffUserId || !form.startDate || !form.endDate || invalidRange || conflicts.length > 0 || submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Book Leave'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export interface OvertimeForm {
  staffUserId: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  hours: string;
  reason: string;
}

export const emptyOvertimeForm: OvertimeForm = {
  staffUserId: '',
  overtimeDate: '',
  startTime: '',
  endTime: '',
  hours: '',
  reason: '',
};

interface OvertimeModalProps {
  open: boolean;
  onClose: () => void;
  saved: boolean;
  setSaved: (value: boolean) => void;
  error: string;
  submitting: boolean;
  form: OvertimeForm;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  staffData: StaffMember[];
  currentUserId: string | null;
  canManage: boolean;
}

export function OvertimeModal({ open, onClose, saved, setSaved, error, submitting, form, onChange, onSave, staffData, currentUserId, canManage }: OvertimeModalProps) {
  if (!open) return null;
  const selfName = staffData.find((s) => s.userId === currentUserId)?.name || 'You';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <i className="ri-time-line text-amber-600 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Request Overtime</h3>
              <p className="text-sm text-gray-500">Submit an overtime request for approval</p>
            </div>
          </div>
          <button onClick={() => { onClose(); setSaved(false); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {saved ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-green-600 text-3xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Overtime Request Submitted</h4>
            <p className="text-gray-600">Your request is pending approval.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member <span className="text-red-500">*</span></label>
                {canManage ? (
                  <select value={form.staffUserId} onChange={(e) => onChange('staffUserId', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm pr-8">
                    <option value="">Select staff member</option>
                    {staffData.map((member) => (
                      <option key={member.userId} value={member.userId || ''}>{member.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2.5 border border-gray-200 bg-slate-50 rounded-lg text-sm text-slate-700">{selfName}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.overtimeDate} onChange={(e) => onChange('overtimeDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                <input type="number" min="0" step="0.5" value={form.hours} onChange={(e) => onChange('hours', e.target.value)} placeholder="e.g. 4" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm" />
              </div>
              <ErrorNotice error={error} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea placeholder="Briefly describe the reason for overtime" value={form.reason} onChange={(e) => onChange('reason', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none" rows={2} maxLength={500}></textarea>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button
                onClick={onSave}
                disabled={!form.staffUserId || !form.overtimeDate || submitting}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export interface AssignShiftForm {
  staffUserId: string;
  assignmentDate: string;
  shiftTypeId: string;
}

export const emptyAssignShiftForm: AssignShiftForm = {
  staffUserId: '',
  assignmentDate: '',
  shiftTypeId: '',
};

interface AssignShiftModalProps {
  open: boolean;
  onClose: () => void;
  saved: boolean;
  setSaved: (value: boolean) => void;
  error: string;
  submitting: boolean;
  form: AssignShiftForm;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  staffData: StaffMember[];
  shiftTypes: { id: string; code: string; name: string }[];
}

export function AssignShiftModal({ open, onClose, saved, setSaved, error, submitting, form, onChange, onSave, staffData, shiftTypes }: AssignShiftModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <i className="ri-calendar-todo-line text-indigo-600 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Assign Shift</h3>
              <p className="text-sm text-gray-500">Build the rota for a specific date</p>
            </div>
          </div>
          <button onClick={() => { onClose(); setSaved(false); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {saved ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-green-600 text-3xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Shift Assigned</h4>
            <p className="text-gray-600">The rota has been updated.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member <span className="text-red-500">*</span></label>
                <select value={form.staffUserId} onChange={(e) => onChange('staffUserId', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-8">
                  <option value="">Select staff member</option>
                  {staffData.map((member) => (
                    <option key={member.userId} value={member.userId || ''}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.assignmentDate} onChange={(e) => onChange('assignmentDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type <span className="text-red-500">*</span></label>
                <select value={form.shiftTypeId} onChange={(e) => onChange('shiftTypeId', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-8">
                  <option value="">Select shift type</option>
                  {shiftTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                  ))}
                </select>
              </div>
              <ErrorNotice error={error} />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button
                onClick={onSave}
                disabled={!form.staffUserId || !form.assignmentDate || !form.shiftTypeId || submitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Assign Shift'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
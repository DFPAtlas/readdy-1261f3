'use client';

import { useEffect, useState } from 'react';
import type { Profile, ProfileFields, Role } from '@/lib/profile';
import { toProfileFields } from '@/lib/profile';

const ROLE_OPTIONS: Role[] = ['staff', 'supervisor', 'manager', 'administrator'];
const ROLE_LABELS: Record<Role, string> = {
  staff: 'Staff',
  supervisor: 'Supervisor',
  manager: 'Manager',
  administrator: 'Administrator',
};

const WORK_PATTERNS = [
  '4 on / 4 off',
  '5 on / 3 off',
  '2 days / 2 nights / 4 off',
  'Days only',
  'Nights only',
  'Weekends only',
];

interface Props {
  open: boolean;
  profile: Profile | null;
  role: Role;
  isAdmin: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (fields: ProfileFields, role: Role) => void;
}

export default function StaffFormModal({
  open,
  profile,
  role,
  isAdmin,
  saving,
  error,
  onClose,
  onSave,
}: Props) {
  const [fields, setFields] = useState<ProfileFields>(toProfileFields(profile));
  const [selRole, setSelRole] = useState<Role>(role);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFields(toProfileFields(profile));
      setSelRole(role);
      setFieldErrors({});
    }
  }, [open, profile, role]);

  if (!open) return null;

  const set = (key: keyof ProfileFields, value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? 'border-red-400' : 'border-slate-300'
    }`;

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!fields.full_name.trim()) errs.full_name = 'Full name is required.';
    if (!fields.work_email.trim()) {
      errs.work_email = 'Work email is required.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.work_email)) {
      errs.work_email = 'Enter a valid email address.';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(fields, selRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Edit Staff Member</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-slate-500"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fields.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                className={inputClass(!!fieldErrors.full_name)}
              />
              {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title</label>
              <input
                type="text"
                value={fields.job_title}
                onChange={(e) => set('job_title', e.target.value)}
                className={inputClass(false)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Email</label>
              <input
                type="email"
                value={fields.work_email}
                onChange={(e) => set('work_email', e.target.value)}
                className={inputClass(!!fieldErrors.work_email)}
              />
              {fieldErrors.work_email && <p className="text-xs text-red-500 mt-1">{fieldErrors.work_email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={fields.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={inputClass(false)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <input
                type="text"
                value={fields.department}
                onChange={(e) => set('department', e.target.value)}
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee Number</label>
              <input
                type="text"
                value={fields.employee_number}
                onChange={(e) => set('employee_number', e.target.value)}
                className={inputClass(false)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Shift</label>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-full max-w-xs">
              {['Day', 'Night'].map((shift) => (
                <button
                  key={shift}
                  type="button"
                  onClick={() => set('shift', shift)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    fields.shift === shift ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {shift}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Pattern</label>
            <input
              type="text"
              value={fields.work_pattern}
              onChange={(e) => set('work_pattern', e.target.value)}
              placeholder="e.g. 4 on / 4 off"
              className={inputClass(false)}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {WORK_PATTERNS.map((pattern) => (
                <button
                  key={pattern}
                  type="button"
                  onClick={() => set('work_pattern', pattern)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                    fields.work_pattern === pattern
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pattern}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Pattern Start Date</label>
            <input
              type="date"
              value={fields.pattern_start_date}
              onChange={(e) => set('pattern_start_date', e.target.value)}
              className={inputClass(false)}
            />
            <p className="text-xs text-slate-400 mt-1">The date this work pattern takes effect.</p>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
              <div className="flex gap-1 p-1 bg-slate-100 rounded-full">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelRole(r)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selRole === r ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import type { ProfileFields } from '@/lib/profile';

interface Props {
  initial: ProfileFields;
  saving: boolean;
  error: string;
  onSave: (fields: ProfileFields) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ initial, saving, error, onSave, onCancel }: Props) {
  const [fields, setFields] = useState<ProfileFields>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    if (fields.phone.trim() && !/^[+\d][\d\s\-()]{5,}$/.test(fields.phone.trim())) {
      errs.phone = 'Enter a valid phone number.';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(fields);
  };

  return (
    <div className="space-y-4">
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
            placeholder="e.g. Security Officer"
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
            placeholder="+44 7700 900000"
            className={inputClass(!!fieldErrors.phone)}
          />
          {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
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
            placeholder="e.g. SEC-2024-001"
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

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          <i className="ri-error-warning-line"></i>
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium whitespace-nowrap cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap cursor-pointer disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
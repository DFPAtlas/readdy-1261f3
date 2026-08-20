'use client';

import { useState, useEffect } from 'react';

export interface StaffFormData {
  initials: string;
  name: string;
  shift: string;
  shift_time: string;
  shift_pattern: string;
  color: string;
  total_leave_days: number;
}

export const emptyStaffForm: StaffFormData = {
  initials: '',
  name: '',
  shift: 'Day',
  shift_time: '06:00 - 18:00',
  shift_pattern: '4 days on / 4 days off',
  color: 'blue',
  total_leave_days: 25,
};

export const colorOptions = [
  { value: 'blue', label: 'Blue', dot: 'bg-blue-500' },
  { value: 'sky', label: 'Sky', dot: 'bg-sky-500' },
  { value: 'emerald', label: 'Emerald', dot: 'bg-emerald-500' },
  { value: 'teal', label: 'Teal', dot: 'bg-teal-500' },
  { value: 'amber', label: 'Amber', dot: 'bg-amber-500' },
  { value: 'rose', label: 'Rose', dot: 'bg-rose-500' },
];

interface Props {
  open: boolean;
  editing: boolean;
  form: StaffFormData;
  onChange: (field: string, value: string | number) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function StaffFormModal({ open, editing, form, onChange, onClose, onSave }: Props) {
  const [errors, setErrors] = useState<{ [key: string]: string }>();

  useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.initials.trim()) newErrors.initials = 'Initials are required';
    if (!form.shift_time.trim()) newErrors.shift_time = 'Shift time is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {editing ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-slate-500"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => onChange('name', e.target.value)}
                placeholder="e.g. M Easton"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Initials</label>
              <input
                type="text"
                value={form.initials}
                onChange={e => onChange('initials', e.target.value.toUpperCase())}
                placeholder="e.g. ME"
                maxLength={4}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${errors.initials ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.initials && <p className="text-xs text-red-500 mt-1">{errors.initials}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Shift</label>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-full">
              {['Day', 'Night'].map(shift => (
                <button
                  key={shift}
                  onClick={() => onChange('shift', shift)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    form.shift === shift ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {shift}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shift Time</label>
              <input
                type="text"
                value={form.shift_time}
                onChange={e => onChange('shift_time', e.target.value)}
                placeholder="e.g. 06:00 - 18:00"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.shift_time ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errors.shift_time && <p className="text-xs text-red-500 mt-1">{errors.shift_time}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shift Pattern</label>
              <input
                type="text"
                value={form.shift_pattern}
                onChange={e => onChange('shift_pattern', e.target.value)}
                placeholder="e.g. 4 days on / 4 days off"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Colour</label>
            <div className="flex items-center gap-3">
              {colorOptions.map(c => (
                <button
                  key={c.value}
                  onClick={() => onChange('color', c.value)}
                  title={c.label}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full ${c.dot}`}></span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Leave Allowance (days)</label>
            <input
              type="number"
              min={0}
              max={365}
              value={form.total_leave_days}
              onChange={e => onChange('total_leave_days', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap cursor-pointer"
          >
            {editing ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import StaffFormModal, { StaffFormData, emptyStaffForm, colorOptions } from './components/StaffFormModal';
import { getStaffColorClasses, getShiftColorClasses } from '../rota/types';

interface StaffRow {
  id: number;
  initials: string;
  name: string;
  shift: string;
  shift_time: string;
  shift_pattern: string;
  color: string;
  total_leave_days: number;
  sort_order: number;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyStaffForm);
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadStaff = async () => {
    const { data } = await supabase.from('rota_staff').select('*').order('sort_order');
    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyStaffForm);
    setShowModal(true);
  };

  const openEdit = (member: StaffRow) => {
    setEditingId(member.id);
    setForm({
      initials: member.initials,
      name: member.name,
      shift: member.shift,
      shift_time: member.shift_time,
      shift_pattern: member.shift_pattern,
      color: member.color,
      total_leave_days: member.total_leave_days,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      initials: form.initials,
      name: form.name,
      shift: form.shift,
      shift_time: form.shift_time,
      shift_pattern: form.shift_pattern,
      color: form.color,
      total_leave_days: form.total_leave_days,
    };

    if (editingId) {
      await supabase.from('rota_staff').update(payload).eq('id', editingId);
      setNotice('Staff member updated');
    } else {
      const { data } = await supabase.from('rota_staff').select('sort_order');
      const nextOrder = (data && data.length ? Math.max(...data.map(d => d.sort_order)) : 0) + 1;
      await supabase.from('rota_staff').insert({ ...payload, sort_order: nextOrder });
      setNotice('Staff member added');
    }

    setSaving(false);
    setShowModal(false);
    await loadStaff();
    setTimeout(() => setNotice(''), 2500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('rota_staff').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setNotice('Staff member removed');
    await loadStaff();
    setTimeout(() => setNotice(''), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center">
                <i className="ri-team-line text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800">Staff Management</h1>
                <p className="text-slate-600 mt-1">Add, edit and remove team members for the rota</p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-user-add-line text-lg"></i>
              </div>
              <span>Add Staff</span>
            </button>
          </div>

          {notice && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 text-sm">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-base"></i>
              </div>
              {notice}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div className="col-span-3">Staff Member</div>
              <div className="col-span-2">Shift</div>
              <div className="col-span-2">Shift Time</div>
              <div className="col-span-3">Pattern</div>
              <div className="col-span-1 text-center">Leave</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {loading ? (
              <div className="px-5 py-16 text-center text-slate-400">
                <div className="w-8 h-8 mx-auto flex items-center justify-center">
                  <i className="ri-loader-4-line text-3xl animate-spin"></i>
                </div>
              </div>
            ) : staff.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="w-12 h-12 mx-auto flex items-center justify-center bg-slate-100 rounded-full mb-3">
                  <i className="ri-user-line text-2xl text-slate-400"></i>
                </div>
                <p className="text-slate-500">No staff yet. Add your first team member.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {staff.map(member => {
                  const colorClasses = getStaffColorClasses(member.color);
                  const shiftClasses = getShiftColorClasses(member.color);
                  return (
                    <div key={member.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="col-span-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colorClasses.bg} ${colorClasses.text}`}>
                          {member.initials}
                        </div>
                        <span className="font-medium text-slate-800">{member.name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${shiftClasses}`}>
                          {member.shift}
                        </span>
                      </div>
                      <div className="col-span-2 text-sm text-slate-600">{member.shift_time}</div>
                      <div className="col-span-3 text-sm text-slate-600">{member.shift_pattern}</div>
                      <div className="col-span-1 text-center text-sm font-semibold text-slate-700">{member.total_leave_days}</div>
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(member)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <i className="ri-pencil-line text-lg"></i>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(member)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3">
            {staff.length} team member{staff.length === 1 ? '' : 's'} — changes here are reflected on the Rota page.
          </p>
        </div>
      </main>

      <StaffFormModal
        open={showModal}
        editing={editingId !== null}
        form={form}
        onChange={handleChange}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full mb-4">
              <i className="ri-alert-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Remove {deleteTarget.name}?</h3>
            <p className="text-sm text-slate-500 mt-1">
              This removes them from the rota. Their past leave records will remain.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold whitespace-nowrap cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
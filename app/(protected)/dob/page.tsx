'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import { StatusBadge, RecordActions } from '@/components/RecordControls';
import { fetchDob, submitDob, updateDob, DobEntry, rpcError } from '@/lib/forms';

const emptyForm = {
  entry_date: '',
  entry_time: '',
  entry_type: '',
  description: '',
  location: '',
};

const entryTypes = ['Visitor', 'Incident', 'Patrol', 'Delivery', 'Alarm', 'Other'];

export default function DOBPage() {
  const { user, role } = useAuth();
  const isManager = roleRank(role) >= 3;
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [entries, setEntries] = useState<DobEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await fetchDob());
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const openEdit = (entry: DobEntry) => {
    setEditingId(entry.id);
    setForm({
      entry_date: entry.entry_date || '',
      entry_time: entry.entry_time || '',
      entry_type: entry.entry_type || '',
      description: entry.description || '',
      location: entry.location || '',
    });
    setError('');
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.entry_date || !form.entry_time || !form.entry_type || !form.description.trim() || !form.location.trim()) {
      setError('All fields are required.');
      return;
    }
    if (form.description.length > 3000) {
      setError('Description must be 3000 characters or fewer.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDob(editingId, form);
      } else {
        await submitDob(form);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(rpcError(err));
    } finally {
      setSaving(false);
    }
  };

  const typeCounts: { [key: string]: number } = { Visitor: 0, Incident: 0, Patrol: 0, Delivery: 0, Alarm: 0 };
  entries.forEach((e) => {
    if (typeCounts[e.entry_type || ''] !== undefined) typeCounts[e.entry_type || ''] += 1;
  });

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case 'Visitor': return 'bg-blue-100 text-blue-700';
      case 'Incident': return 'bg-red-100 text-red-700';
      case 'Patrol': return 'bg-green-100 text-green-700';
      case 'Delivery': return 'bg-purple-100 text-purple-700';
      case 'Alarm': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'Visitor': return 'ri-user-line';
      case 'Incident': return 'ri-alert-line';
      case 'Patrol': return 'ri-shield-check-line';
      case 'Delivery': return 'ri-box-3-line';
      case 'Alarm': return 'ri-alarm-warning-line';
      default: return 'ri-file-text-line';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Occurrence Book</h1>
              <p className="text-gray-600">Record and track all daily occurrences and activities</p>
            </div>
            <button
              onClick={() => { setEditingId(null); setForm(emptyForm); setError(''); setShowAddModal(true); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center"><i className="ri-add-line text-xl"></i></div>
              New Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            {[
              { key: 'Visitor', icon: 'ri-user-line', color: 'bg-blue-100 text-blue-600' },
              { key: 'Incident', icon: 'ri-alert-line', color: 'bg-red-100 text-red-600' },
              { key: 'Patrol', icon: 'ri-shield-check-line', color: 'bg-green-100 text-green-600' },
              { key: 'Delivery', icon: 'ri-box-3-line', color: 'bg-purple-100 text-purple-600' },
              { key: 'Alarm', icon: 'ri-alarm-warning-line', color: 'bg-yellow-100 text-yellow-600' },
            ].map((c) => (
              <div key={c.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg mb-3 ${c.color}`}>
                  <i className={`${c.icon} text-xl`}></i>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{typeCounts[c.key]}</p>
                <p className="text-sm text-gray-600">{c.key}s</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Entries</h2>
              <span className="text-sm text-gray-500">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</span>
            </div>
            <div className="p-6">
              {loading ? (
                <p className="text-gray-500 text-sm">Loading…</p>
              ) : entries.length === 0 ? (
                <p className="text-gray-500 text-sm">No entries yet. Click &quot;New Entry&quot; to add one.</p>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => {
                    const canEdit = isManager || (entry.created_by === user?.id && entry.status === 'submitted');
                    return (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${getTypeColor(entry.entry_type)}`}>
                              <i className={`${getTypeIcon(entry.entry_type)} text-2xl`}></i>
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                {entry.reference_number && <span className="text-xs font-mono font-medium text-blue-600">{entry.reference_number}</span>}
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.entry_type)}`}>{entry.entry_type}</span>
                                <StatusBadge status={entry.status} />
                              </div>
                              <p className="text-sm text-gray-600">{entry.entry_date} • {entry.entry_time}</p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-gray-900">{entry.officer || 'Unknown'}</span> • {entry.location}
                              </p>
                            </div>
                          </div>
                          <RecordActions table="dob_entries" id={entry.id} status={entry.status} canEdit={canEdit} onEdit={() => openEdit(entry)} onChanged={load} />
                        </div>
                        <p className="text-gray-700 leading-relaxed">{entry.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Entry' : 'Add New Entry'}</h3>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time <span className="text-red-500">*</span></label>
                  <input type="time" value={form.entry_time} onChange={(e) => setForm({ ...form, entry_time: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type <span className="text-red-500">*</span></label>
                  <select value={form.entry_type} onChange={(e) => setForm({ ...form, entry_type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                    <option value="">Select type</option>
                    {entryTypes.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={200} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <textarea rows={6} maxLength={3000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" />
                <p className="text-xs text-gray-500 mt-1">{form.description.length}/3000 characters</p>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <i className="ri-error-warning-line text-red-600"></i>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
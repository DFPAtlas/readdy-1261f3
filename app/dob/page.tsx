'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DobEntry {
  id: number;
  entry_date: string;
  entry_time: string;
  officer: string;
  entry_type: string;
  description: string;
  location: string;
  created_at: string;
}

const emptyForm = {
  entry_date: '',
  entry_time: '',
  officer: '',
  entry_type: '',
  description: '',
  location: '',
};

export default function DOBPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [entries, setEntries] = useState<DobEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('dob_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    setEntries(data as DobEntry[]);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await supabase.from('dob_entries').delete().eq('id', id);
    setDeletingId(null);
    fetchEntries();
  };

  const openEdit = (entry: DobEntry) => {
    setEditingId(entry.id);
    setForm({
      entry_date: entry.entry_date,
      entry_time: entry.entry_time,
      officer: entry.officer,
      entry_type: entry.entry_type,
      description: entry.description,
      location: entry.location,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.entry_date || !form.entry_time || !form.officer || !form.entry_type || !form.description || !form.location) return;

    if (editingId) {
      await supabase.from('dob_entries').update({
        entry_date: form.entry_date,
        entry_time: form.entry_time,
        officer: form.officer,
        entry_type: form.entry_type,
        description: form.description,
        location: form.location,
      }).eq('id', editingId);
    } else {
      await supabase.from('dob_entries').insert({
        entry_date: form.entry_date,
        entry_time: form.entry_time,
        officer: form.officer,
        entry_type: form.entry_type,
        description: form.description,
        location: form.location,
      });
    }
    closeModal();
    fetchEntries();
  };

  const typeCounts: { [key: string]: number } = {
    Visitor: 0,
    Incident: 0,
    Patrol: 0,
    Delivery: 0,
    Alarm: 0,
  };
  entries.forEach((e) => {
    if (typeCounts[e.entry_type] !== undefined) typeCounts[e.entry_type] += 1;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Visitor':
        return 'bg-blue-100 text-blue-700';
      case 'Incident':
        return 'bg-red-100 text-red-700';
      case 'Patrol':
        return 'bg-green-100 text-green-700';
      case 'Delivery':
        return 'bg-purple-100 text-purple-700';
      case 'Alarm':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Visitor':
        return 'ri-user-line';
      case 'Incident':
        return 'ri-alert-line';
      case 'Patrol':
        return 'ri-shield-check-line';
      case 'Delivery':
        return 'ri-box-3-line';
      case 'Alarm':
        return 'ri-alarm-warning-line';
      default:
        return 'ri-file-text-line';
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
              onClick={() => { setEditingId(null); setForm(emptyForm); setShowAddModal(true); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-add-line text-xl"></i>
              </div>
              New Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg mb-3">
                <i className="ri-user-line text-blue-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{typeCounts.Visitor}</p>
              <p className="text-sm text-gray-600">Visitors</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg mb-3">
                <i className="ri-alert-line text-red-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{typeCounts.Incident}</p>
              <p className="text-sm text-gray-600">Incidents</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg mb-3">
                <i className="ri-shield-check-line text-green-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{typeCounts.Patrol}</p>
              <p className="text-sm text-gray-600">Patrols</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg mb-3">
                <i className="ri-box-3-line text-purple-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{typeCounts.Delivery}</p>
              <p className="text-sm text-gray-600">Deliveries</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 rounded-lg mb-3">
                <i className="ri-alarm-warning-line text-yellow-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{typeCounts.Alarm}</p>
              <p className="text-sm text-gray-600">Alarms</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Entries</h2>
              <span className="text-sm text-gray-500">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</span>
            </div>
            <div className="p-6">
              {entries.length === 0 ? (
                <p className="text-gray-500 text-sm">No entries yet. Click "New Entry" to add one.</p>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${getTypeColor(entry.entry_type)}`}>
                            <i className={`${getTypeIcon(entry.entry_type)} text-2xl`}></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.entry_type)}`}>
                                {entry.entry_type}
                              </span>
                              <span className="text-sm text-gray-600">{entry.entry_date} • {entry.entry_time}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{entry.officer}</span> • {entry.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(entry)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 cursor-pointer"
                            title="Edit entry"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer disabled:opacity-50"
                            title="Delete entry"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{entry.description}</p>
                    </div>
                  ))}
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
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={form.entry_date}
                    onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={form.entry_time}
                    onChange={(e) => setForm({ ...form, entry_time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Officer Name</label>
                <input
                  type="text"
                  placeholder="Enter officer name"
                  value={form.officer}
                  onChange={(e) => setForm({ ...form, officer: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
                  <select
                    value={form.entry_type}
                    onChange={(e) => setForm({ ...form, entry_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                  >
                    <option value="">Select type</option>
                    <option>Visitor</option>
                    <option>Incident</option>
                    <option>Patrol</option>
                    <option>Delivery</option>
                    <option>Alarm</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={6}
                  maxLength={500}
                  placeholder="Provide detailed description of the occurrence..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{form.description.length}/500 characters</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                {editingId ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import { StatusBadge, RecordActions } from '@/components/RecordControls';
import {
  fetchIncidents,
  submitIncident,
  updateIncident,
  IncidentReport,
  SEVERITIES,
  rpcError,
  toCsv,
  downloadCsv,
  logExport,
} from '@/lib/forms';

const DRAFT_KEY = 'incident-draft-v1';

const emptyForm = {
  incidentDate: '',
  incidentTime: '',
  location: '',
  incidentType: '',
  severity: 'medium',
  personsInvolved: '',
  witnessName: '',
  witnessContact: '',
  description: '',
  actionTaken: '',
};

const incidentTypes = [
  { value: 'safety', label: 'Safety Incident' },
  { value: 'security', label: 'Security Breach' },
  { value: 'equipment', label: 'Equipment Failure' },
  { value: 'injury', label: 'Personal Injury' },
  { value: 'property', label: 'Property Damage' },
  { value: 'other', label: 'Other' },
];

export default function IncidentReportPage() {
  const { user, role } = useAuth();
  const isManager = roleRank(role) >= 3;

  const [formData, setFormData] = useState(emptyForm);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDraft, setShowDraft] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await fetchIncidents());
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (localStorage.getItem(DRAFT_KEY)) setShowDraft(true);
  }, []);

  const persistDraft = (next: typeof emptyForm) => {
    const hasContent = Object.values(next).some((v) => v !== '' && v !== 'medium');
    if (hasContent) localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    else localStorage.removeItem(DRAFT_KEY);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const next = { ...formData, [e.target.name]: e.target.value };
    setFormData(next);
    persistDraft(next);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    localStorage.removeItem(DRAFT_KEY);
    setShowDraft(false);
  };

  const restoreDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || '');
      setFormData({ ...emptyForm, ...d });
    } catch {
      /* ignore */
    }
    setShowDraft(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraft(false);
  };

  const validate = (): string | null => {
    if (!formData.incidentDate) return 'Incident date is required.';
    if (!formData.incidentTime) return 'Incident time is required.';
    if (!formData.location.trim()) return 'Location is required.';
    if (!formData.incidentType) return 'Incident type is required.';
    if (!formData.description.trim()) return 'Description is required.';
    if (formData.description.length > 3000) return 'Description must be 3000 characters or fewer.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateIncident(editingId, formData);
        setSuccess('Incident report updated successfully.');
      } else {
        const ref = await submitIncident(formData);
        setSuccess(`Incident report submitted (${ref}).`);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(rpcError(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r: IncidentReport) => {
    setEditingId(r.id);
    setFormData({
      incidentDate: r.incident_date || '',
      incidentTime: r.incident_time || '',
      location: r.location || '',
      incidentType: r.incident_type || '',
      severity: r.severity || 'medium',
      personsInvolved: r.persons_involved || '',
      witnessName: r.witness_name || '',
      witnessContact: r.witness_contact || '',
      description: r.description || '',
      actionTaken: r.action_taken || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async () => {
    const headers = ['reference_number', 'incident_date', 'incident_time', 'location', 'incident_type', 'severity', 'reporter_name', 'status', 'description'];
    const csv = toCsv(reports as unknown as Record<string, unknown>[], headers);
    await logExport('incident_reports', reports.length);
    downloadCsv('incident-reports.csv', csv);
  };

  const typeLabel = (t: string | null) => incidentTypes.find((x) => x.value === t)?.label || t || 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg">
                <i className="ri-alert-line text-red-600 text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Incident Report Form</h1>
                <p className="text-gray-600">Report any incidents, accidents, or safety concerns</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              <i className="ri-download-line"></i> Export CSV
            </button>
          </div>

          {showDraft && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <p className="text-blue-800 text-sm">You have an unsaved draft. Would you like to restore it?</p>
              <div className="flex gap-2">
                <button onClick={restoreDraft} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium cursor-pointer whitespace-nowrap">Restore</button>
                <button onClick={discardDraft} className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded text-sm cursor-pointer whitespace-nowrap">Discard</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Incident Report' : 'New Incident Report'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-information-line text-blue-600 text-lg"></i>
                  </div>
                  Incident Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incident Date <span className="text-red-500">*</span></label>
                    <input type="date" name="incidentDate" value={formData.incidentDate} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incident Time <span className="text-red-500">*</span></label>
                    <input type="time" name="incidentTime" value={formData.incidentTime} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} maxLength={200} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Where did the incident occur?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type <span className="text-red-500">*</span></label>
                    <select name="incidentType" value={formData.incidentType} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                      <option value="">Select type</option>
                      {incidentTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity Level <span className="text-red-500">*</span></label>
                    <div className="flex gap-4">
                      {SEVERITIES.map((level) => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="severity" value={level} checked={formData.severity === level} onChange={handleChange} className="w-4 h-4 text-blue-600 cursor-pointer" />
                          <span className="text-sm text-gray-700 capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-group-line text-blue-600 text-lg"></i>
                  </div>
                  People Involved
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Persons Involved</label>
                    <input type="text" name="personsInvolved" value={formData.personsInvolved} onChange={handleChange} maxLength={300} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Names of people involved" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Witness Name</label>
                    <input type="text" name="witnessName" value={formData.witnessName} onChange={handleChange} maxLength={200} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Witness Contact</label>
                    <input type="text" name="witnessContact" value={formData.witnessContact} onChange={handleChange} maxLength={200} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-file-text-line text-blue-600 text-lg"></i>
                  </div>
                  Incident Description
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description <span className="text-red-500">*</span></label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={6} maxLength={3000} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" placeholder="Provide a detailed description..." />
                    <p className="text-xs text-gray-500 mt-1">{formData.description.length}/3000 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Immediate Action Taken</label>
                    <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange} rows={4} maxLength={1000} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Cancel Edit</button>
                )}
                <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Clear Form</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 disabled:opacity-50">
                  {saving ? <i className="ri-loader-4-line animate-spin text-lg"></i> : <i className="ri-send-plane-line text-lg"></i>}
                  {saving ? 'Saving…' : editingId ? 'Update Report' : 'Submit Report'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <i className="ri-error-warning-line text-red-600 text-xl"></i>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-file-list-3-line text-blue-600 text-lg"></i>
                </div>
                Submitted Reports
              </h2>
              <span className="text-sm text-gray-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
            </div>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : reports.length === 0 ? (
              <p className="text-gray-500 text-sm">No reports submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => {
                  const canEdit = isManager || (report.created_by === user?.id && report.status === 'submitted');
                  return (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg flex-shrink-0">
                            <i className="ri-alert-line text-red-600 text-xl"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {report.reference_number && (
                                <span className="text-xs font-mono font-medium text-blue-600">{report.reference_number}</span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{typeLabel(report.incident_type)}</span>
                              <StatusBadge status={report.status} />
                            </div>
                            <p className="font-medium text-gray-900">{report.location}</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {report.incident_date} at {report.incident_time} • Reported by {report.reporter_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{report.description}</p>
                          </div>
                        </div>
                        <RecordActions table="incident_reports" id={report.id} status={report.status} canEdit={canEdit} onEdit={() => startEdit(report)} onChanged={load} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
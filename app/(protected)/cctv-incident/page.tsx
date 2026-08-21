'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { StatusBadge, RecordActions } from '@/components/RecordControls';
import { fetchCctv, submitCctv, CctvReport, rpcError, toCsv, downloadCsv, logExport } from '@/lib/forms';

const DRAFT_KEY = 'cctv-draft-v1';

const emptyForm = {
  incident_date: '',
  incident_time: '',
  incident_location: '',
  incident_type: 'Other',
  incident_description: '',
  camera_id: '',
  footage_datetime: '',
  reviewed_by: '',
  footage_saved: false,
  retention_period: '30 days',
  retention_review_date: '',
  restricted_access: 'standard',
  storage_location: '',
  people_count: 0,
  identified: false,
  staff_member_involved: false,
  ic_code: '',
  individual_names: '',
  witnesses_present: false,
  witness_details: '',
  vehicle_involved: false,
  vehicle_reg: '',
  vehicle_make: '',
  vehicle_color: '',
  items_involved: '',
  damage_description: '',
  estimated_value: 0,
  police_contacted: false,
  police_ref: '',
  footage_shared: false,
  disclosure_date: '',
  recipient_org: '',
  access_reason: '',
  authorised_by: '',
  compliance_check: false,
  officer_name: '',
  job_title: '',
  date_completed: '',
  manager_review: false,
  manager_comments: '',
};

const incidentTypes = ['Antisocial Behaviour', 'Fly-tipping', 'Vandalism', 'Trespassing', 'Theft', 'Other'];
const icCodes = [
  { value: '', label: 'Select IC Code' },
  { value: 'IC1', label: 'IC1: White (North European)' },
  { value: 'IC2', label: 'IC2: White (South European)' },
  { value: 'IC3', label: 'IC3: Black (African Caribbean or Sub-Saharan African)' },
  { value: 'IC4', label: 'IC4: Asian (Indian subcontinent)' },
  { value: 'IC5', label: 'IC5: Oriental (Chinese, Japanese, or other Southeast Asian)' },
  { value: 'IC6', label: 'IC6: Arab or North African' },
];

export default function CCTVIncidentPage() {
  const [formData, setFormData] = useState(emptyForm);
  const [reports, setReports] = useState<CctvReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDraft, setShowDraft] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await fetchCctv());
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
    const hasContent = Object.values(next).some((v) => (typeof v === 'string' ? v !== '' : v !== false && v !== 0));
    if (hasContent) localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    else localStorage.removeItem(DRAFT_KEY);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const next = { ...formData, [name]: type === 'checkbox' ? checked : value };
    setFormData(next);
    persistDraft(next);
  };

  const resetForm = () => {
    setFormData(emptyForm);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...formData,
        people_count: Number(formData.people_count) || 0,
        estimated_value: Number(formData.estimated_value) || 0,
      };
      const ref = await submitCctv(payload);
      setSuccess(`CCTV incident report submitted (${ref}).`);
      resetForm();
      await load();
    } catch (err) {
      setError(rpcError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const headers = ['reference_number', 'incident_date', 'incident_time', 'incident_location', 'incident_type', 'status', 'officer_name', 'restricted_access'];
    const csv = toCsv(reports as unknown as Record<string, unknown>[], headers);
    await logExport('cctv_incident_reports', reports.length);
    downloadCsv('cctv-incident-reports.csv', csv);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 print:bg-white">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {showDraft && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <p className="text-blue-800 text-sm">You have an unsaved draft. Would you like to restore it?</p>
              <div className="flex gap-2">
                <button onClick={restoreDraft} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium cursor-pointer whitespace-nowrap">Restore</button>
                <button onClick={() => { localStorage.removeItem(DRAFT_KEY); setShowDraft(false); }} className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded text-sm cursor-pointer whitespace-nowrap">Discard</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 print:bg-white print:border-b-2 print:border-slate-800">
              <h1 className="text-2xl font-bold text-white print:text-slate-900">CCTV Incident Report</h1>
              <p className="text-slate-300 text-sm mt-1 print:text-slate-600">Hertfordshire County Council</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Incident Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date of Incident <span className="text-red-500">*</span></label>
                    <input type="date" name="incident_date" value={formData.incident_date} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time of Incident <span className="text-red-500">*</span></label>
                    <input type="time" name="incident_time" value={formData.incident_time} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location of Incident <span className="text-red-500">*</span></label>
                  <input type="text" name="incident_location" value={formData.incident_location} onChange={handleChange} required maxLength={200} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type of Incident <span className="text-red-500">*</span></label>
                  <select name="incident_type" value={formData.incident_type} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm pr-8">
                    {incidentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Brief Description <span className="text-red-500">*</span></label>
                  <textarea name="incident_description" value={formData.incident_description} onChange={handleChange} required rows={4} maxLength={3000} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y" />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">CCTV Footage Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Camera ID / Location <span className="text-red-500">*</span></label>
                    <input type="text" name="camera_id" value={formData.camera_id} onChange={handleChange} required maxLength={100} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date & Time Footage Captured <span className="text-red-500">*</span></label>
                    <input type="datetime-local" name="footage_datetime" value={formData.footage_datetime} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Footage Reviewed By (Name & Job Title) <span className="text-red-500">*</span></label>
                  <input type="text" name="reviewed_by" value={formData.reviewed_by} onChange={handleChange} required maxLength={200} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="footage_saved" name="footage_saved" checked={formData.footage_saved} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="footage_saved" className="text-sm font-medium text-slate-700 cursor-pointer">Was Footage Exported/Saved?</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Retention Period</label>
                    <select name="retention_period" value={formData.retention_period} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm pr-8">
                      <option value="7 days">7 days</option>
                      <option value="30 days">30 days</option>
                      <option value="90 days">90 days</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Retention Review Date</label>
                    <input type="date" name="retention_review_date" value={formData.retention_review_date} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Restricted Access Classification</label>
                    <select name="restricted_access" value={formData.restricted_access} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm pr-8">
                      <option value="standard">Standard</option>
                      <option value="restricted">Restricted</option>
                      <option value="highly_restricted">Highly Restricted</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Storage Location of Footage</label>
                  <input type="text" name="storage_location" value={formData.storage_location} onChange={handleChange} maxLength={200} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Individuals Involved</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Number of People Observed</label>
                    <input type="number" name="people_count" value={formData.people_count} onChange={handleChange} min={0} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="identified" name="identified" checked={formData.identified} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="identified" className="text-sm font-medium text-slate-700 cursor-pointer">Identified?</label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="staff_member_involved" name="staff_member_involved" checked={formData.staff_member_involved} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="staff_member_involved" className="text-sm font-medium text-slate-700 cursor-pointer">Staff Member Involved?</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">IC Code</label>
                  <select name="ic_code" value={formData.ic_code} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm pr-8">
                    {icCodes.map((code) => <option key={code.value} value={code.value}>{code.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Names/Details (if known)</label>
                  <input type="text" name="individual_names" value={formData.individual_names} onChange={handleChange} maxLength={300} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="witnesses_present" name="witnesses_present" checked={formData.witnesses_present} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                  <label htmlFor="witnesses_present" className="text-sm font-medium text-slate-700 cursor-pointer">Witnesses Present?</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Witness Contact Details</label>
                  <textarea name="witness_details" value={formData.witness_details} onChange={handleChange} rows={3} maxLength={500} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y" />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Vehicle Involved</h2>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="vehicle_involved" name="vehicle_involved" checked={formData.vehicle_involved} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                  <label htmlFor="vehicle_involved" className="text-sm font-medium text-slate-700 cursor-pointer">Was a Vehicle Involved?</label>
                </div>
                {formData.vehicle_involved && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Registration Number</label>
                      <input type="text" name="vehicle_reg" value={formData.vehicle_reg} onChange={handleChange} maxLength={20} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Make/Model</label>
                      <input type="text" name="vehicle_make" value={formData.vehicle_make} onChange={handleChange} maxLength={100} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Colour</label>
                      <input type="text" name="vehicle_color" value={formData.vehicle_color} onChange={handleChange} maxLength={50} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Damage & Police Action</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Items or Infrastructure Involved</label>
                  <textarea name="items_involved" value={formData.items_involved} onChange={handleChange} rows={3} maxLength={500} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Damage or Loss Description</label>
                  <textarea name="damage_description" value={formData.damage_description} onChange={handleChange} rows={3} maxLength={500} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Value (£)</label>
                    <input type="number" name="estimated_value" value={formData.estimated_value} onChange={handleChange} min={0} step={0.01} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="police_contacted" name="police_contacted" checked={formData.police_contacted} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="police_contacted" className="text-sm font-medium text-slate-700 cursor-pointer">Was Law Enforcement Contacted?</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Police Reference Number</label>
                  <input type="text" name="police_ref" value={formData.police_ref} onChange={handleChange} maxLength={100} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Data Sharing & Compliance</h2>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="footage_shared" name="footage_shared" checked={formData.footage_shared} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                  <label htmlFor="footage_shared" className="text-sm font-medium text-slate-700 cursor-pointer">Was Footage Shared Externally?</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date of Disclosure</label>
                    <input type="date" name="disclosure_date" value={formData.disclosure_date} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Organisation</label>
                    <input type="text" name="recipient_org" value={formData.recipient_org} onChange={handleChange} maxLength={200} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                </div>
                {formData.footage_shared && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Access/Export <span className="text-red-500">*</span></label>
                    <textarea name="access_reason" value={formData.access_reason} onChange={handleChange} rows={3} maxLength={500} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y" placeholder="State the lawful basis and reason for sharing/exporting footage" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Authorised By</label>
                    <input type="text" name="authorised_by" value={formData.authorised_by} onChange={handleChange} maxLength={200} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="compliance_check" name="compliance_check" checked={formData.compliance_check} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="compliance_check" className="text-sm font-medium text-slate-700 cursor-pointer">Compliance Check Completed?</label>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Report Completion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name of Officer Completing Report <span className="text-red-500">*</span></label>
                    <input type="text" name="officer_name" value={formData.officer_name} onChange={handleChange} required maxLength={200} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Title <span className="text-red-500">*</span></label>
                    <input type="text" name="job_title" value={formData.job_title} onChange={handleChange} required maxLength={200} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date Completed <span className="text-red-500">*</span></label>
                    <input type="date" name="date_completed" value={formData.date_completed} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="manager_review" name="manager_review" checked={formData.manager_review} onChange={handleChange} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="manager_review" className="text-sm font-medium text-slate-700 cursor-pointer">Manager Review Required?</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Manager Name & Comments</label>
                  <textarea name="manager_comments" value={formData.manager_comments} onChange={handleChange} rows={3} maxLength={500} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y" />
                </div>
              </section>

              <div className="flex gap-4 justify-end pt-6 border-t print:hidden">
                <button type="button" onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 transition-all whitespace-nowrap cursor-pointer">
                  <i className="ri-file-excel-2-line text-lg"></i> Export CSV
                </button>
                <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-lg shadow-lg transition-all whitespace-nowrap cursor-pointer">
                  <i className="ri-printer-line text-lg"></i> Print Form
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50">
                  {saving ? <i className="ri-loader-4-line animate-spin text-lg"></i> : <i className="ri-send-plane-line text-lg"></i>}
                  {saving ? 'Saving…' : 'Submit Report'}
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

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6 print:hidden">
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-vidicon-line text-slate-700 text-lg"></i>
                </div>
                Submitted Reports
              </h2>
              <span className="text-sm text-slate-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
            </div>
            {loading ? (
              <p className="px-8 py-6 text-slate-500 text-sm">Loading…</p>
            ) : reports.length === 0 ? (
              <p className="px-8 py-6 text-slate-500 text-sm">No reports submitted yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <div key={report.id} className="px-8 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg flex-shrink-0">
                        <i className="ri-file-text-line text-slate-600 text-xl"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {report.reference_number && <span className="text-xs font-mono font-medium text-blue-600">{report.reference_number}</span>}
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-white">{report.incident_type as string}</span>
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="font-medium text-slate-900">{report.incident_location as string}</p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {report.incident_date as string} at {report.incident_time as string} • Officer: {report.officer_name as string}
                        </p>
                        <p className="text-sm text-slate-700 mt-2 line-clamp-2">{report.incident_description as string}</p>
                      </div>
                    </div>
                    <RecordActions table="cctv_incident_reports" id={report.id} status={report.status} canEdit={false} onChanged={load} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="mt-6 text-center text-sm text-slate-600 print:hidden">
            <p>All data is handled in accordance with GDPR and UK Data Protection Act 2018</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
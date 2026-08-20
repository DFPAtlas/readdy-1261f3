'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CCTVReport {
  id: number;
  incident_date: string;
  incident_time: string;
  incident_location: string;
  incident_type: string;
  incident_description: string;
  officer_name: string;
  created_at: string;
}

export default function CCTVIncidentPage() {
  const [formData, setFormData] = useState({
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
    authorised_by: '',
    compliance_check: false,
    officer_name: '',
    job_title: '',
    date_completed: '',
    manager_review: false,
    manager_comments: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [reports, setReports] = useState<CCTVReport[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('cctv_incident_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    setReports(data as CCTVReport[]);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteReport = async (id: number) => {
    setDeletingId(id);
    await supabase.from('cctv_incident_reports').delete().eq('id', id);
    setDeletingId(null);
    fetchReports();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('cctv_incident_reports').insert({
      ...formData,
      people_count: Number(formData.people_count) || 0,
      estimated_value: Number(formData.estimated_value) || 0,
    });
    if (error) {
      console.error('Insert error:', error);
      return;
    }
    fetchReports();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = Object.keys(formData).join(',');
    const values = Object.values(formData).map(v => `"${v}"`).join(',');
    const csv = `${headers}\n${values}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cctv-incident-report.csv';
    a.click();
  };

  const incidentTypes = [
    'Antisocial Behaviour',
    'Fly-tipping',
    'Vandalism',
    'Trespassing',
    'Theft',
    'Other',
  ];

  const icCodes = [
    { value: '', label: 'Select IC Code' },
    { value: 'IC1', label: 'IC1: White (North European)' },
    { value: 'IC2', label: 'IC2: White (South European)' },
    { value: 'IC3', label: 'IC3: Black (African Caribbean or Sub-Saharan African)' },
    { value: 'IC4', label: 'IC4: Asian (Indian subcontinent)' },
    { value: 'IC5', label: 'IC5: Oriental (Chinese, Japanese, or other Southeast Asian)' },
    { value: 'IC6', label: 'IC6: Arab or North African' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 print:bg-white">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 print:bg-white print:border-b-2 print:border-slate-800">
              <div>
                <h1 className="text-2xl font-bold text-white print:text-slate-900">CCTV Incident Report</h1>
                <p className="text-slate-300 text-sm mt-1 print:text-slate-600">Hertfordshire County Council</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Incident Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date of Incident <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="incident_date"
                      value={formData.incident_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Time of Incident <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="incident_time"
                      value={formData.incident_time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Location of Incident <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="incident_location"
                    value={formData.incident_location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type of Incident <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="incident_type"
                    value={formData.incident_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm pr-8"
                  >
                    {incidentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Brief Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="incident_description"
                    value={formData.incident_description}
                    onChange={handleChange}
                    required
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-y"
                    placeholder="Describe the incident..."
                  />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">CCTV Footage Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Camera ID / Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="camera_id"
                      value={formData.camera_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder="e.g., CAM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date & Time Footage Captured <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="footage_datetime"
                      value={formData.footage_datetime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Footage Reviewed By (Name & Job Title) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="reviewed_by"
                    value={formData.reviewed_by}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="Name and job title"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="footage_saved"
                      name="footage_saved"
                      checked={formData.footage_saved}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="footage_saved" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Was Footage Exported/Saved?
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Retention Period</label>
                    <select
                      name="retention_period"
                      value={formData.retention_period}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm pr-8"
                    >
                      <option value="7 days">7 days</option>
                      <option value="30 days">30 days</option>
                      <option value="90 days">90 days</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Storage Location of Footage</label>
                  <input
                    type="text"
                    name="storage_location"
                    value={formData.storage_location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="Where is the footage stored?"
                  />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Individuals Involved</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Number of People Observed</label>
                    <input
                      type="number"
                      name="people_count"
                      value={formData.people_count}
                      onChange={handleChange}
                      min={0}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="identified"
                      name="identified"
                      checked={formData.identified}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="identified" className="text-sm font-medium text-slate-700 cursor-pointer">Identified?</label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="staff_member_involved"
                      name="staff_member_involved"
                      checked={formData.staff_member_involved}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="staff_member_involved" className="text-sm font-medium text-slate-700 cursor-pointer">Staff Member Involved?</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">IC Code</label>
                  <select
                    name="ic_code"
                    value={formData.ic_code}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm pr-8"
                  >
                    {icCodes.map((code) => (
                      <option key={code.value} value={code.value}>{code.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Names/Details (if known)</label>
                  <input
                    type="text"
                    name="individual_names"
                    value={formData.individual_names}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="Enter names if known"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="witnesses_present"
                    name="witnesses_present"
                    checked={formData.witnesses_present}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="witnesses_present" className="text-sm font-medium text-slate-700 cursor-pointer">Witnesses Present?</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Witness Contact Details</label>
                  <textarea
                    name="witness_details"
                    value={formData.witness_details}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-y"
                    placeholder="Enter witness contact information"
                  />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Vehicle Involved</h2>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="vehicle_involved"
                    name="vehicle_involved"
                    checked={formData.vehicle_involved}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="vehicle_involved" className="text-sm font-medium text-slate-700 cursor-pointer">Was a Vehicle Involved?</label>
                </div>
                {formData.vehicle_involved && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Registration Number</label>
                      <input
                        type="text"
                        name="vehicle_reg"
                        value={formData.vehicle_reg}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., AB12 CDE"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Make/Model</label>
                      <input
                        type="text"
                        name="vehicle_make"
                        value={formData.vehicle_make}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., Ford Focus"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Colour</label>
                      <input
                        type="text"
                        name="vehicle_color"
                        value={formData.vehicle_color}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="e.g., Silver"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Damage & Police Action</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Items or Infrastructure Involved</label>
                  <textarea
                    name="items_involved"
                    value={formData.items_involved}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-y"
                    placeholder="Describe items or infrastructure involved"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Damage or Loss Description</label>
                  <textarea
                    name="damage_description"
                    value={formData.damage_description}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-y"
                    placeholder="Describe any damage or loss"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Value (£)</label>
                    <input
                      type="number"
                      name="estimated_value"
                      value={formData.estimated_value}
                      onChange={handleChange}
                      min={0}
                      step={0.01}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="police_contacted"
                      name="police_contacted"
                      checked={formData.police_contacted}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="police_contacted" className="text-sm font-medium text-slate-700 cursor-pointer">Was Law Enforcement Contacted?</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Police Reference Number</label>
                  <input
                    type="text"
                    name="police_ref"
                    value={formData.police_ref}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="Enter police reference number"
                  />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Data Sharing & Compliance</h2>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="footage_shared"
                    name="footage_shared"
                    checked={formData.footage_shared}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="footage_shared" className="text-sm font-medium text-slate-700 cursor-pointer">Was Footage Shared Externally?</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date of Disclosure</label>
                    <input
                      type="date"
                      name="disclosure_date"
                      value={formData.disclosure_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Organisation</label>
                    <input
                      type="text"
                      name="recipient_org"
                      value={formData.recipient_org}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder="Organisation name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Authorised By</label>
                    <input
                      type="text"
                      name="authorised_by"
                      value={formData.authorised_by}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder="Name of authoriser"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="compliance_check"
                      name="compliance_check"
                      checked={formData.compliance_check}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="compliance_check" className="text-sm font-medium text-slate-700 cursor-pointer">Compliance Check Completed?</label>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b-2 border-slate-200">Report Completion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name of Officer Completing Report <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="officer_name"
                      value={formData.officer_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder="Your job title"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date Completed <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_completed"
                      value={formData.date_completed}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="manager_review"
                      name="manager_review"
                      checked={formData.manager_review}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="manager_review" className="text-sm font-medium text-slate-700 cursor-pointer">Manager Review Required?</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Manager Name & Comments</label>
                  <textarea
                    name="manager_comments"
                    value={formData.manager_comments}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-y"
                    placeholder="Manager comments"
                  />
                </div>
              </section>

              <div className="flex gap-4 justify-end pt-6 border-t print:hidden">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-file-excel-2-line text-lg"></i>
                  </div>
                  Export to Excel
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-printer-line text-lg"></i>
                  </div>
                  Print Form
                </button>
              </div>

              {submitted && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-check-line text-green-600 text-xl"></i>
                  </div>
                  <p className="text-green-800 font-medium">Report submitted successfully!</p>
                </div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6 print:hidden">
            <div className="px-8 py-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-vidicon-line text-slate-700 text-lg"></i>
                  </div>
                  Submitted Reports
                </h2>
                <span className="text-sm text-slate-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {reports.length === 0 ? (
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
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-white">
                            {report.incident_type}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900">{report.incident_location}</p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {report.incident_date} at {report.incident_time} • Officer: {report.officer_name}
                        </p>
                        <p className="text-sm text-slate-700 mt-2 line-clamp-2">{report.incident_description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      disabled={deletingId === report.id}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 cursor-pointer disabled:opacity-50 flex-shrink-0"
                      title="Delete report"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
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

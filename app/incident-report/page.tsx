'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface IncidentReport {
  id: number;
  reporter_name: string;
  reporter_email: string;
  incident_date: string;
  incident_time: string;
  location: string;
  incident_type: string;
  severity: string;
  persons_involved: string;
  witness_name: string;
  witness_contact: string;
  description: string;
  action_taken: string;
  created_at: string;
}

export default function IncidentReportPage() {
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
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
  });

  const [submitted, setSubmitted] = useState(false);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const incidentTypeLabels: { [key: string]: string } = {
    safety: 'Safety Incident',
    security: 'Security Breach',
    equipment: 'Equipment Failure',
    injury: 'Personal Injury',
    property: 'Property Damage',
    other: 'Other',
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('incident_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    setReports(data as IncidentReport[]);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteReport = async (id: number) => {
    setDeletingId(id);
    await supabase.from('incident_reports').delete().eq('id', id);
    setDeletingId(null);
    fetchReports();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('incident_reports').insert({
      reporter_name: formData.reporterName,
      reporter_email: formData.reporterEmail,
      incident_date: formData.incidentDate,
      incident_time: formData.incidentTime,
      location: formData.location,
      incident_type: formData.incidentType,
      severity: formData.severity,
      persons_involved: formData.personsInvolved,
      witness_name: formData.witnessName,
      witness_contact: formData.witnessContact,
      description: formData.description,
      action_taken: formData.actionTaken,
    });
    if (error) {
      console.error('Insert error:', error);
      return;
    }
    fetchReports();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        reporterName: '',
        reporterEmail: '',
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
      });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg">
                <i className="ri-alert-line text-red-600 text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Incident Report Form</h1>
                <p className="text-gray-600">Report any incidents, accidents, or safety concerns</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-user-line text-blue-600 text-lg"></i>
                  </div>
                  Reporter Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="reporterName"
                      value={formData.reporterName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="reporterEmail"
                      value={formData.reporterEmail}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-information-line text-blue-600 text-lg"></i>
                  </div>
                  Incident Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Incident Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="incidentDate"
                      value={formData.incidentDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Incident Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="incidentTime"
                      value={formData.incidentTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Where did the incident occur?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Incident Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="incidentType"
                      value={formData.incidentType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                    >
                      <option value="">Select type</option>
                      <option value="safety">Safety Incident</option>
                      <option value="security">Security Breach</option>
                      <option value="equipment">Equipment Failure</option>
                      <option value="injury">Personal Injury</option>
                      <option value="property">Property Damage</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity Level <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      {['low', 'medium', 'high', 'critical'].map((level) => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="severity"
                            value={level}
                            checked={formData.severity === level}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                          />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Persons Involved
                    </label>
                    <input
                      type="text"
                      name="personsInvolved"
                      value={formData.personsInvolved}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Names of people involved in the incident"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Witness Name
                    </label>
                    <input
                      type="text"
                      name="witnessName"
                      value={formData.witnessName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Name of witness (if any)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Witness Contact
                    </label>
                    <input
                      type="text"
                      name="witnessContact"
                      value={formData.witnessContact}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Phone or email"
                    />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={6}
                      maxLength={500}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="Provide a detailed description of what happened..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Immediate Action Taken
                    </label>
                    <textarea
                      name="actionTaken"
                      value={formData.actionTaken}
                      onChange={handleChange}
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      placeholder="Describe any immediate actions taken in response to the incident..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.actionTaken.length}/500 characters</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setFormData({
                    reporterName: '',
                    reporterEmail: '',
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
                  })}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-send-plane-line text-lg"></i>
                  </div>
                  Submit Report
                </button>
              </div>
            </form>

            {submitted && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-green-800 font-medium">Incident report submitted successfully!</p>
                  <p className="text-green-700 text-sm mt-1">Your report has been logged and will be reviewed by the appropriate team.</p>
                </div>
              </div>
            )}
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
            {reports.length === 0 ? (
              <p className="text-gray-500 text-sm">No reports submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg flex-shrink-0">
                          <i className="ri-alert-line text-red-600 text-xl"></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              {incidentTypeLabels[report.incident_type] || report.incident_type}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                              {report.severity}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{report.location}</p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {report.incident_date} at {report.incident_time} • Reported by {report.reporter_name}
                          </p>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{report.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={deletingId === report.id}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer disabled:opacity-50 flex-shrink-0"
                        title="Delete report"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

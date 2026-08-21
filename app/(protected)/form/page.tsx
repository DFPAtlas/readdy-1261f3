'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { submitKpiSubmission, rpcError } from '@/lib/forms';

const emptyForm = {
  department: '',
  date: '',
  subject: '',
  description: '',
  priority: 'medium',
};

export default function FormPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted('');
    setSaving(true);
    try {
      const ref = await submitKpiSubmission(formData);
      setSubmitted(`Form submitted successfully (${ref}).`);
      setFormData(emptyForm);
    } catch (err) {
      setError(rpcError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">KPI Form Submission</h1>
              <Link href="/kpi-dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
                <div className="w-4 h-4 flex items-center justify-center"><i className="ri-bar-chart-box-line"></i></div>
                View Dashboard
              </Link>
            </div>
            <p className="text-gray-600">Fill out the form below to submit your request or information</p>
            <p className="text-gray-500 text-sm mt-1">Submitting as <span className="font-medium text-gray-700">{user?.email || 'your account'}</span></p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department <span className="text-red-500">*</span></label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} required maxLength={100} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Your department" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required maxLength={200} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Brief subject of your submission" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level <span className="text-red-500">*</span></label>
                <select name="priority" value={formData.priority} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={6} maxLength={3000} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" placeholder="Provide detailed information..." />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/3000 characters</p>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <button type="button" onClick={() => setFormData(emptyForm)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer">Clear Form</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {saving && <i className="ri-loader-4-line animate-spin"></i>}
                  {saving ? 'Submitting…' : 'Submit Form'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <i className="ri-error-warning-line text-red-600 text-xl"></i>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              {submitted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                  <p className="text-green-800 text-sm">{submitted}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
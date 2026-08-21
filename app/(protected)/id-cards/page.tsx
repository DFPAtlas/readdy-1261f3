'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import {
  fetchIdCards,
  submitIdCardRequest,
  archiveAllIdCards,
  emptyIdCardForm,
  type IdCardRequest,
} from '@/lib/id-cards';
import { rpcError, toCsv, downloadCsv, logExport } from '@/lib/forms';

export default function IDCardsPage() {
  const { role } = useAuth();
  const isAdmin = roleRank(role) >= 4;

  const [records, setRecords] = useState<IdCardRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>(emptyIdCardForm());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');

  const [showArchive, setShowArchive] = useState(false);
  const [archiveText, setArchiveText] = useState('');
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchIdCards();
      setRecords(data);
    } catch {
      setLoadError('Could not load ID card records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: string, value: string) => setFormData((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setNotice('');
    try {
      const ref = await submitIdCardRequest(formData);
      setFormData(emptyIdCardForm());
      setNotice(`Request saved. Reference: ${ref}`);
      await load();
    } catch (err) {
      setFormError(rpcError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (records.length === 0) return;
    const headers = ['Reference', 'New/Replacement', 'Pay Role Number', 'Badge Type', 'Surname', 'Forename', 'Department', 'Location', 'Date Received', 'Status'];
    const data = records.map((r) => ({
      Reference: r.reference_number || '',
      'New/Replacement': r.new_replacement || '',
      'Pay Role Number': r.pay_role_number || '',
      'Badge Type': r.badge_type || '',
      Surname: r.surname || '',
      Forename: r.forename || '',
      Department: r.department || '',
      Location: r.base_location || '',
      'Date Received': r.date_received || '',
      Status: r.status || '',
    }));
    downloadCsv(`id-card-requests-${new Date().toISOString().split('T')[0]}.csv`, toCsv(data, headers));
    await logExport('id_card_requests', records.length).catch(() => {});
  };

  const confirmArchive = async () => {
    setArchiving(true);
    setFormError('');
    try {
      const count = await archiveAllIdCards();
      setNotice(`${count} record${count === 1 ? '' : 's'} archived.`);
      setShowArchive(false);
      setArchiveText('');
      await load();
    } catch (err) {
      setFormError(rpcError(err));
    } finally {
      setArchiving(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    const search = searchTerm.toLowerCase();
    return (
      (record.surname || '').toLowerCase().includes(search) ||
      (record.forename || '').toLowerCase().includes(search) ||
      (record.pay_role_number || '').toLowerCase().includes(search) ||
      (record.department || '').toLowerCase().includes(search) ||
      (record.base_location || '').toLowerCase().includes(search)
    );
  });

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">ID Card Request Form</h2>
          </div>

          {notice && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 text-sm">
              <i className="ri-checkbox-circle-line"></i>
              {notice}
            </div>
          )}
          {formError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
              <i className="ri-error-warning-line"></i>
              {formError}
            </div>
          )}

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> Fields marked with <span className="text-red-600 font-bold">*</span> are required
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="New/Replacement" required>
              <select name="new_replacement" required value={formData.new_replacement} onChange={(e) => set('new_replacement', e.target.value)} className={`${inputClass} bg-yellow-50 pr-8`}>
                <option value="">Select...</option>
                <option value="New">New</option>
                <option value="Replacement">Replacement</option>
              </select>
            </Field>

            <Field label="Pay Role Number">
              <input name="pay_role_number" value={formData.pay_role_number} onChange={(e) => set('pay_role_number', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Badge Type" required>
              <input list="badge_type_list" name="badge_type" required placeholder="Type to search or select..." value={formData.badge_type} onChange={(e) => set('badge_type', e.target.value)} className={`${inputClass} bg-yellow-50`} />
              <datalist id="badge_type_list">
                {['Standard', 'NHS', 'HCL', 'Herts At Home', 'HCPA', 'Birkin', 'SCP', 'Foster Carer', 'H.F.R.S', 'Highways', 'AMHP', 'Councillor', 'Domiciliary', 'Contractor', 'Shared Care', 'Appropriate Adult', 'Right of Way Staff Card', 'Trading Standards Staff Card', 'Samsic Staff Card', 'Music Standard Staff Card', 'Music tutor', 'Jacobs Staff Card', 'HFL Staff Card'].map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>

            <Field label="Surname" required>
              <input name="surname" required value={formData.surname} onChange={(e) => set('surname', e.target.value)} className={`${inputClass} bg-yellow-50`} />
            </Field>

            <Field label="Forename" required>
              <input name="forename" required value={formData.forename} onChange={(e) => set('forename', e.target.value)} className={`${inputClass} bg-yellow-50`} />
            </Field>

            <Field label="Department">
              <select name="department" value={formData.department} onChange={(e) => set('department', e.target.value)} className={`${inputClass} pr-8`}>
                <option value="">Select...</option>
                {['ACS', 'CS', 'FM', 'Growth & Environment', 'Resources', 'HCL', 'HCPA', 'Herts At Home', 'Community Protection', 'Public Health', 'Birkin', 'Fire and Rescue', 'HES'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            <Field label="Expiry Date">
              <input type="date" name="expiry_date" value={formData.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Manager">
              <input name="manager" value={formData.manager} onChange={(e) => set('manager', e.target.value)} className={inputClass} />
            </Field>

            <Field label="Access Card">
              <select name="access_card" value={formData.access_card} onChange={(e) => set('access_card', e.target.value)} className={`${inputClass} pr-8`}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>

            <Field label="Location" required>
              <select name="base_location" required value={formData.base_location} onChange={(e) => set('base_location', e.target.value)} className={`${inputClass} bg-yellow-50 pr-8`}>
                <option value="">Select...</option>
                {['County Hall', 'Farnham', 'Apsley', "Mundell's", 'Libraries', 'Music Offices', 'Fire Station', 'Posted Out'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>

            <Field label="Post Code" required>
              <input name="base_post_code" required value={formData.base_post_code} onChange={(e) => set('base_post_code', e.target.value)} className={`${inputClass} bg-yellow-50`} />
            </Field>

            <Field label="Previous Last Name">
              <input name="previous_last_name" value={formData.previous_last_name} onChange={(e) => set('previous_last_name', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Position">
                <input name="position" value={formData.position} onChange={(e) => set('position', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Unit">
                <input name="unit" value={formData.unit} onChange={(e) => set('unit', e.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Fire & Rescue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Station Address</label>
                <select name="address" value={formData.address} onChange={(e) => set('address', e.target.value)} className={`${inputClass} pr-8`}>
                  <option value="">Select...</option>
                  {['Berkhamsted', "Bishop's Stortford", 'Borehamwood', 'Bovingdon', 'Cheshunt', 'Chorleywood', 'Garston', 'Harpenden', 'Hatfield', 'Hemel Hempstead', 'Hertford', 'Hitchin', 'Hoddesdon', 'Kings Langley', 'Letchworth', 'Potters Bar', 'Radlett', 'Redbourn', 'Rickmansworth', 'Royston', 'St Albans', 'Sawbridgeworth', 'Stevenage (Old Town)', 'Stevenage (Poplars)', 'Tring', 'Waltham Cross', 'Ware', 'Watford', 'Welwyn Garden City', 'Other'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <Field label="UER Number">
                <input name="uer_number" autoComplete="off" value={formData.uer_number} onChange={(e) => set('uer_number', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Type of Badge">
                <select name="powers" value={formData.powers} onChange={(e) => set('powers', e.target.value)} className={`${inputClass} pr-8`}>
                  <option value="">Select...</option>
                  <option value="Officer">Officer</option>
                  <option value="Staff">Staff</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Date Received" required>
                <input type="date" name="date_received" required value={formData.date_received} onChange={(e) => set('date_received', e.target.value)} className={`${inputClass} bg-yellow-50`} />
              </Field>
              <Field label="Date Posted" required>
                <input type="date" name="date_posted" required value={formData.date_posted} onChange={(e) => set('date_posted', e.target.value)} className={`${inputClass} bg-yellow-50`} />
              </Field>
              <Field label="Badge/ID Complete" required>
                <select name="badge_id_complete" required value={formData.badge_id_complete} onChange={(e) => set('badge_id_complete', e.target.value)} className={`${inputClass} bg-yellow-50 pr-8`}>
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-save-line text-lg"></i>
              </div>
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Submitted Records</h2>
            <div className="flex gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowArchive(true)}
                  disabled={records.length === 0}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-archive-line text-lg"></i>
                  </div>
                  Archive All
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={records.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-file-excel-line text-lg"></i>
                </div>
                Export to Excel
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-search-line text-gray-400 text-lg"></i>
              </div>
              <input
                type="text"
                placeholder="Search by name, payroll number, department, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loadError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
              <i className="ri-error-warning-line"></i>
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-8 h-8 mx-auto flex items-center justify-center">
                <i className="ri-loader-4-line text-3xl animate-spin"></i>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {records.length === 0
                ? 'No records submitted yet. Fill out the form above to add records.'
                : 'No records match your search criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Badge Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{record.reference_number || `IDC-${record.id}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.forename} {record.surname}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.badge_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.department || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.base_location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.date_received}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.badge_id_complete === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {record.badge_id_complete === 'Yes' ? 'Complete' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowArchive(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <i className="ri-alert-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Archive all ID card records?</h3>
            <p className="text-sm text-gray-500 mt-1">
              This will archive {records.length} record{records.length === 1 ? '' : 's'}. Records are hidden but retained for audit. This cannot be undone.
            </p>
            <p className="text-sm text-gray-500 mt-2">Type <span className="font-semibold">ARCHIVE</span> to confirm.</p>
            <input
              type="text"
              value={archiveText}
              onChange={(e) => setArchiveText(e.target.value)}
              placeholder="ARCHIVE"
              className="w-full mt-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {formError && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                <i className="ri-error-warning-line"></i>
                {formError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowArchive(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium whitespace-nowrap cursor-pointer">
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                disabled={archiveText !== 'ARCHIVE' || archiving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {archiving ? 'Archiving...' : 'Archive All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}
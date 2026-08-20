'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function IDCardsPage() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    new_replacement: '',
    pay_role_number: '',
    badge_type: '',
    surname: '',
    forename: '',
    department: '',
    expiry_date: '',
    manager: '',
    access_card: '',
    base_location: '',
    base_post_code: '',
    previous_last_name: '',
    position: '',
    unit: '',
    address: '',
    uer_number: '',
    powers: '',
    date_received: '',
    date_posted: '',
    badge_id_complete: ''
  });

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('id_card_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('id_card_requests').insert({ ...formData });
    fetchRecords();
    setFormData({
      new_replacement: '',
      pay_role_number: '',
      badge_type: '',
      surname: '',
      forename: '',
      department: '',
      expiry_date: '',
      manager: '',
      access_card: '',
      base_location: '',
      base_post_code: '',
      previous_last_name: '',
      position: '',
      unit: '',
      address: '',
      uer_number: '',
      powers: '',
      date_received: '',
      date_posted: '',
      badge_id_complete: ''
    });
  };

  const handleExport = () => {
    if (records.length === 0) return;
    
    const headers = ['New/Replacement', 'Pay Role Number', 'Badge Type', 'Surname', 'Forename', 'Department', 'Expiry Date', 'Manager', 'Access Card', 'Location', 'Post Code', 'Previous Last Name', 'Position', 'Unit', 'Station Address', 'UER Number', 'Type of Badge', 'Date Received', 'Date Posted', 'Badge/ID Complete'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.new_replacement,
        record.pay_role_number,
        record.badge_type,
        record.surname,
        record.forename,
        record.department,
        record.expiry_date,
        record.manager,
        record.access_card,
        record.base_location,
        record.base_post_code,
        record.previous_last_name,
        record.position,
        record.unit,
        record.address,
        record.uer_number,
        record.powers,
        record.date_received,
        record.date_posted,
        record.badge_id_complete
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `id-card-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all records? This action cannot be undone.')) {
      await supabase.from('id_card_requests').delete().neq('id', 0);
      fetchRecords();
    }
  };

  const filteredRecords = records.filter(record => {
    const search = searchTerm.toLowerCase();
    return (
      record.surname?.toLowerCase().includes(search) ||
      record.forename?.toLowerCase().includes(search) ||
      record.pay_role_number?.toLowerCase().includes(search) ||
      record.department?.toLowerCase().includes(search) ||
      record.address?.toLowerCase().includes(search) ||
      record.uer_number?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">ID Card Request Form</h2>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> Fields marked with <span className="text-red-600 font-bold">*</span> are required
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="new_replacement" className="block text-sm font-medium text-gray-700 mb-1">
                New/Replacement <span className="text-red-600">*</span>
              </label>
              <select
                id="new_replacement"
                name="new_replacement"
                required
                value={formData.new_replacement}
                onChange={(e) => setFormData({...formData, new_replacement: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50 pr-8"
              >
                <option value="">Select...</option>
                <option value="New">New</option>
                <option value="Replacement">Replacement</option>
              </select>
            </div>

            <div>
              <label htmlFor="pay_role_number" className="block text-sm font-medium text-gray-700 mb-1">
                Pay Role Number
              </label>
              <input
                id="pay_role_number"
                name="pay_role_number"
                value={formData.pay_role_number}
                onChange={(e) => setFormData({...formData, pay_role_number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="badge_type" className="block text-sm font-medium text-gray-700 mb-1">
                Badge Type <span className="text-red-600">*</span>
              </label>
              <input
                list="badge_type_list"
                id="badge_type"
                name="badge_type"
                required
                placeholder="Type to search or select..."
                value={formData.badge_type}
                onChange={(e) => setFormData({...formData, badge_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
              />
              <datalist id="badge_type_list">
                <option value="Standard" />
                <option value="NHS" />
                <option value="HCL" />
                <option value="Herts At Home" />
                <option value="HCPA" />
                <option value="Birkin" />
                <option value="SCP" />
                <option value="Foster Carer" />
                <option value="H.F.R.S" />
                <option value="Highways" />
                <option value="AMHP" />
                <option value="Councillor" />
                <option value="Domiciliary" />
                <option value="Contractor" />
                <option value="Shared Care" />
                <option value="Appropriate Adult" />
                <option value="Right of Way Staff Card" />
                <option value="Trading Standards Staff Card" />
                <option value="Samsic Staff Card" />
                <option value="Music Standard Staff Card" />
                <option value="Music tutor" />
                <option value="Jacobs Staff Card" />
                <option value="HFL Staff Card" />
              </datalist>
            </div>

            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">
                Surname <span className="text-red-600">*</span>
              </label>
              <input
                id="surname"
                name="surname"
                required
                value={formData.surname}
                onChange={(e) => setFormData({...formData, surname: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
              />
            </div>

            <div>
              <label htmlFor="forename" className="block text-sm font-medium text-gray-700 mb-1">
                Forename <span className="text-red-600">*</span>
              </label>
              <input
                id="forename"
                name="forename"
                required
                value={formData.forename}
                onChange={(e) => setFormData({...formData, forename: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              >
                <option value="">Select...</option>
                <option value="ACS">ACS</option>
                <option value="CS">CS</option>
                <option value="FM">FM</option>
                <option value="Growth & Environment">Growth & Environment</option>
                <option value="Resources">Resources</option>
                <option value="HCL">HCL</option>
                <option value="HCPA">HCPA</option>
                <option value="Herts At Home">Herts At Home</option>
                <option value="Community Protection">Community Protection</option>
                <option value="Public Health">Public Health</option>
                <option value="Birkin">Birkin</option>
                <option value="Fire and Rescue">Fire and Rescue</option>
                <option value="HES">HES</option>
              </select>
            </div>

            <div>
              <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiry_date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
                Manager
              </label>
              <input
                id="manager"
                name="manager"
                value={formData.manager}
                onChange={(e) => setFormData({...formData, manager: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="access_card" className="block text-sm font-medium text-gray-700 mb-1">
                Access Card
              </label>
              <select
                id="access_card"
                name="access_card"
                value={formData.access_card}
                onChange={(e) => setFormData({...formData, access_card: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label htmlFor="base_location" className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-600">*</span>
              </label>
              <select
                id="base_location"
                name="base_location"
                required
                value={formData.base_location}
                onChange={(e) => setFormData({...formData, base_location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50 pr-8"
              >
                <option value="">Select...</option>
                <option value="County Hall">County Hall</option>
                <option value="Farnham">Farnham</option>
                <option value="Apsley">Apsley</option>
                <option value="Mundell's">Mundell's</option>
                <option value="Libraries">Libraries</option>
                <option value="Music Offices">Music Offices</option>
                <option value="Fire Station">Fire Station</option>
                <option value="Posted Out">Posted Out</option>
              </select>
            </div>

            <div>
              <label htmlFor="base_post_code" className="block text-sm font-medium text-gray-700 mb-1">
                Post Code <span className="text-red-600">*</span>
              </label>
              <input
                id="base_post_code"
                name="base_post_code"
                required
                value={formData.base_post_code}
                onChange={(e) => setFormData({...formData, base_post_code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
              />
            </div>

            <div>
              <label htmlFor="previous_last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Previous Last Name
              </label>
              <input
                id="previous_last_name"
                name="previous_last_name"
                value={formData.previous_last_name}
                onChange={(e) => setFormData({...formData, previous_last_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Fire & Rescue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Station Address
                </label>
                <select
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                >
                  <option value="">Select...</option>
                  <option value="Berkhamsted">Berkhamsted</option>
                  <option value="Bishop's Stortford">Bishop's Stortford</option>
                  <option value="Borehamwood">Borehamwood</option>
                  <option value="Bovingdon">Bovingdon</option>
                  <option value="Cheshunt">Cheshunt</option>
                  <option value="Chorleywood">Chorleywood</option>
                  <option value="Garston">Garston</option>
                  <option value="Harpenden">Harpenden</option>
                  <option value="Hatfield">Hatfield</option>
                  <option value="Hemel Hempstead">Hemel Hempstead</option>
                  <option value="Hertford">Hertford</option>
                  <option value="Hitchin">Hitchin</option>
                  <option value="Hoddesdon">Hoddesdon</option>
                  <option value="Kings Langley">Kings Langley</option>
                  <option value="Letchworth">Letchworth</option>
                  <option value="Potters Bar">Potters Bar</option>
                  <option value="Radlett">Radlett</option>
                  <option value="Redbourn">Redbourn</option>
                  <option value="Rickmansworth">Rickmansworth</option>
                  <option value="Royston">Royston</option>
                  <option value="St Albans">St Albans</option>
                  <option value="Sawbridgeworth">Sawbridgeworth</option>
                  <option value="Stevenage (Old Town)">Stevenage (Old Town)</option>
                  <option value="Stevenage (Poplars)">Stevenage (Poplars)</option>
                  <option value="Tring">Tring</option>
                  <option value="Waltham Cross">Waltham Cross</option>
                  <option value="Ware">Ware</option>
                  <option value="Watford">Watford</option>
                  <option value="Welwyn Garden City">Welwyn Garden City</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="uer_number" className="block text-sm font-medium text-gray-700 mb-1">
                  UER Number
                </label>
                <input
                  id="uer_number"
                  name="uer_number"
                  autoComplete="off"
                  value={formData.uer_number}
                  onChange={(e) => setFormData({...formData, uer_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="powers" className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Badge
                </label>
                <select
                  id="powers"
                  name="powers"
                  value={formData.powers}
                  onChange={(e) => setFormData({...formData, powers: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                >
                  <option value="">Select...</option>
                  <option value="Officer">Officer</option>
                  <option value="Staff">Staff</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date_received" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Received <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  id="date_received"
                  name="date_received"
                  required
                  value={formData.date_received}
                  onChange={(e) => setFormData({...formData, date_received: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                />
              </div>

              <div>
                <label htmlFor="date_posted" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Posted <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  id="date_posted"
                  name="date_posted"
                  required
                  value={formData.date_posted}
                  onChange={(e) => setFormData({...formData, date_posted: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                />
              </div>

              <div>
                <label htmlFor="badge_id_complete" className="block text-sm font-medium text-gray-700 mb-1">
                  Badge/ID Complete <span className="text-red-600">*</span>
                </label>
                <select
                  id="badge_id_complete"
                  name="badge_id_complete"
                  required
                  value={formData.badge_id_complete}
                  onChange={(e) => setFormData({...formData, badge_id_complete: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50 pr-8"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-save-line text-lg"></i>
              </div>
              Submit
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Submitted Records</h2>
            <div className="flex gap-3">
              <button
                onClick={handleClearAll}
                disabled={records.length === 0}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-delete-bin-line text-lg"></i>
                </div>
                Clear All Records
              </button>
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
                placeholder="Search by name, payroll number, department, station, or UER number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {filteredRecords.length === 0 ? (
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
                      <td className="px-4 py-3 text-sm text-gray-900">{record.forename} {record.surname}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.badge_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.department || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.base_location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.date_received}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.badge_id_complete === 'Yes' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
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
    </div>
  );
}

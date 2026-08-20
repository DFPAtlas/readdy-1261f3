'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  interface ReportFile {
    id: number;
    name: string;
    size: string;
    date: string;
    type: string;
    status: string;
  }

  const [uploadedFiles, setUploadedFiles] = useState<ReportFile[]>([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('report_files')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    setUploadedFiles(data.map((f: any) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      date: f.report_date,
      type: f.type,
      status: f.status,
    })));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = async (id: number) => {
    await supabase.from('report_files').delete().eq('id', id);
    fetchFiles();
  };

  const handleUpload = async () => {
    if (!uploadFile && !uploadName.trim()) return;
    const name = uploadFile ? uploadFile.name : uploadName.trim();
    const size = uploadFile ? formatSize(uploadFile.size) : '—';
    const type = uploadType || 'General';
    await supabase.from('report_files').insert({
      name,
      size,
      type,
      status: 'Pending',
      report_date: new Date().toISOString().split('T')[0],
    });
    setUploadName('');
    setUploadType('');
    setUploadFile(null);
    setShowUploadModal(false);
    fetchFiles();
  };

  const totalReports = uploadedFiles.length;
  const approvedCount = uploadedFiles.filter((f) => f.status === 'Approved').length;
  const pendingCount = uploadedFiles.filter((f) => f.status === 'Pending' || f.status === 'Under Review').length;
  const thisMonthCount = uploadedFiles.filter((f) => {
    const now = new Date();
    return f.date && f.date.startsWith(now.toISOString().slice(0, 7));
  }).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Under Review':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return 'ri-file-pdf-line';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'ri-file-excel-line';
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'ri-file-word-line';
    return 'ri-file-line';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports Upload</h1>
              <p className="text-gray-600">Manage and upload your reports and documents</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-upload-2-line text-xl"></i>
              </div>
              Upload Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                  <i className="ri-file-list-3-line text-blue-600 text-xl"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{totalReports}</p>
              <p className="text-sm text-gray-600">Total Reports</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{approvedCount}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 rounded-lg">
                  <i className="ri-time-line text-yellow-600 text-xl"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                  <i className="ri-calendar-line text-purple-600 text-xl"></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{thisMonthCount}</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uploadedFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                            <i className={`${getFileIcon(file.name)} text-gray-600 text-lg`}></i>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                          {file.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 cursor-pointer">
                            <i className="ri-download-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Report</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                <input
                  type="text"
                  placeholder="Enter report name (or select a file below)"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="">Select type</option>
                  <option>Monthly Report</option>
                  <option>Safety Report</option>
                  <option>Financial Report</option>
                  <option>Training Report</option>
                  <option>Maintenance Report</option>
                  <option>Incident Report</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100 cursor-pointer"
                />
                {uploadFile && (
                  <p className="text-xs text-gray-500 mt-3">
                    {uploadFile.name} ({formatSize(uploadFile.size)})
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowUploadModal(false); setUploadName(''); setUploadType(''); setUploadFile(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

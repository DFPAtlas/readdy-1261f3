'use client';

import Header from '@/components/Header';
import { useCallback, useEffect, useState } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import { logAudit } from '@/lib/profile';
import {
  ReportFile,
  fetchReportFiles,
  uploadReportFile,
  downloadReportFile,
  archiveReportFile,
  restoreReportFile,
  deleteReportFile,
  formatBytes,
  rpcError,
} from '@/lib/report-files';
import UploadModal from './components/UploadModal';
import ConfirmModal, { ConfirmAction } from './components/ConfirmModal';

function fileIcon(file: ReportFile): string {
  const name = (file.original_filename || file.name || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'ri-file-pdf-line';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'ri-file-excel-line';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'ri-file-word-line';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) return 'ri-image-line';
  if (name.endsWith('.zip')) return 'ri-file-zip-line';
  return 'ri-file-line';
}

interface ConfirmTarget {
  action: ConfirmAction;
  file: ReportFile;
}

export default function ReportsPage() {
  const { role } = useAuth();
  const isManager = roleRank(role) >= 3;
  const isAdmin = roleRank(role) >= 4;

  const [files, setFiles] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setFiles(await fetchReportFiles());
    } catch {
      setError('Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File, reportType: string) => {
    setUploading(true);
    setUploadError('');
    try {
      const ref = await uploadReportFile(file, reportType);
      setShowUpload(false);
      setNotice(`Report uploaded${ref ? ` (${ref})` : ''}.`);
      setTimeout(() => setNotice(''), 4000);
      await load();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : rpcError(e));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: ReportFile) => {
    setDownloadingId(file.id);
    try {
      await downloadReportFile(file);
      await logAudit('download', 'report_file', String(file.id), {}, undefined);
    } catch (e) {
      setNotice('');
      setError(e instanceof Error ? e.message : 'Could not download the file.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { action, file } = confirm;
    setBusy(true);
    setError('');
    try {
      if (action === 'archive') {
        await archiveReportFile(file.id);
        setNotice('Report archived.');
      } else if (action === 'restore') {
        await restoreReportFile(file.id);
        setNotice('Report restored.');
      } else {
        const { partial } = await deleteReportFile(file);
        setNotice(
          partial
            ? 'Report record deleted, but the stored file could not be removed.'
            : 'Report deleted permanently.',
        );
      }
      setConfirm(null);
      setTimeout(() => setNotice(''), 4000);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : rpcError(e));
    } finally {
      setBusy(false);
    }
  };

  const total = files.length;
  const activeCount = files.filter((f) => f.status !== 'archived').length;
  const archivedCount = files.filter((f) => f.status === 'archived').length;
  const thisMonth = files.filter((f) => {
    const now = new Date();
    const prefix = now.toISOString().slice(0, 7);
    return (f.report_date || '').startsWith(prefix);
  }).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Reports</h1>
              <p className="text-slate-500">Upload, download and manage your reports and documents</p>
            </div>
            <button
              onClick={() => {
                setUploadError('');
                setShowUpload(true);
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-upload-2-line text-lg"></i>
              </div>
              Upload Report
            </button>
          </div>

          {notice && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 text-sm">
              <i className="ri-checkbox-circle-line"></i>
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Total Reports', value: total, icon: 'ri-file-list-3-line', color: 'bg-blue-100 text-blue-600' },
              { label: 'Active', value: activeCount, icon: 'ri-check-line', color: 'bg-green-100 text-green-600' },
              { label: 'Archived', value: archivedCount, icon: 'ri-archive-line', color: 'bg-purple-100 text-purple-600' },
              { label: 'This Month', value: thisMonth, icon: 'ri-calendar-line', color: 'bg-amber-100 text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg mb-3 ${s.color}`}>
                  <i className={`${s.icon} text-xl`}></i>
                </div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Documents</h2>
              <span className="text-xs text-slate-400">{files.length} file{files.length === 1 ? '' : 's'}</span>
            </div>

            {loading ? (
              <div className="px-6 py-20 text-center text-slate-400">
                <div className="w-8 h-8 mx-auto flex items-center justify-center">
                  <i className="ri-loader-4-line text-3xl animate-spin"></i>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="w-14 h-14 mx-auto flex items-center justify-center bg-slate-100 rounded-full mb-4">
                  <i className="ri-folder-open-line text-2xl text-slate-400"></i>
                </div>
                <p className="text-slate-600 font-medium">No reports yet</p>
                <p className="text-sm text-slate-400 mt-1">Upload your first report to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">File</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {files.map((file) => {
                      const archived = file.status === 'archived';
                      return (
                        <tr key={file.id} className={`hover:bg-slate-50 ${archived ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg flex-shrink-0">
                                <i className={`${fileIcon(file)} text-slate-600 text-lg`}></i>
                              </div>
                              <span className="text-sm font-medium text-slate-800 truncate max-w-[260px]">
                                {file.original_filename || file.name || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{file.type || 'General'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{formatBytes(file.size_bytes)}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap font-mono text-xs">
                            {file.reference_number || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {file.report_date || (file.created_at ? file.created_at.slice(0, 10) : '—')}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                archived ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {archived ? 'Archived' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDownload(file)}
                                disabled={downloadingId === file.id}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer disabled:opacity-50"
                                title="Download"
                              >
                                <i className={downloadingId === file.id ? 'ri-loader-4-line animate-spin text-lg' : 'ri-download-line text-lg'}></i>
                              </button>
                              {isManager && (
                                <button
                                  onClick={() => setConfirm({ action: archived ? 'restore' : 'archive', file })}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                  title={archived ? 'Restore' : 'Archive'}
                                >
                                  <i className={archived ? 'ri-arrow-go-back-line text-lg' : 'ri-archive-line text-lg'}></i>
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => setConfirm({ action: 'delete', file })}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="Delete permanently (admin only)"
                                >
                                  <i className="ri-delete-bin-line text-lg"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <UploadModal
        open={showUpload}
        uploading={uploading}
        error={uploadError}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      {confirm && (
        <ConfirmModal
          action={confirm.action}
          fileName={confirm.file.original_filename || confirm.file.name || 'report'}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
        />
      )}
    </div>
  );
}
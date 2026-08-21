'use client';

import { useRef, useState } from 'react';
import { REPORT_TYPES, validateFile, formatBytes, ALLOWED_EXTENSIONS } from '@/lib/report-files';

export default function UploadModal({
  open,
  uploading,
  error,
  onClose,
  onUpload,
}: {
  open: boolean;
  uploading: boolean;
  error: string;
  onClose: () => void;
  onUpload: (file: File, reportType: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setReportType('');
    setTypeOpen(false);
    setLocalError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const pickFile = (f: File | null) => {
    setFile(f);
    setLocalError(validateFile(f) ?? '');
  };

  const submit = () => {
    const err = validateFile(file);
    if (err) {
      setLocalError(err);
      return;
    }
    if (!reportType) {
      setLocalError('Select a report type.');
      return;
    }
    if (file) onUpload(file, reportType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={close}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Upload Report</h3>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
            <div className="relative">
              <button
                onClick={() => setTypeOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 hover:border-slate-400 cursor-pointer"
              >
                <span className={reportType ? '' : 'text-slate-400'}>
                  {reportType || 'Select type'}
                </span>
                <i className="ri-arrow-down-s-line text-slate-500"></i>
              </button>
              {typeOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto py-1">
                  {REPORT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setReportType(t);
                        setTypeOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0] || null);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
              <div className="w-12 h-12 mx-auto flex items-center justify-center bg-blue-100 rounded-full mb-3">
                <i className="ri-upload-cloud-2-line text-blue-600 text-2xl"></i>
              </div>
              {file ? (
                <>
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatBytes(file.size)}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    Drag and drop a file here, or <span className="text-blue-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Max 25 MB — PDF, Word, Excel, images, ZIP and more</p>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Allowed: {ALLOWED_EXTENSIONS.join(', ')}
            </p>
          </div>
        </div>

        {(localError || error) && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
            <i className="ri-error-warning-line"></i>
            {localError || error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={close}
            disabled={uploading}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={uploading || !file}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
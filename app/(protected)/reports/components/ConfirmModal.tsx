'use client';

export type ConfirmAction = 'archive' | 'restore' | 'delete';

export default function ConfirmModal({
  action,
  fileName,
  busy,
  onCancel,
  onConfirm,
}: {
  action: ConfirmAction;
  fileName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const config = {
    archive: {
      icon: 'ri-archive-line',
      color: 'bg-amber-100 text-amber-600',
      title: 'Archive this file?',
      body: 'It will be hidden from the active list but kept for audit and recovery.',
      confirm: 'Archive',
      btn: 'bg-amber-600 hover:bg-amber-700',
    },
    restore: {
      icon: 'ri-arrow-go-back-line',
      color: 'bg-blue-100 text-blue-600',
      title: 'Restore this file?',
      body: 'It will return to the active list.',
      confirm: 'Restore',
      btn: 'bg-blue-600 hover:bg-blue-700',
    },
    delete: {
      icon: 'ri-alert-line',
      color: 'bg-red-100 text-red-600',
      title: 'Delete this file permanently?',
      body: 'The record and its stored file will be removed. This cannot be undone.',
      confirm: 'Delete',
      btn: 'bg-red-600 hover:bg-red-700',
    },
  }[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${config.color}`}>
          <i className={`${config.icon} text-2xl`}></i>
        </div>
        <h3 className="text-lg font-bold text-slate-800">{config.title}</h3>
        <p className="text-sm text-slate-500 mt-1">
          <span className="font-medium text-slate-700">{fileName}</span>
        </p>
        <p className="text-sm text-slate-500 mt-1">{config.body}</p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50 flex items-center gap-2 ${config.btn}`}
          >
            {busy && <i className="ri-loader-4-line animate-spin"></i>}
            {config.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
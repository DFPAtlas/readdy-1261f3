'use client';

import { useState } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import { setRecordStatus, deleteRecord, STATUSES, rpcError } from '@/lib/forms';

const STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-700',
  archived: 'bg-purple-100 text-purple-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function RecordActions({
  table,
  id,
  status,
  canEdit,
  onEdit,
  onChanged,
}: {
  table: string;
  id: number;
  status: string;
  canEdit: boolean;
  onEdit?: () => void;
  onChanged: () => void;
}) {
  const { role } = useAuth();
  const isManager = roleRank(role) >= 3;
  const isAdmin = roleRank(role) >= 4;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState('');

  const applyStatus = async (next: string) => {
    setOpen(false);
    setBusy(true);
    setErr('');
    try {
      await setRecordStatus(table, id, next);
      onChanged();
    } catch (e) {
      setErr(rpcError(e));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setConfirmDelete(false);
    setBusy(true);
    setErr('');
    try {
      await deleteRecord(table, id);
      onChanged();
    } catch (e) {
      setErr(rpcError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <div className="flex items-center gap-2">
        {canEdit && onEdit && (
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 cursor-pointer"
            title="Edit"
          >
            <i className="ri-edit-line text-lg"></i>
          </button>
        )}
        {isManager && (
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              disabled={busy}
              className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <i className="ri-flag-line"></i> Status
            </button>
            {open && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => applyStatus(s)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize cursor-pointer whitespace-nowrap"
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {isAdmin && (
          <div className="relative">
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={doDelete}
                  disabled={busy}
                  className="px-2 py-1.5 bg-red-600 text-white rounded text-xs font-medium cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1.5 border border-gray-200 text-gray-600 rounded text-xs cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
                title="Delete (admin only)"
              >
                <i className="ri-delete-bin-line text-lg"></i>
              </button>
            )}
          </div>
        )}
      </div>
      {err && (
        <p className="text-xs text-red-600 max-w-[180px] text-right">{err}</p>
      )}
    </div>
  );
}
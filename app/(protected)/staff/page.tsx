'use client';

import Header from '@/components/Header';
import { useCallback, useEffect, useState } from 'react';
import { useAuth, roleRank } from '@/lib/auth-context';
import {
  Profile,
  Role,
  ProfileFields,
  getMyOrgs,
  getMyOrgRole,
  fetchOrgProfiles,
  listOrgMembers,
  updateStaffProfile,
  setProfileStatus,
  setMemberRole,
  removeMember,
  bootstrapOrg,
  logAudit,
  checkDuplicate,
} from '@/lib/profile';
import ProfileAvatar from '@/components/ProfileAvatar';
import StaffFormModal from './components/StaffFormModal';

const ROLE_LABELS: Record<Role, string> = {
  staff: 'Staff',
  supervisor: 'Supervisor',
  manager: 'Manager',
  administrator: 'Administrator',
};

interface ConfirmTarget {
  profile: Profile;
  action: 'deactivate' | 'activate' | 'remove';
}

export default function StaffPage() {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgName, setOrgName] = useState('');
  const [bootstrapping, setBootstrapping] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const orgs = await getMyOrgs();
      if (!orgs.length) {
        setOrgId(null);
        setMyRole(null);
        setProfiles([]);
        setMemberRoles({});
        return;
      }
      const oid = orgs[0];
      setOrgId(oid);
      const [role, profs, mems] = await Promise.all([
        getMyOrgRole(oid),
        fetchOrgProfiles(oid),
        listOrgMembers(oid),
      ]);
      setMyRole(role);
      setProfiles(profs);
      const map: Record<string, Role> = {};
      mems.forEach((m) => {
        map[m.user_id] = m.role;
      });
      setMemberRoles(map);
    } catch {
      setError('Could not load staff.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = roleRank(myRole) >= roleRank('administrator');
  const canEdit = roleRank(myRole) >= roleRank('manager');

  const handleBootstrap = async () => {
    if (!orgName.trim()) {
      setError('Enter an organisation name.');
      return;
    }
    setBootstrapping(true);
    setError('');
    try {
      await bootstrapOrg(orgName.trim());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set up your organisation.');
    } finally {
      setBootstrapping(false);
    }
  };

  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setSaveError('');
    setShowModal(true);
  };

  const handleSave = async (fields: ProfileFields, role: Role) => {
    if (!editing || !orgId) return;
    setSaving(true);
    setSaveError('');
    try {
      const dupEmail = await checkDuplicate(orgId, 'work_email', fields.work_email, editing.user_id);
      if (dupEmail) throw new Error('Another staff member already uses this work email.');
      const dupRef = await checkDuplicate(orgId, 'employee_number', fields.employee_number, editing.user_id);
      if (dupRef) throw new Error('Another staff member already uses this employee number.');

      await updateStaffProfile(editing.id, fields);

      const currentRole = memberRoles[editing.user_id] ?? 'staff';
      if (isAdmin && role !== currentRole) {
        await setMemberRole(orgId, editing.user_id, role);
        await logAudit('role_change', 'member', editing.user_id, { from: currentRole, to: role }, orgId);
      }

      setShowModal(false);
      setEditing(null);
      setNotice('Staff member updated.');
      setTimeout(() => setNotice(''), 2500);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmTarget || !orgId) return;
    const { profile, action } = confirmTarget;
    const newStatus = action === 'deactivate' ? 'inactive' : 'active';
    try {
      await setProfileStatus(profile.id, newStatus);
      await logAudit(
        action === 'deactivate' ? 'account_deactivated' : 'account_activated',
        'profile',
        profile.id,
        { status: newStatus },
        orgId,
      );
      setNotice(newStatus === 'inactive' ? 'Account deactivated.' : 'Account activated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the account.');
    } finally {
      setConfirmTarget(null);
      setTimeout(() => setNotice(''), 2500);
      await load();
    }
  };

  const handleRemove = async () => {
    if (!confirmTarget || !orgId) return;
    const { profile } = confirmTarget;
    try {
      await removeMember(orgId, profile.user_id);
      await logAudit('member_removed', 'member', profile.user_id, {}, orgId);
      setNotice('Member removed from the organisation.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the member.');
    } finally {
      setConfirmTarget(null);
      setTimeout(() => setNotice(''), 2500);
      await load();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center">
              <i className="ri-team-line text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Staff Directory</h1>
              <p className="text-slate-600 mt-1">
                {myRole ? `Signed in as ${ROLE_LABELS[myRole]}` : 'Manage your team'}
              </p>
            </div>
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

          {!loading && !orgId ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
              <div className="w-14 h-14 mx-auto flex items-center justify-center bg-slate-100 rounded-full mb-4">
                <i className="ri-building-line text-2xl text-slate-400"></i>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Set up your organisation</h2>
              <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                You are the first person here. Create your organisation to become its administrator.
              </p>
              <div className="max-w-sm mx-auto flex gap-2">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Organisation name"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleBootstrap}
                  disabled={bootstrapping}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  {bootstrapping ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div className="col-span-3">Staff Member</div>
                <div className="col-span-2">Job Title</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-1">Shift</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {loading ? (
                <div className="px-5 py-16 text-center text-slate-400">
                  <div className="w-8 h-8 mx-auto flex items-center justify-center">
                    <i className="ri-loader-4-line text-3xl animate-spin"></i>
                  </div>
                </div>
              ) : profiles.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="w-12 h-12 mx-auto flex items-center justify-center bg-slate-100 rounded-full mb-3">
                    <i className="ri-user-line text-2xl text-slate-400"></i>
                  </div>
                  <p className="text-slate-500">No staff profiles yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ask team members to complete their profile from the Profile page.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {profiles.map((p) => {
                    const role = memberRoles[p.user_id] ?? 'staff';
                    return (
                      <div
                        key={p.id}
                        className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <ProfileAvatar path={p.avatar_path} name={p.full_name} size="md" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{p.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-slate-500 truncate">{p.work_email || '—'}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-sm text-slate-600 truncate">{p.job_title || '—'}</div>
                        <div className="col-span-2 text-sm text-slate-600 truncate">{p.department || '—'}</div>
                        <div className="col-span-1 text-sm text-slate-600">{p.shift || '—'}</div>
                        <div className="col-span-2">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {ROLE_LABELS[role]}
                          </span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.status === 'inactive'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {p.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(p)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <i className="ri-pencil-line text-lg"></i>
                            </button>
                          )}
                          {isAdmin && p.user_id !== user?.id && (
                            <>
                              <button
                                onClick={() =>
                                  setConfirmTarget({
                                    profile: p,
                                    action: p.status === 'inactive' ? 'activate' : 'deactivate',
                                  })
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-100 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                                title={p.status === 'inactive' ? 'Activate' : 'Deactivate'}
                              >
                                <i className={p.status === 'inactive' ? 'ri-check-line text-lg' : 'ri-pause-circle-line text-lg'}></i>
                              </button>
                              <button
                                onClick={() => setConfirmTarget({ profile: p, action: 'remove' })}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                                title="Remove"
                              >
                                <i className="ri-delete-bin-line text-lg"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {orgId && (
            <p className="text-xs text-slate-400 mt-3">
              {profiles.length} staff member{profiles.length === 1 ? '' : 's'} — new members complete their own
              profile from the Profile page and are added to this directory by an administrator.
            </p>
          )}
        </div>
      </main>

      <StaffFormModal
        open={showModal}
        profile={editing}
        role={editing ? memberRoles[editing.user_id] ?? 'staff' : 'staff'}
        isAdmin={isAdmin}
        saving={saving}
        error={saveError}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmTarget(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${
                confirmTarget.action === 'remove' ? 'bg-red-100' : 'bg-amber-100'
              }`}
            >
              <i
                className={`text-2xl ${
                  confirmTarget.action === 'remove' ? 'ri-alert-line text-red-600' : 'ri-pause-circle-line text-amber-600'
                }`}
              ></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {confirmTarget.action === 'remove'
                ? `Remove ${confirmTarget.profile.full_name || 'member'}?`
                : confirmTarget.action === 'deactivate'
                  ? `Deactivate ${confirmTarget.profile.full_name || 'account'}?`
                  : `Activate ${confirmTarget.profile.full_name || 'account'}?`}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {confirmTarget.action === 'remove'
                ? 'They will lose access to this organisation immediately.'
                : confirmTarget.action === 'deactivate'
                  ? 'They will no longer be able to sign in or access operational pages.'
                  : 'They will regain access to the portal.'}
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmTarget.action === 'remove' ? handleRemove : handleToggleStatus}
                className={`px-4 py-2 text-white rounded-lg transition-colors font-semibold whitespace-nowrap cursor-pointer ${
                  confirmTarget.action === 'remove'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmTarget.action === 'deactivate'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
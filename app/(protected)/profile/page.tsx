'use client';

import Header from '@/components/Header';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  Profile,
  ProfileFields,
  toProfileFields,
  fetchMyProfile,
  saveProfile,
  uploadAvatar,
  MAX_AVATAR_BYTES,
  ALLOWED_AVATAR_TYPES,
} from '@/lib/profile';
import ProfileAvatar from '@/components/ProfileAvatar';
import ProfileEditForm from './ProfileEditForm';

const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  supervisor: 'Supervisor',
  manager: 'Manager',
  administrator: 'Administrator',
};

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyProfile(user.id)
      .then((p) => {
        setProfile(p);
        setAvatarPath(p?.avatar_path ?? null);
      })
      .catch(() => setLoadError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (fields: ProfileFields) => {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await saveProfile(user.id, profile?.id ?? null, fields, avatarPath);
      const p = await fetchMyProfile(user.id);
      setProfile(p);
      setAvatarPath(p?.avatar_path ?? null);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    if (!user) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Only JPG, PNG or WebP images are allowed.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be under 2 MB.');
      return;
    }
    setAvatarError('');
    setAvatarBusy(true);
    try {
      const path = await uploadAvatar(user.id, file);
      setAvatarPath(path);
      if (profile) {
        await supabase.from('profiles').update({ avatar_path: path }).eq('id', profile.id);
        setProfile({ ...profile, avatar_path: path });
      }
    } catch {
      setAvatarError('Could not upload the image.');
    } finally {
      setAvatarBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 flex items-center justify-center">
            <i className="ri-loader-4-line text-3xl animate-spin text-slate-400"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center">
              <i className="ri-user-settings-line text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
              <p className="text-slate-600 mt-1">Your personal details and account information</p>
            </div>
          </div>

          {loadError && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {loadError}
            </div>
          )}

          {saved && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 text-sm">
              <i className="ri-checkbox-circle-line"></i>
              Profile saved successfully.
            </div>
          )}

          {!profile && !editing ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
              <div className="w-14 h-14 mx-auto flex items-center justify-center bg-slate-100 rounded-full mb-4">
                <i className="ri-user-add-line text-2xl text-slate-400"></i>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Complete your profile</h2>
              <p className="text-sm text-slate-500 mb-5">
                Add your details so colleagues can recognise you in the staff directory.
              </p>
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap cursor-pointer"
              >
                Create Profile
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
                <div className="relative">
                  <ProfileAvatar path={avatarPath} name={profile?.full_name ?? user?.email ?? null} size="lg" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarBusy}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer shadow disabled:opacity-60"
                    title="Change photo"
                  >
                    <i className={avatarBusy ? 'ri-loader-4-line animate-spin text-sm' : 'ri-camera-line text-sm'}></i>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarFile(f);
                      e.target.value = '';
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {profile?.full_name || 'Unnamed'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {role && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {ROLE_LABELS[role] || role}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        profile?.status === 'inactive'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}
                    >
                      {profile?.status === 'inactive' ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                  {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
                </div>
              </div>

              {editing ? (
                <div className="pt-6">
                  <ProfileEditForm
                    initial={toProfileFields(profile)}
                    saving={saving}
                    error={saveError}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditing(false);
                      setSaveError('');
                    }}
                  />
                </div>
              ) : (
                <div className="pt-6">
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
                    {[
                      { label: 'Job Title', value: profile?.job_title, icon: 'ri-briefcase-line' },
                      { label: 'Department', value: profile?.department, icon: 'ri-building-line' },
                      { label: 'Work Email', value: profile?.work_email, icon: 'ri-mail-line' },
                      { label: 'Phone', value: profile?.phone, icon: 'ri-phone-line' },
                      { label: 'Employee Number', value: profile?.employee_number, icon: 'ri-id-card-line' },
                      { label: 'Shift', value: profile?.shift, icon: 'ri-sun-line' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg shrink-0">
                          <i className={`${item.icon} text-slate-600`}></i>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-slate-500">{item.label}</dt>
                          <dd className="text-sm font-medium text-slate-800 truncate">{item.value || '—'}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6">
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-edit-line text-sm"></i>
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
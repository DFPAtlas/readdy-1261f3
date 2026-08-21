'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProfileAvatar from '@/components/ProfileAvatar';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [safePathname, setSafePathname] = useState(pathname);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  useEffect(() => {
    setSafePathname(pathname);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_path')
        .eq('user_id', userId)
        .maybeSingle();
      if (!mounted) return;
      setUserName(data?.full_name ?? null);
      setAvatarPath(data?.avatar_path ?? null);
    };

    const applySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const sessionUser = data.session?.user;
      setUserEmail(sessionUser?.email ?? null);
      if (sessionUser) loadProfile(sessionUser.id);
    };
    applySession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const sessionUser = session?.user;
      setUserEmail(sessionUser?.email ?? null);
      if (sessionUser) {
        loadProfile(sessionUser.id);
      } else {
        setUserName(null);
        setAvatarPath(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Rota', path: '/rota' },
    { name: 'Staff', path: '/staff' },
    { name: 'Profile', path: '/profile' },
    { name: 'Reports', path: '/reports' },
    { name: 'KPI Dashboard', path: '/kpi-dashboard' },
    { name: 'Incident Report', path: '/incident-report' },
    { name: 'CCTV Incident', path: '/cctv-incident' },
    { name: 'Fire Door Inspection', path: '/fire-door-inspection' },
    { name: 'Comms Room Log', path: '/comms-room-log' },
    { name: 'ID Cards', path: '/id-cards' },
    { name: 'DOB', path: '/dob' },
    { name: 'Form', path: '/form' },
    { name: 'Audit', path: '/audit' },
  ];

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 flex items-center justify-center">
              <i className="ri-shield-check-line text-3xl text-blue-400"></i>
            </div>
            <span className="text-xl font-bold">Security Portal</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  safePathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              <i className="ri-notification-3-line text-xl"></i>
            </button>
            {userEmail ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2">
                  <ProfileAvatar path={avatarPath} name={userName} size="sm" />
                  <span className="text-sm text-gray-300 max-w-[160px] truncate">{userName || userEmail}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-logout-box-r-line text-base"></i>
                  </div>
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-login-box-line text-base"></i>
                </div>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
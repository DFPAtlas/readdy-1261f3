import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useRef(false);
  const [safePathname, setSafePathname] = useState(pathname);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (mounted.current) {
      setSafePathname(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user?.email ?? null);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
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
                <span className="hidden md:inline text-sm text-gray-300 max-w-[160px] truncate">{userEmail}</span>
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
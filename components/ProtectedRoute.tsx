'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, roleRank } from '@/lib/auth-context';
import type { Role } from '@/lib/auth-context';
import SessionLoading from './SessionLoading';
import AccessDenied from './AccessDenied';

const ROUTE_ROLES: Record<string, Role> = {
  '/dashboard': 'manager',
  '/staff': 'supervisor',
  '/rota': 'supervisor',
  '/reports': 'manager',
  '/kpi-dashboard': 'manager',
  '/incident-report': 'staff',
  '/cctv-incident': 'staff',
  '/comms-room-log': 'staff',
  '/fire-door-inspection': 'staff',
  '/dob': 'staff',
  '/id-cards': 'staff',
  '/profile': 'staff',
  '/form': 'staff',
};

function requiredRoleFor(path: string): Role {
  const entry = Object.entries(ROUTE_ROLES).find(
    ([route]) => path === route || path.startsWith(route + '/')
  );
  return entry ? entry[1] : 'staff';
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const required = requiredRoleFor(pathname);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const next = encodeURIComponent(pathname);
      router.replace(`/auth/login?next=${next}`);
    }
  }, [status, pathname, router]);

  if (status === 'loading') {
    return <SessionLoading />;
  }

  if (status === 'unauthenticated') {
    return <SessionLoading label="Redirecting to sign in..." />;
  }

  const effectiveRole = role ?? 'staff';

  if (roleRank(effectiveRole) < roleRank(required)) {
    return <AccessDenied required={required} />;
  }

  return <>{children}</>;
}
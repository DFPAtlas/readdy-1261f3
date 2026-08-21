'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Role = 'staff' | 'supervisor' | 'manager' | 'administrator';
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  email?: string | null;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  role: Role | null;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const ROLE_LEVELS: Record<Role, number> = {
  staff: 1,
  supervisor: 2,
  manager: 3,
  administrator: 4,
};

export function roleRank(role: Role | null | undefined): number {
  return role ? ROLE_LEVELS[role] ?? 0 : 0;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const refreshRole = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('current_user_role');
      if (error) {
        setRole(null);
        return;
      }
      const value = data as Role | null | undefined;
      setRole(value ?? null);
    } catch {
      setRole(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const session = data.session;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setStatus('authenticated');
        await refreshRole();
      } else {
        setUser(null);
        setRole(null);
        setStatus('unauthenticated');
      }
    };

    applySession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setRole(null);
        setStatus('unauthenticated');
      } else if (session.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setStatus('authenticated');
        refreshRole();
      }
    });

    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      supabase.auth.getSession().then(({ data }) => {
        if (mounted && !data.session) {
          setUser(null);
          setRole(null);
          setStatus('unauthenticated');
        }
      });
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [refreshRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, role, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
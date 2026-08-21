'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/auth-context';

export default function AccessDenied({
  required,
}: {
  required: Role;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 mx-auto flex items-center justify-center bg-amber-100 rounded-xl mb-4">
          <i className="ri-lock-line text-3xl text-amber-600"></i>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-sm text-gray-600 mb-6">
          {user?.email ? (
            <>
              Your account ({user.email}) does not have the required{' '}
              <span className="font-semibold text-gray-900">{required}</span> role to view this page.
            </>
          ) : (
            <>
              Your account does not have the required{' '}
              <span className="font-semibold text-gray-900">{required}</span> role to view this page.
            </>
          )}
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Go to home
        </Link>
      </div>
    </div>
  );
}
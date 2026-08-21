'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { validateOrdinaryPostAuthNext } from '@/lib/auth';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Completing sign in...');
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next');

    if (!code) {
      setError('Missing authentication code.');
      return;
    }

    let cancelled = false;

    const run = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (error) {
        setError(error.message);
        return;
      }

      const redirectType = (data as { redirectType?: string | null }).redirectType;
      if (redirectType === 'recovery') {
        router.replace('/auth/reset-password');
        return;
      }

      router.replace(validateOrdinaryPostAuthNext(next));
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-14 h-14 mx-auto flex items-center justify-center bg-red-100 rounded-xl mb-4">
              <i className="ri-error-warning-line text-3xl text-red-600"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <a
              href="/auth/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto flex items-center justify-center bg-blue-100 rounded-xl mb-4">
              <i className="ri-loader-4-line animate-spin text-3xl text-blue-600"></i>
            </div>
            <p className="text-sm text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
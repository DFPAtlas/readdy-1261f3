'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { validateOrdinaryPostAuthNext } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || !data.session) return;
      const safe = validateOrdinaryPostAuthNext(searchParams.get('next'));
      router.replace(safe === '/' ? '/dashboard' : safe);
    });
    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      const next = validateOrdinaryPostAuthNext(searchParams.get('next'));
      router.push(next);
      router.refresh();
    } else {
      setError('Please confirm your email address before signing in.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="ri-error-warning-line text-lg"></i>
          </div>
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading && <i className="ri-loader-4-line animate-spin text-lg"></i>}
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center bg-blue-600 rounded-xl mb-4">
              <i className="ri-shield-check-line text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Security Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <Suspense fallback={<div className="text-sm text-gray-500 text-center py-8">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          New here?{' '}
          <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
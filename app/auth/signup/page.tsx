'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push('/dashboard');
      router.refresh();
      return;
    }

    setNotice(
      'Account created. Check your inbox for a confirmation email, then sign in here.',
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center bg-blue-600 rounded-xl mb-4">
              <i className="ri-user-add-line text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Set a password to access the portal</p>
          </div>

          {notice && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm mb-5">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-information-line text-lg"></i>
              </div>
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-error-warning-line text-lg"></i>
              </div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <i className="ri-loader-4-line animate-spin text-lg"></i>}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
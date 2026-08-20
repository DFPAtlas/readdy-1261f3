const authRoutes = ['/auth', '/login', '/register', '/signup', '/forgot-password', '/reset-password'];

export function validateOrdinaryPostAuthNext(next: string | null | undefined): string {
  if (!next) return '/';
  if (next.startsWith('//') || next.startsWith('http://') || next.startsWith('https://')) return '/';
  if (!next.startsWith('/')) return '/';
  if (authRoutes.some((r) => next === r || next.startsWith(r + '/'))) return '/';
  return next;
}
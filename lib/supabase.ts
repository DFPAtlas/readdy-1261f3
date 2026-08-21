import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Copy .env.example to .env.local and set the required public variables before starting the app.'
    );
  }
  return value;
}

const resolvedUrl = assertEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL');
const resolvedAnonKey = assertEnv(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(resolvedUrl, resolvedAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce',
    detectSessionInUrl: false,
  },
});
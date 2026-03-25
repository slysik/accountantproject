import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !url.startsWith('http')) {
    throw new Error(
      'Missing or invalid Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  return createBrowserClient(url, key);
}

/**
 * Singleton Supabase client — lazy-initialized to avoid errors during
 * static page generation when env vars are placeholders.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_supabase) {
      _supabase = createClient();
    }
    const value = Reflect.get(_supabase, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(_supabase);
    }
    return value;
  },
});

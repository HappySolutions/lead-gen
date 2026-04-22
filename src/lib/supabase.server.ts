import 'server-only';

import { createServerClient as _server, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy object during build/prerender to prevent crash
    return {} as any;
  }

  const cookieStore = await cookies();
  return _server(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: '', ...options }); } catch {}
      },
    },
  });
}
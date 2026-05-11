import { createBrowserClient as _browser } from '@supabase/ssr';

type BrowserSupabaseClient = ReturnType<typeof _browser>;

export function createBrowserClient(): BrowserSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If variables are missing (e.g. during build/prerender), return a dummy or fail gracefully
  if (!url || !key) {
    if (typeof window === 'undefined') {
      // Return a proxy that doesn't crash until actually used
      return {} as unknown as BrowserSupabaseClient;
    }
    throw new Error("Missing Supabase Environment Variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return _browser(url, key);
}
/**
 * middleware.ts — Auth gate.
 *
 * Runs on every request. If the user is not logged in and tries to access
 * any page except /login, redirect them to /login.
 *
 * Also refreshes the Supabase session cookie on every request.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session — required to keep cookies alive
  const { data: { session } } = await supabase.auth.getSession();

  const isLoginPage  = request.nextUrl.pathname === '/login';
  const isApiRoute   = request.nextUrl.pathname.startsWith('/api/');
  const isCallback   = request.nextUrl.pathname.startsWith('/auth/');

  // Allow API routes and auth callbacks through without redirect
  if (isApiRoute || isCallback) return response;

  // Redirect unauthenticated users to login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect already-logged-in users away from login page
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};

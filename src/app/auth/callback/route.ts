/**
 * auth/callback/route.ts — Email confirmation callback.
 *
 * Called when a new user clicks the confirmation link in their signup email.
 * Exchanges the code for a session, upserts their profile row, redirects to /.
 *
 * NOT used for sign-in — password login is handled client-side by Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase.server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('[auth/callback]', error?.message);
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  const user = data.session.user;

  // Create user profile on first confirmation (upsert is safe to call multiple times)
  await supabase.from('user_profiles').upsert(
    {
      id:             user.id,
      email:          user.email,
      is_paid:        false,
      searches_used:  0,
      searches_limit: 3,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  return NextResponse.redirect(`${origin}/`);
}
/**
 * api/user/profile/route.ts — Returns the current user's profile.
 *
 * Called by page.tsx on load to get searches_used, searches_limit, is_paid.
 * Also called after the admin confirms payment to get the updated status.
 */

import { NextResponse }       from 'next/server';
import { createServerClient } from '@/lib/supabase.server';

export interface UserProfile {
  id:              string;
  email:           string;
  is_paid:         boolean;
  searches_used:   number;
  searches_limit:  number;
}

export async function GET() {
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Try to get existing profile
  let { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, email, is_paid, searches_used, searches_limit')
    .eq('id', session.user.id)
    .single();

  // If profile doesn't exist, create it (fallback for missing trigger)
  if (error || !profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .upsert({
        id:             session.user.id,
        email:          session.user.email,
        is_paid:        false,
        searches_used:  0,
        searches_limit: 3,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (createError) {
      console.error('[profile/GET] Failed to auto-create profile:', createError);
      return NextResponse.json({ error: 'Profile not found and could not be created' }, { status: 404 });
    }
    profile = newProfile;
  }

  return NextResponse.json(profile);
}

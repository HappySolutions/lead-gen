/**
 * route.ts — Pipeline orchestrator.
 *
 * Auth-aware: reads user profile from Supabase, enforces search limits.
 * Increments searches_used on every successful search for free-tier users.
 *
 * GET /api/leads?q=gyms&loc=Cairo&service=web+design
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRawLeads }             from '@/services/places';
import { fetchApifyLeads, mergeLeads } from '@/services/apify';
import { enrichLeads }               from '@/services/enrichment';
import { analyzeLeadQuality }        from '@/services/ai';
import { calculateServiceScore, getScoreLabel } from '@/core/scoring';
import { Lead } from '@/core/types';
import { createServerClient } from '@/lib/supabase.server';
export const maxDuration = 60;

const MAX_RESULTS  = 20;
const TOP_N_FOR_AI =  5;

const cache = new Map<string, { data: Lead[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q       = searchParams.get('q')?.trim();
  const loc     = searchParams.get('loc')?.trim();
  const service = searchParams.get('service')?.trim() ?? '';
  const lang    = searchParams.get('lang')?.trim() ?? '';

  if (!q || !loc) {
    return NextResponse.json(
      { error: 'Missing required params: q and loc.' },
      { status: 400 }
    );
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ── Load user profile ───────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_paid, searches_used, searches_limit')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // ── Enforce search limit for free-tier users ────────────────────────────────
  if (!profile.is_paid && profile.searches_used >= profile.searches_limit) {
    return NextResponse.json(
      { error: 'SEARCH_LIMIT_REACHED', searches_used: profile.searches_used, searches_limit: profile.searches_limit },
      { status: 403 }
    );
  }

  // ── Cache check (cached results don't count as a new search) ───────────────
  const cacheKey = `${q.toLowerCase()}::${loc.toLowerCase()}::${service.toLowerCase()}`;
  const cached   = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    // ── Fetch from OSM + Apify in parallel ──────────────────────────────────
    const [osmLeads, apifyLeads] = await Promise.all([
      fetchRawLeads(q, loc).catch((err: Error) => { console.error('[route] OSM failed:', err.message); return []; }),
      fetchApifyLeads(q, loc).catch((err: Error) => { console.error('[route] Apify failed:', err.message); return []; }),
    ]);

    const rawLeads = mergeLeads(osmLeads, apifyLeads);

    if (rawLeads.length === 0) {
      return NextResponse.json([], { headers: { 'X-Cache': 'MISS' } });
    }

    // ── Enrich → Score → AI ─────────────────────────────────────────────────
    const enriched = await enrichLeads(rawLeads);

    const scored = enriched.map((lead) => {
      const { score, explanation, serviceGaps } = calculateServiceScore(lead, service);
      return { lead, score, explanation, serviceGaps };
    });

    const top = scored.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);

    const aiResults = await Promise.all(
      top.map(async ({ lead, serviceGaps }, i) => {
        if (i >= TOP_N_FOR_AI) return null;
        try { return await analyzeLeadQuality(lead, service, serviceGaps, lang === 'ar' ? 'ar' : 'en'); }
        catch { return null; }
      })
    );

    const leads: Lead[] = top.map(({ lead, score, explanation, serviceGaps }, i) => ({
      id:               lead.osmId,
      name:             lead.name,
      category:         lead.category,
      address:          lead.address,
      source:           (lead.osmId.startsWith('gmaps-') ? 'gmaps' : 'osm') as 'gmaps' | 'osm',
      rating:           lead.rating !== undefined ? Number(lead.rating) : undefined,
      reviews:          lead.reviews !== undefined ? Number(lead.reviews) : undefined,
      phone:            lead.phone,
      website:          lead.website,
      email:            lead.email,
      socialLinks:      (lead as any).socialLinks,
      description:      (lead as any).description,
      openingHours:     lead.openingHours,
      location:         lead.location,
      score,
      scoreLabel:       getScoreLabel(score),
      scoreExplanation: explanation,
      serviceGaps,
      aiInsights:       aiResults[i]?.insights ?? undefined,
    }));

    cache.set(cacheKey, { data: leads, timestamp: Date.now() });

    // ── Increment searches_used for free-tier users ──────────────────────────
    if (!profile.is_paid) {
      await supabase
        .from('user_profiles')
        .update({ searches_used: profile.searches_used + 1 })
        .eq('id', session.user.id);
    }

    return NextResponse.json(leads, {
      headers: {
        'X-Cache':          'MISS',
        'X-Searches-Used':  String(profile.searches_used + 1),
        'X-Searches-Limit': String(profile.searches_limit),
        'X-Is-Paid':        String(profile.is_paid),
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[route]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

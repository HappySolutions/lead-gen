/**
 * route.ts — Pipeline orchestrator.
 *
 * Auth-aware: reads user profile from Supabase, enforces search limits.
 * Increments searches_used on every successful search for free-tier users.
 *
 * Caching strategy (two-level):
 *   L1 — finalResultsCache: full scored + AI result set (30 min TTL).
 *         A cache HIT skips everything — no API calls, no AI, no counter bump.
 *   L2 — apifyRawCache / osmRawCache: raw discovery results (60 min TTL).
 *         Used on a cache MISS for final results so repeated searches for the
 *         same location still avoid redundant Apify / OSM calls.
 *
 * GET /api/leads?q=gyms&loc=Cairo&service=web+design&minRating=0&sortBy=score&page=1&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRawLeads }             from '@/services/places';
import { fetchApifyLeads, mergeLeads } from '@/services/apify';
import { enrichLeads }               from '@/services/enrichment';
import { analyzeLeadQuality }        from '@/services/ai';
import { calculateServiceScore, getScoreLabel } from '@/core/scoring';
import { Lead, LeadSortBy, LeadsApiResponse } from '@/core/types';
import { createServerClient } from '@/lib/supabase.server';
import { finalResultsCache, apifyRawCache, osmRawCache } from '@/lib/cache';

export const maxDuration = 60;

const MAX_RESULTS  = 20;
const TOP_N_FOR_AI =  5;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type EnrichmentExtras = {
  socialLinks?: Lead['socialLinks'];
  description?: string;
};

function buildLeadsPayload(
  allLeads: Lead[],
  minRating: number,
  sortBy: LeadSortBy,
  page: number,
  limit: number,
  q: string,
  loc: string,
  service: string,
): LeadsApiResponse {
  const filteredAndSorted = allLeads
    .filter((lead) => (lead.rating ?? 0) >= minRating)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
      if (sortBy === 'reviews') return (b.reviews ?? -1) - (a.reviews ?? -1);
      return a.name.localeCompare(b.name);
    });

  const total = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const items = filteredAndSorted.slice(start, start + limit);

  return {
    items,
    meta: {
      page: safePage,
      limit,
      total,
      totalPages,
      sortBy,
      minRating,
      query: q,
      location: loc,
      service,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q       = searchParams.get('q')?.trim();
  const loc     = searchParams.get('loc')?.trim();
  const service = searchParams.get('service')?.trim() ?? '';
  const lang    = searchParams.get('lang')?.trim() ?? '';
  const rawMinRating = Number(searchParams.get('minRating') ?? '0');
  const minRating = Number.isFinite(rawMinRating) ? Math.min(5, Math.max(0, rawMinRating)) : 0;
  const rawSortBy = (searchParams.get('sortBy')?.trim() ?? 'score') as LeadSortBy;
  const sortBy: LeadSortBy = ['score', 'rating', 'reviews', 'name'].includes(rawSortBy) ? rawSortBy : 'score';
  const rawPage = Number(searchParams.get('page') ?? String(DEFAULT_PAGE));
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const rawLimit = Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(MAX_LIMIT, Math.floor(rawLimit)) : DEFAULT_LIMIT;

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

  const commonHeaders = {
    'X-Searches-Used':  String(profile.searches_used),
    'X-Searches-Limit': String(profile.searches_limit),
    'X-Is-Paid':        String(profile.is_paid),
  };

  // ── L1: Final results cache (cache HITs don't count as a new search) ────────
  const cached = await finalResultsCache.get(q, loc, service);
  if (cached !== null) {
    const payload = buildLeadsPayload(cached, minRating, sortBy, page, limit, q, loc, service);
    return NextResponse.json(payload, {
      headers: {
        ...commonHeaders,
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    // ── L2: Raw discovery cache — avoids duplicate Apify / OSM calls ──────────
    const [cachedOsm, cachedApify] = await Promise.all([
      osmRawCache.get<Awaited<ReturnType<typeof fetchRawLeads>>>(q, loc),
      apifyRawCache.get<Awaited<ReturnType<typeof fetchApifyLeads>>>(q, loc),
    ]);

    const [osmLeads, apifyLeads] = await Promise.all([
      cachedOsm
        ? Promise.resolve(cachedOsm)
        : fetchRawLeads(q, loc)
            .then(async (data) => { await osmRawCache.set(q, loc, data); return data; })
            .catch((err: Error) => { console.error('[route] OSM failed:', err.message); return []; }),

      cachedApify
        ? Promise.resolve(cachedApify)
        : fetchApifyLeads(q, loc)
            .then(async (data) => { await apifyRawCache.set(q, loc, data); return data; })
            .catch((err: Error) => { console.error('[route] Apify failed:', err.message); return []; }),
    ]);

    const rawLeads = mergeLeads(osmLeads, apifyLeads);

    if (rawLeads.length === 0) {
      const empty: LeadsApiResponse = {
        items: [],
        meta: {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
          sortBy,
          minRating,
          query: q,
          location: loc,
          service,
        },
      };
      return NextResponse.json(empty, {
        headers: { ...commonHeaders, 'X-Cache': 'MISS' },
      });
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
      socialLinks:      (lead as EnrichmentExtras).socialLinks,
      description:      (lead as EnrichmentExtras).description,
      openingHours:     lead.openingHours,
      location:         lead.location,
      score,
      scoreLabel:       getScoreLabel(score),
      scoreExplanation: explanation,
      serviceGaps,
      aiInsights:       aiResults[i]?.insights ?? undefined,
    }));

    // ── Persist full scored list to L1 (minRating / sortBy / page applied on read) ─
    await finalResultsCache.set(q, loc, service, leads);

    const payload = buildLeadsPayload(leads, minRating, sortBy, page, limit, q, loc, service);

    // ── Increment searches_used for free-tier users ──────────────────────────
    if (!profile.is_paid) {
      await supabase
        .from('user_profiles')
        .update({ searches_used: profile.searches_used + 1 })
        .eq('id', session.user.id);
    }

    const searchesUsedAfter = !profile.is_paid ? profile.searches_used + 1 : profile.searches_used;
    return NextResponse.json(payload, {
      headers: {
        ...commonHeaders,
        'X-Cache':          'MISS',
        'X-Searches-Used':  String(searchesUsedAfter),
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[route]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

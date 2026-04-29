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
 * GET /api/leads?q=gyms&loc=Cairo&service=...&hasWebsite=1&hasPhone=1&hasEmail=1&minRating=0&sortBy=score&page=1&limit=20&lang=en
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

/**
 * Hard cap on candidates persisted to L1 per discovery request (Apify/OSM/API cost control).
 * Filters, sort, and pagination run in `buildLeadsPayload` **after** this pool — intentional product
 * / cost-saving boundary (explicitly out of scope for Epic 2 QA).
 */
const MAX_RESULTS  = 20;
const TOP_N_FOR_AI =  5;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type EnrichmentExtras = {
  socialLinks?: Lead['socialLinks'];
  description?: string;
};

function parseBoolParam(searchParams: URLSearchParams, key: string): boolean {
  const v = searchParams.get(key);
  if (v === null) return false;
  const t = v.trim().toLowerCase();
  return t === '1' || t === 'true' || t === 'yes';
}

/** Treat non-finite ratings as 0 for minRating filter and stable sorts. */
function leadRatingStars(lead: Lead): number {
  const r = lead.rating;
  return typeof r === 'number' && Number.isFinite(r) ? r : 0;
}

function finiteNumberOrZero(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

/** Same finite-or-zero semantics as `leadRatingStars`, for stable sort comparators. */
function leadScoreSortValue(lead: Lead): number {
  return finiteNumberOrZero(lead.score);
}

function leadReviewSortValue(lead: Lead): number {
  return finiteNumberOrZero(lead.reviews);
}

function buildLeadsPayload(
  allLeads: Lead[],
  hasWebsite: boolean,
  hasPhone: boolean,
  hasEmail: boolean,
  minRating: number,
  sortBy: LeadSortBy,
  page: number,
  limit: number,
  q: string,
  loc: string,
  service: string,
): LeadsApiResponse {
  const filteredAndSorted = allLeads
    .filter((lead) => {
      if (hasWebsite && !lead.website) return false;
      if (hasPhone && !lead.phone) return false;
      if (hasEmail && !lead.email) return false;
      return true;
    })
    .filter((lead) => leadRatingStars(lead) >= minRating)
    .sort((a, b) => {
      if (sortBy === 'score') return leadScoreSortValue(b) - leadScoreSortValue(a);
      if (sortBy === 'rating') return leadRatingStars(b) - leadRatingStars(a);
      if (sortBy === 'reviews') return leadReviewSortValue(b) - leadReviewSortValue(a);
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
      hasWebsite,
      hasPhone,
      hasEmail,
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
  const hasWebsite = parseBoolParam(searchParams, 'hasWebsite');
  const hasPhone = parseBoolParam(searchParams, 'hasPhone');
  const hasEmail = parseBoolParam(searchParams, 'hasEmail');

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
    const payload = buildLeadsPayload(
      cached,
      hasWebsite,
      hasPhone,
      hasEmail,
      minRating,
      sortBy,
      page,
      limit,
      q,
      loc,
      service,
    );
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
      const payload = buildLeadsPayload(
        [],
        hasWebsite,
        hasPhone,
        hasEmail,
        minRating,
        sortBy,
        page,
        limit,
        q,
        loc,
        service,
      );
      return NextResponse.json(payload, {
        headers: { ...commonHeaders, 'X-Cache': 'MISS' },
      });
    }

    // ── Enrich → Score → AI ─────────────────────────────────────────────────
    const enriched = await enrichLeads(rawLeads);

    const scored = enriched.map((lead) => {
      const { score, explanation, serviceGaps } = calculateServiceScore(lead, service);
      return { lead, score, explanation, serviceGaps };
    });

    const top = scored
      .sort((a, b) => finiteNumberOrZero(b.score) - finiteNumberOrZero(a.score))
      .slice(0, MAX_RESULTS);

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

    // ── Persist full scored list to L1 (filters / sort / page applied on read) ─
    await finalResultsCache.set(q, loc, service, leads);

    const payload = buildLeadsPayload(
      leads,
      hasWebsite,
      hasPhone,
      hasEmail,
      minRating,
      sortBy,
      page,
      limit,
      q,
      loc,
      service,
    );

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

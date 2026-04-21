/**
 * route.ts — Pipeline orchestrator.
 *
 * Now accepts an optional `service` param (what the user sells).
 * This flows into scoring and AI insights to make both service-specific.
 *
 * GET /api/leads?q=gyms&loc=Cairo&service=web+design
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRawLeads }            from '@/services/places';
import { enrichLeads }              from '@/services/enrichment';
import { analyzeLeadQuality }       from '@/services/ai';
import { calculateServiceScore, getScoreLabel } from '@/core/scoring';
import { Lead } from '@/core/types';

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
      { error: 'Missing required params: q (business type) and loc (location).' },
      { status: 400 }
    );
  }

  const cacheKey = `${q.toLowerCase()}::${loc.toLowerCase()}::${service.toLowerCase()}::${lang.toLowerCase()}`;
  const cached   = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    // 1. Fetch raw OSM leads
    const rawLeads = await fetchRawLeads(q, loc);
    if (rawLeads.length === 0) {
      return NextResponse.json([], { headers: { 'X-Cache': 'MISS' } });
    }

    // 2. Enrich with website data
    const enriched = await enrichLeads(rawLeads);

    // 3. Score with service-awareness
    const scored = enriched.map((lead) => {
      const { score, explanation, serviceGaps } = calculateServiceScore(lead, service);
      return { lead, score, explanation, serviceGaps };
    });

    // 4. Sort, cap at MAX_RESULTS
    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    // 5. AI insights for top N — now service-aware
    const aiResults = await Promise.all(
      top.map(async ({ lead, serviceGaps }, i) => {
        if (i >= TOP_N_FOR_AI) return null;
        try { return await analyzeLeadQuality(lead, service, serviceGaps, lang === 'ar' ? 'ar' : 'en'); }
        catch { return null; }
      })
    );

    // 6. Build Lead objects
    const leads: Lead[] = top.map(({ lead, score, explanation, serviceGaps }, i) => ({
      id:               lead.osmId,
      name:             lead.name,
      category:         lead.category,
      address:          lead.address,
      phone:            lead.phone,
      website:          lead.website,
      email:            lead.email,
      socialLinks:      lead.socialLinks,
      description:      lead.description,
      openingHours:     lead.openingHours,
      location:         lead.location,
      score,
      scoreLabel:       getScoreLabel(score),
      scoreExplanation: explanation,
      serviceGaps,
      aiInsights:       aiResults[i]?.insights ?? undefined,
    }));

    cache.set(cacheKey, { data: leads, timestamp: Date.now() });
    return NextResponse.json(leads, { headers: { 'X-Cache': 'MISS' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[route]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

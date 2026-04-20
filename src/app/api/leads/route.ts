/**
 * route.ts — Pipeline orchestrator. Only file that connects all layers.
 *
 * Pipeline:
 *   1. Validate params
 *   2. Check cache
 *   3. fetchRawLeads()     → places.ts      OSM data (tag-resolved, any niche)
 *   4. enrichLeads()       → enrichment.ts  scrape websites for email/social/desc
 *   5. calculateBaseScore  → scoring.ts     score on real enriched fields
 *   6. Sort, take top 20
 *   7. analyzeLeadQuality  → ai.ts          outreach insight for top 5
 *   8. Build Lead[], cache, respond
 *
 * Frontend calls ONLY /api/leads — never any external service directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRawLeads } from '@/services/places';
import { enrichLeads } from '@/services/enrichment';
import { analyzeLeadQuality } from '@/services/ai';
import { calculateBaseScore, getScoreLabel } from '@/core/scoring';
import { Lead } from '@/core/types';

export const maxDuration = 60; // seconds — Vercel hobby limit

const MAX_RESULTS = 20;
const TOP_N_FOR_AI = 5;

const cache = new Map<string, { data: Lead[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 min

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const loc = searchParams.get('loc')?.trim();

  if (!q || !loc) {
    return NextResponse.json(
      { error: 'Missing required params: q (business type) and loc (location).' },
      { status: 400 }
    );
  }

  const cacheKey = `${q.toLowerCase()}::${loc.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    // ── 1. Fetch raw OSM leads (any niche, tag-resolved) ─────────────────────
    const rawLeads = await fetchRawLeads(q, loc);
    console.log(`[route] ${rawLeads.length} raw leads from OSM`);

    if (rawLeads.length === 0) {
      return NextResponse.json([], { headers: { 'X-Cache': 'MISS' } });
    }

    // ── 2. Enrich all leads with website data (email, social, description) ───
    const enriched = await enrichLeads(rawLeads);
    console.log(`[route] enrichment complete`);

    // ── 3. Score every lead on real enriched data ─────────────────────────────
    const scored = enriched.map((lead) => {
      const { score, explanation } = calculateBaseScore(lead);
      return { lead, score, explanation };
    });

    // ── 4. Sort by score, take top MAX_RESULTS ───────────────────────────────
    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    // ── 5. AI outreach insight for top N leads (parallel) ────────────────────
    const aiResults = await Promise.all(
      top.map(async ({ lead }, i) => {
        if (i >= TOP_N_FOR_AI) return null;
        try { return await analyzeLeadQuality(lead); }
        catch { return null; }
      })
    );

    // ── 6. Build final Lead objects ───────────────────────────────────────────
    const leads: Lead[] = top.map(({ lead, score, explanation }, i) => ({
      id: lead.osmId,
      name: lead.name,
      category: lead.category,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      email: lead.email,         // OSM email OR scraped from website
      socialLinks: lead.socialLinks,   // scraped from website
      description: lead.description,  // scraped meta description
      openingHours: lead.openingHours,
      location: lead.location,
      score,
      scoreLabel: getScoreLabel(score),
      scoreExplanation: explanation,
      aiInsights: aiResults[i]?.insights ?? undefined,
    }));

    cache.set(cacheKey, { data: leads, timestamp: Date.now() });
    return NextResponse.json(leads, { headers: { 'X-Cache': 'MISS' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[route]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

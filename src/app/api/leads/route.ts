/**
 * route.ts — Orchestration layer. The only place that wires everything together.
 *
 * Pipeline (all server-side):
 *   1. Validate request params
 *   2. Check cache
 *   3. fetchRawLeads()       → places.ts   (OSM data, no scores)
 *   4. calculateBaseScore()  → scoring.ts  (completeness + quality)
 *   5. Sort by base score, take top 20
 *   6. analyzeLeadQuality()  → ai.ts       (top 5 only, runs in parallel)
 *   7. applyAIScore()        → scoring.ts  (merge AI into final score)
 *   8. Re-sort by final score, cache, return
 *
 * The frontend calls ONLY this endpoint — never Nominatim/Overpass/AI directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRawLeads, RawLead } from '@/services/places';
import { analyzeLeadQuality } from '@/services/ai';
import { calculateBaseScore, applyAIScore, getScoreLabel } from '@/core/scoring';
import { Lead } from '@/core/types';

// Tell Next.js this route is allowed up to 60s (Vercel hobby: 60s, pro: 300s)
export const maxDuration = 60;

const MAX_RESULTS = 20;
const TOP_N_FOR_AI = 5;

// ─── In-memory cache (upgrade to Redis for multi-instance deployments) ────────
const cache = new Map<string, { data: Lead[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 min

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const loc = searchParams.get('loc')?.trim();

  if (!q || !loc) {
    return NextResponse.json(
      { error: 'Missing required query params: q (business type) and loc (location).' },
      { status: 400 }
    );
  }

  // ── Cache check ─────────────────────────────────────────────────────────────
  const cacheKey = `${q.toLowerCase()}::${loc.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    // ── Step 1: Fetch raw OSM data (no scores yet) ───────────────────────────
    const rawLeads: RawLead[] = await fetchRawLeads(q, loc);

    // ── Step 2: Score every lead from real data only ─────────────────────────
    const scored = rawLeads.map((raw) => {
      const { score, explanation } = calculateBaseScore(raw);
      return { raw, baseScore: score, explanation };
    });

    // ── Step 3: Sort by base score, cap at MAX_RESULTS ───────────────────────
    const topScored = scored
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, MAX_RESULTS);

    // ── Step 4: Run AI on top N leads only, in parallel ──────────────────────
    const aiResults = await Promise.all(
      topScored.map(async ({ raw }, index) => {
        if (index >= TOP_N_FOR_AI) return null;
        try {
          return await analyzeLeadQuality(raw);
        } catch {
          return null; // AI failure never breaks the pipeline
        }
      })
    );

    // ── Step 5: Merge AI scores, compute final score, build Lead objects ─────
    const leads: Lead[] = topScored.map(({ raw, baseScore, explanation }, index) => {
      const ai = aiResults[index] ?? null;
      const finalScore = applyAIScore(baseScore, null); // AI is insights-only; base score stands

      return {
        id: raw.osmId,
        name: raw.name,
        category: raw.category,
        address: raw.address,
        phone: raw.phone,
        website: raw.website,
        email: raw.email,
        openingHours: raw.openingHours,
        rating: undefined, // OSM doesn't provide this — never fake it
        reviews: undefined, // same
        location: raw.location,
        score: finalScore,
        scoreLabel: getScoreLabel(finalScore),
        scoreExplanation: explanation,
        aiInsights: ai?.insights ?? undefined,
      };
    });

    // ── Step 6: Re-sort by final score (AI may have shifted rankings) ─────────
    leads.sort((a, b) => b.score - a.score);

    // ── Step 7: Cache and respond ─────────────────────────────────────────────
    cache.set(cacheKey, { data: leads, timestamp: Date.now() });

    return NextResponse.json(leads, { headers: { 'X-Cache': 'MISS' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    console.error('[/api/leads]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
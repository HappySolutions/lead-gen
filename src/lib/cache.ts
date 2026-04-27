/**
 * cache.ts — Typed cache abstraction over Upstash Redis.
 *
 * Four named buckets, each with its own TTL and key-building logic.
 * The rest of the app imports from here — never from redis.ts directly.
 * Swapping the backend only requires changing this file.
 *
 * Bucket           TTL      Key shape
 * ─────────────────────────────────────────────────────────────────
 * finalResults     30 min   leads:final::<q>::<loc>::<service>
 * apifyRaw         60 min   leads:apify::<q>::<loc>
 * osmRaw           60 min   leads:osm::<q>::<loc>
 * aiInsights       60 min   leads:ai::<leadId>::<service>::<lang>
 *
 * When Redis is unavailable the module falls back to an in-process
 * Map so behaviour is identical — just not shared across instances.
 */

import redis from '@/lib/redis';
import { Lead } from '@/core/types';

// ── TTLs (seconds) ───────────────────────────────────────────────────────────
const TTL = {
  finalResults: 60 * 30,   // 30 min  — full scored + AI enriched result set
  apifyRaw:     60 * 60,   // 60 min  — raw Apify actor response
  osmRaw:       60 * 60,   // 60 min  — raw OSM / places response
  aiInsights:   60 * 60,   // 60 min  — AI analysis per individual lead
} as const;

// ── Key builders ─────────────────────────────────────────────────────────────
const KEY = {
  finalResults: (q: string, loc: string, service: string) =>
    `leads:final::${norm(q)}::${norm(loc)}::${norm(service)}`,

  apifyRaw: (q: string, loc: string) =>
    `leads:apify::${norm(q)}::${norm(loc)}`,

  osmRaw: (q: string, loc: string) =>
    `leads:osm::${norm(q)}::${norm(loc)}`,

  aiInsights: (leadId: string, service: string, lang: string) =>
    `leads:ai::${leadId}::${norm(service)}::${norm(lang)}`,
};

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, '+');
}

// ── In-memory fallback (used when Redis is null) ──────────────────────────────
interface FallbackEntry<T> {
  data: T;
  expiresAt: number;
}

const fallback = new Map<string, FallbackEntry<unknown>>();

function fbGet<T>(key: string): T | null {
  const entry = fallback.get(key) as FallbackEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { fallback.delete(key); return null; }
  return entry.data;
}

function fbSet<T>(key: string, value: T, ttlSeconds: number): void {
  fallback.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ── Generic get / set ─────────────────────────────────────────────────────────
async function get<T>(key: string): Promise<T | null> {
  if (!redis) return fbGet<T>(key);
  try {
    return await redis.get<T>(key);
  } catch (err) {
    console.error('[cache] Redis GET error:', err);
    return fbGet<T>(key);
  }
}

async function set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!redis) { fbSet(key, value, ttlSeconds); return; }
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error('[cache] Redis SET error:', err);
    fbSet(key, value, ttlSeconds);
  }
}

// ── Public cache API ──────────────────────────────────────────────────────────

/** Final scored + AI-enriched lead list for a search query. */
export const finalResultsCache = {
  get: (q: string, loc: string, service: string) =>
    get<Lead[]>(KEY.finalResults(q, loc, service)),

  set: (q: string, loc: string, service: string, leads: Lead[]) =>
    set(KEY.finalResults(q, loc, service), leads, TTL.finalResults),
};

/** Raw Apify actor response (before merge / scoring). */
export const apifyRawCache = {
  get: <T>(q: string, loc: string) =>
    get<T>(KEY.apifyRaw(q, loc)),

  set: <T>(q: string, loc: string, data: T) =>
    set(KEY.apifyRaw(q, loc), data, TTL.apifyRaw),
};

/** Raw OSM / places response (before merge / scoring). */
export const osmRawCache = {
  get: <T>(q: string, loc: string) =>
    get<T>(KEY.osmRaw(q, loc)),

  set: <T>(q: string, loc: string, data: T) =>
    set(KEY.osmRaw(q, loc), data, TTL.osmRaw),
};

/** AI insights string for an individual lead. */
export const aiInsightsCache = {
  get: (leadId: string, service: string, lang: string) =>
    get<string>(KEY.aiInsights(leadId, service, lang)),

  set: (leadId: string, service: string, lang: string, insights: string) =>
    set(KEY.aiInsights(leadId, service, lang), insights, TTL.aiInsights),
};

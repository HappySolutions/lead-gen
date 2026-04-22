/**
 * apify.ts — Google Maps data quality layer via Apify.
 *
 * Actor used: compass/crawler-google-places
 *   - Most mature Google Maps scraper on Apify (10M+ runs)
 *   - Returns name, address, phone, website, rating, reviewsCount,
 *     openingHours, categories — maps cleanly onto RawLead
 *   - Supports Arabic search queries natively
 *
 * Role in the pipeline:
 *   OSM  → Discovery layer  (finds what exists)
 *   Apify → Data quality layer (fills in phone/website/rating OSM lacks)
 *
 * Strategy:
 *   1. Run Apify search for the same query + location
 *   2. Normalise results into RawLead[]
 *   3. Merge with OSM results in places.ts — Apify data wins on conflicts
 *
 * Server-side only — never imported by UI components.
 */

import type { RawLead } from './places';

const APIFY_API_KEY  = process.env.APIFY_API_KEY ?? '';
const ACTOR_ID       = 'compass~crawler-google-places';
const APIFY_BASE_URL = 'https://api.apify.com/v2';

// How many results to request from Google Maps per search
const MAX_PLACES = 30;

// Hard timeout for the whole Apify run (ms). Vercel hobby limit is 60s.
const RUN_TIMEOUT_MS = 45_000;

// Polling interval while waiting for the actor run to finish
const POLL_INTERVAL_MS = 2_500;

// ─── Apify response shape (subset we use) ────────────────────────────────────

interface ApifyPlace {
  title?:         string;
  address?:       string;
  phone?:         string;
  website?:       string;
  totalScore?:    number;   // Google star rating 1–5
  reviewsCount?:  number;
  openingHours?:  Array<{ day: string; hours: string }>;
  categories?:    string[];
  location?: {
    lat: number;
    lng: number;
  };
  url?: string; // Google Maps URL — used as fallback id
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface ApifyDatasetResponse {
  data: {
    items: ApifyPlace[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
}

function deriveCategory(place: ApifyPlace): string {
  const cats = place.categories ?? [];
  if (cats.length === 0) return 'Business';
  // Take the first category, clean it up
  return toTitleCase(cats[0].replace(/_/g, ' '));
}

function formatOpeningHours(hours?: ApifyPlace['openingHours']): string | undefined {
  if (!hours || hours.length === 0) return undefined;
  return hours.map((h) => `${h.day}: ${h.hours}`).join(', ');
}

/** Convert an Apify place result into a RawLead. Returns null if unusable. */
function normalisePlace(place: ApifyPlace, index: number): RawLead | null {
  const name = place.title?.trim();
  if (!name) return null;

  const lat = place.location?.lat;
  const lng = place.location?.lng;
  if (lat === undefined || lng === undefined) return null;

  // Build a stable id from the Google Maps URL or fall back to index
  const rawId = place.url
    ? place.url.replace(/[^a-zA-Z0-9]/g, '').slice(-20)
    : String(index);

  return {
    osmId:        `gmaps-${rawId}`,        // "gmaps-" prefix distinguishes from OSM results
    name,
    category:     deriveCategory(place),
    address:      place.address ?? `Near (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    phone:        place.phone?.trim()   || undefined,
    website:      place.website         ? normaliseUrl(place.website) : undefined,
    email:        undefined,             // Google Maps doesn't expose email — enrichment fills this
    openingHours: formatOpeningHours(place.openingHours),
    location:     { lat, lng },
    // Bonus fields not in base RawLead — attached as extras for scoring
    rating:       place.totalScore,
    reviews:      place.reviewsCount,
  };
}

// ─── Actor run + poll ─────────────────────────────────────────────────────────

/**
 * Starts an Apify actor run and returns the run ID + dataset ID.
 */
async function startActorRun(
  searchTerms: string[],
  location: string,
): Promise<{ runId: string; datasetId: string }> {
  const input = {
    searchStringsArray: searchTerms,
    locationQuery:      location,
    maxCrawledPlaces:   MAX_PLACES,
    language:           'en',             // results in English regardless of query language
    exportPlaceUrls:    false,
    additionalInfo:     false,
    scrapeDirectories:  false,
    scrapeResponseFromOwnerText: false,
  };

  const url = `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs?token=${APIFY_API_KEY}`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
    cache:   'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify run start failed (${res.status}): ${body}`);
  }

  const json: ApifyRunResponse = await res.json();
  return {
    runId:     json.data.id,
    datasetId: json.data.defaultDatasetId,
  };
}

/**
 * Polls the run status until it finishes (SUCCEEDED / FAILED / ABORTED).
 * Times out after RUN_TIMEOUT_MS and returns whatever dataset was collected.
 */
async function waitForRun(runId: string): Promise<string> {
  const deadline = Date.now() + RUN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${runId}?token=${APIFY_API_KEY}`,
      { cache: 'no-store' },
    );

    if (!res.ok) continue;

    const json = await res.json();
    const status: string = json.data?.status ?? '';

    if (status === 'SUCCEEDED') return 'SUCCEEDED';
    if (status === 'FAILED' || status === 'ABORTED') return status;
    // RUNNING / READY → keep polling
  }

  // Timed out — caller will fetch partial dataset
  console.warn('[apify] Run timed out — fetching partial results');
  return 'TIMEOUT';
}

/**
 * Fetches the dataset items for a completed (or partial) run.
 */
async function fetchDataset(datasetId: string): Promise<ApifyPlace[]> {
  const url =
    `${APIFY_BASE_URL}/datasets/${datasetId}/items` +
    `?token=${APIFY_API_KEY}&limit=${MAX_PLACES}&clean=true`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`[apify] Dataset fetch failed: ${res.status}`);
    return [];
  }

  // The dataset endpoint returns a raw array, not wrapped in { data }
  const json = await res.json();
  // Handle both array response and { data: { items } }
  if (Array.isArray(json)) return json as ApifyPlace[];
  return (json as ApifyDatasetResponse)?.data?.items ?? [];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Searches Google Maps via Apify for businesses matching `query` near `location`.
 *
 * Returns RawLead[] — same shape as OSM results so the pipeline is unchanged.
 * Returns [] on any error so OSM results are always used as fallback.
 *
 * @param query    Business type, e.g. "restaurants", "مطاعم"
 * @param location City / area string, e.g. "Cairo, Egypt"
 */
export async function fetchApifyLeads(
  query: string,
  location: string,
): Promise<RawLead[]> {
  if (!APIFY_API_KEY) {
    console.warn('[apify] APIFY_API_KEY not set — skipping Google Maps layer');
    return [];
  }

  try {
    console.log(`[apify] Starting Google Maps search: "${query}" in "${location}"`);

    const searchTerms = [`${query} in ${location}`];
    const { runId, datasetId } = await startActorRun(searchTerms, location);

    console.log(`[apify] Run started: ${runId}, dataset: ${datasetId}`);

    const status = await waitForRun(runId);
    console.log(`[apify] Run ended with status: ${status}`);

    const places = await fetchDataset(datasetId);
    console.log(`[apify] Got ${places.length} places from Google Maps`);

    const leads = places
      .map((p, i) => normalisePlace(p, i))
      .filter((l): l is RawLead => l !== null);

    console.log(`[apify] Normalised to ${leads.length} valid leads`);
    return leads;

  } catch (err) {
    // Never break the pipeline — OSM results are the fallback
    console.error('[apify] Error fetching from Google Maps:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Merges OSM leads and Apify leads into a single deduplicated list.
 *
 * Strategy:
 * - If both sources have a business with the same name (fuzzy), Apify wins
 *   because it has richer data (rating, reviews, phone, website).
 * - Businesses only in OSM are kept.
 * - Businesses only in Apify are added.
 *
 * @param osmLeads   Results from fetchRawLeads()
 * @param apifyLeads Results from fetchApifyLeads()
 */
export function mergeLeads(osmLeads: RawLead[], apifyLeads: RawLead[]): RawLead[] {
  if (apifyLeads.length === 0) return osmLeads;
  if (osmLeads.length === 0)   return apifyLeads;

  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '').trim();

  // Index Apify leads by normalised name for O(1) lookup
  const apifyByName = new Map<string, RawLead>();
  for (const lead of apifyLeads) {
    apifyByName.set(normalise(lead.name), lead);
  }

  const merged: RawLead[] = [];
  const usedApifyKeys = new Set<string>();

  for (const osmLead of osmLeads) {
    const key = normalise(osmLead.name);
    const apifyMatch = apifyByName.get(key);

    if (apifyMatch) {
      // Apify has richer data — use it, but fall back to OSM fields if missing
      merged.push({
        ...osmLead,
        ...apifyMatch,
        // Prefer Apify phone/website, fall back to OSM
        phone:        apifyMatch.phone        ?? osmLead.phone,
        website:      apifyMatch.website      ?? osmLead.website,
        openingHours: apifyMatch.openingHours ?? osmLead.openingHours,
        // Keep OSM id as canonical (it was found first)
        osmId: osmLead.osmId,
      });
      usedApifyKeys.add(key);
    } else {
      merged.push(osmLead);
    }
  }

  // Add Apify-only businesses (not found in OSM at all)
  for (const apifyLead of apifyLeads) {
    const key = normalise(apifyLead.name);
    if (!usedApifyKeys.has(key)) {
      merged.push(apifyLead);
    }
  }

  return merged;
}
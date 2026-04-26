/**
 * places.ts — OSM data fetching. Pure I/O, no scoring, no AI, no enrichment.
 *
 * Responsibilities:
 *   1. Geocode location string → lat/lng   (Nominatim)
 *   2. Fetch businesses by OSM tags        (Overpass API)
 *   3. Normalise raw elements → RawLead
 *
 * Tag resolution (any niche → OSM tags) is handled by tagResolver.ts.
 * All calls are server-side only — never imported by UI components.
 */

import { resolveOSMTags } from './tagResolver';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OVERPASS_URL  = 'https://overpass-api.de/api/interpreter';
const FETCH_LIMIT   = 30;
const SEARCH_RADIUS = 5000; // metres — wider net, route.ts caps final output

// ─── Types ────────────────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface RawLead {
  osmId: string;
  name: string;
  category: string;
  address: string;
  rating?: number;
  reviews?: number;
  phone?: string;
  website?: string;
  email?: string;
  openingHours?: string;
  location: { lat: number; lng: number };
}

// ─── Geocode ──────────────────────────────────────────────────────────────────

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number }> {
  const hasArabic = /[\u0600-\u06FF]/.test(location);
  const acceptLang = hasArabic ? 'ar' : 'en';
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=${encodeURIComponent(acceptLang)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LeadGeni-MVP/1.0 (contact@leadgeni.io)',
      'Accept-Language': acceptLang,
    },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

  const data: NominatimResult[] = await res.json();
  if (!data?.length) {
    throw new Error(`Location not found: "${location}". Try a more specific city name.`);
  }

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// ─── Overpass query builder ───────────────────────────────────────────────────

function buildOverpassQuery(tags: string[], lat: number, lng: number): string {
  const around = `(around:${SEARCH_RADIUS},${lat},${lng})`;

  const unions = tags
    .flatMap((tag) => {
      const eq = tag.indexOf('=');
      const k  = tag.slice(0, eq);
      const v  = tag.slice(eq + 1);
      return [
        `node[${k}=${v}]${around};`,
        `way[${k}=${v}]${around};`,
      ];
    })
    .join('\n  ');

  return `[out:json][timeout:30][maxsize:268435456];\n(\n  ${unions}\n);\nout center ${FETCH_LIMIT};`;
}

// ─── Overpass fetch ───────────────────────────────────────────────────────────

async function fetchFromOverpass(query: string): Promise<OverpassElement[]> {
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;
  console.log('[Overpass] query:\n', query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'LeadGeni-MVP/1.0' },
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(`Overpass error ${res.status}`);

  const data = await res.json();
  return (data.elements ?? []) as OverpassElement[];
}

// ─── Normalise OSM element → RawLead ─────────────────────────────────────────

function normaliseElement(el: OverpassElement): RawLead | null {
  const tags = el.tags ?? {};

  const name = tags['name'] || tags['name:en'] || tags['brand'];
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat === undefined || lng === undefined) return null;

  const addressParts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:quarter'],
    tags['addr:city']   || tags['addr:town'] || tags['addr:village'],
    tags['addr:country'],
  ].filter(Boolean);

  const address =
    addressParts.length > 0
      ? addressParts.join(', ')
      : `Near (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  const rawWebsite = tags['website'] || tags['contact:website'] || tags['url'];

  return {
    osmId:        `osm-${el.type}-${el.id}`,
    name,
    category:     deriveCategory(tags),
    address,
    phone:        tags['phone']         || tags['contact:phone']  || undefined,
    website:      rawWebsite            ? normaliseUrl(rawWebsite) : undefined,
    email:        tags['email']         || tags['contact:email']  || undefined,
    openingHours: tags['opening_hours']                           || undefined,
    location:     { lat, lng },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveCategory(tags: Record<string, string>): string {
  for (const key of ['amenity', 'shop', 'leisure', 'tourism', 'office', 'craft', 'man_made']) {
    if (tags[key]) return toTitleCase(tags[key].replace(/_/g, ' '));
  }
  return 'Business';
}

function toTitleCase(str: string): string {
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
}

function deduplicateByName(leads: RawLead[]): RawLead[] {
  const seen = new Set<string>();
  return leads.filter((l) => {
    const key = l.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches and normalises raw OSM business data.
 * Returns RawLead[] — no scores, no enrichment, no AI.
 */
export async function fetchRawLeads(query: string, location: string): Promise<RawLead[]> {
  // Run geocoding and tag resolution in parallel
  const [coords, tags] = await Promise.all([
    geocodeLocation(location),
    resolveOSMTags(query),
  ]);

  console.log(`[places] Tags for "${query}":`, tags);

  const oQuery   = buildOverpassQuery(tags, coords.lat, coords.lng);
  const elements = await fetchFromOverpass(oQuery);

  const leads = elements
    .map(normaliseElement)
    .filter((l): l is RawLead => l !== null);

  return deduplicateByName(leads);
}

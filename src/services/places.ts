/**
 * places.ts — Data fetching layer. Pure I/O, no scoring, no AI.
 *
 * Responsibilities (this file only):
 *   1. Geocode a location string → lat/lng  (Nominatim)
 *   2. Fetch matching businesses            (Overpass API)
 *   3. Normalise raw OSM elements → RawLead
 *
 * What this file does NOT do:
 *   - Score leads        → core/scoring.ts
 *   - Run AI analysis    → services/ai.ts
 *   - Merge AI results   → app/api/leads/route.ts
 *
 * All network calls are server-side only. This module is never imported
 * by any UI component — only by /app/api/leads/route.ts.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const FETCH_LIMIT = 25; // keep small to avoid Overpass timeouts

// ─── OSM category map ─────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string[]> = {
  gym: ['leisure=fitness_centre', 'leisure=sports_centre'],
  clinic: ['amenity=clinic', 'amenity=doctors', 'amenity=healthcare'],
  hospital: ['amenity=hospital'],
  dental: ['amenity=dentist'],
  pharmacy: ['amenity=pharmacy'],
  restaurant: ['amenity=restaurant'],
  cafe: ['amenity=cafe'],
  hotel: ['tourism=hotel'],
  school: ['amenity=school'],
  bank: ['amenity=bank'],
  salon: ['shop=hairdresser', 'shop=beauty'],
  supermarket: ['shop=supermarket'],
  bakery: ['shop=bakery'],
  mechanic: ['shop=car_repair'],
  lawyer: ['office=lawyer'],
  accountant: ['office=accountant'],
  it: ['office=it', 'office=company'],
  real_estate: ['office=estate_agent'],
  printing: ['shop=copyshop', 'shop=printer'],
  kindergarten: ['amenity=kindergarten'],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Normalised output from this layer — no scores yet */
export interface RawLead {
  osmId: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  openingHours?: string;
  // OSM does not supply ratings or reviews — these fields are intentionally absent
  location: { lat: number; lng: number };
}

// ─── Step 1: Geocode ──────────────────────────────────────────────────────────

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number }> {
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LeadGeni-MVP/1.0 (contact@leadgeni.io)',
      'Accept-Language': 'en',
    },
  });

  if (!res.ok) throw new Error(`Nominatim error ${res.status}: service unavailable`);

  const data: NominatimResult[] = await res.json();
  if (!data?.length) {
    throw new Error(`Location not found: "${location}". Try a city name or add a country.`);
  }

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// ─── Step 2: Build + run Overpass query ──────────────────────────────────────

function buildOverpassQuery(query: string, lat: number, lng: number, radiusM = 3000): string {
  const lower = query.toLowerCase();
  const matchedKey = Object.keys(CATEGORY_MAP).find((k) => lower.includes(k));
  const tagFilters = matchedKey ? CATEGORY_MAP[matchedKey] : [`name~"${query}",i`];

  const around = `(around:${radiusM},${lat},${lng})`;

  const unions = tagFilters
    .flatMap((tag) => {
      const eqIdx = tag.indexOf('=');
      if (eqIdx !== -1) {
        const k = tag.slice(0, eqIdx);
        const v = tag.slice(eqIdx + 1);
        return [`node[${k}=${v}]${around};`, `way[${k}=${v}]${around};`];
      }
      return [`node[${tag}]${around};`, `way[${tag}]${around};`];
    })
    .join('\n  ');

  return `[out:json][timeout:30][maxsize:536870912];\n(\n  ${unions}\n);\nout center ${FETCH_LIMIT};`;
}

async function fetchFromOverpass(query: string): Promise<OverpassElement[]> {
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;
  console.log('[Overpass] Query URL:', url);
  console.log('[Overpass] Raw query:\n', query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 29_000); // 29s client timeout

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

  if (!res.ok) throw new Error(`Overpass error ${res.status}: try again shortly`);

  const data = await res.json();
  return (data.elements ?? []) as OverpassElement[];
}

// ─── Step 3: Normalise OSM element → RawLead ─────────────────────────────────

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
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:country'],
  ].filter(Boolean);

  const address =
    addressParts.length > 0
      ? addressParts.join(', ')
      : `Near (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  const rawWebsite = tags['website'] || tags['contact:website'] || tags['url'];

  return {
    osmId: `osm-${el.type}-${el.id}`,
    name,
    category: deriveCategory(tags),
    address,
    phone: tags['phone'] || tags['contact:phone'] || undefined,
    website: rawWebsite ? normaliseUrl(rawWebsite) : undefined,
    email: tags['email'] || tags['contact:email'] || undefined,
    openingHours: tags['opening_hours'] || undefined,
    location: { lat, lng },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveCategory(tags: Record<string, string>): string {
  for (const key of ['shop', 'amenity', 'leisure', 'tourism', 'office', 'craft']) {
    if (tags[key]) return toTitleCase(tags[key].replace(/_/g, ' '));
  }
  return 'Business';
}

function toTitleCase(str: string): string {
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function normaliseUrl(raw: string): string {
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
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
 * Fetches and normalises raw business data from OpenStreetMap.
 * Returns RawLead[] — no scores, no AI. Scoring happens in route.ts.
 */
export async function fetchRawLeads(query: string, location: string): Promise<RawLead[]> {
  const coords = await geocodeLocation(location);
  const oQuery = buildOverpassQuery(query, coords.lat, coords.lng);
  const elements = await fetchFromOverpass(oQuery);

  const leads = elements
    .map(normaliseElement)
    .filter((l): l is RawLead => l !== null);

  return deduplicateByName(leads);
}
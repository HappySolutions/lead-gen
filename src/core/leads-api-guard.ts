import type { Lead, LeadSortBy, LeadsApiResponse } from '@/core/types';

const SORT_VALUES: LeadSortBy[] = ['score', 'rating', 'reviews', 'name'];

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function isLeadSortBy(s: unknown): s is LeadSortBy {
  return typeof s === 'string' && (SORT_VALUES as string[]).includes(s);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Geo payload required by map/cards — reject missing or NaN lat/lng. */
function isValidLeadLocation(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  const lat = v.lat;
  const lng = v.lng;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

/** Rows must be render-safe: identity, score, and location are mandatory for the UI. */
function isLeadRow(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return false;
  if (!isFiniteNumber(v.score)) return false;
  if (!isValidLeadLocation(v.location)) return false;
  return true;
}

/**
 * Same query shape as `pushSearchParams` / GET `/api/leads` — use for router.replace and fetch to avoid drift.
 */
export function buildLeadsSearchURLSearchParams(params: {
  q: string;
  loc: string;
  service: string;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  minRating: number;
  sortBy: LeadSortBy;
  page: number;
  limit: number;
}): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set('q', params.q);
  qs.set('loc', params.loc);
  if (params.service) qs.set('service', params.service);
  if (params.hasWebsite) qs.set('hasWebsite', '1');
  if (params.hasPhone) qs.set('hasPhone', '1');
  if (params.hasEmail) qs.set('hasEmail', '1');
  if (params.minRating > 0) qs.set('minRating', String(params.minRating));
  if (params.sortBy !== 'score') qs.set('sortBy', params.sortBy);
  if (params.page > 1) qs.set('page', String(params.page));
  if (params.limit !== 20) qs.set('limit', String(params.limit));
  return qs;
}

/**
 * Runtime guard for `/api/leads` JSON (no Zod). Returns `null` if shape is invalid.
 */
export function parseLeadsApiResponse(json: unknown): LeadsApiResponse | null {
  if (!isPlainObject(json)) return null;
  const itemsRaw = json.items;
  const metaRaw = json.meta;
  if (!Array.isArray(itemsRaw) || !isPlainObject(metaRaw)) return null;

  const items: Lead[] = [];
  for (const row of itemsRaw) {
    if (!isLeadRow(row)) return null;
    items.push(row as Lead);
  }

  const {
    page,
    limit,
    total,
    totalPages,
    sortBy: sortByRaw,
    minRating,
    hasWebsite,
    hasPhone,
    hasEmail,
    query,
    location,
    service,
  } = metaRaw;

  if (
    !isFiniteNumber(page) ||
    !isFiniteNumber(limit) ||
    !isFiniteNumber(total) ||
    !isFiniteNumber(totalPages) ||
    !isFiniteNumber(minRating) ||
    !isLeadSortBy(sortByRaw) ||
    typeof hasWebsite !== 'boolean' ||
    typeof hasPhone !== 'boolean' ||
    typeof hasEmail !== 'boolean' ||
    typeof query !== 'string' ||
    typeof location !== 'string' ||
    typeof service !== 'string'
  ) {
    return null;
  }

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      sortBy: sortByRaw,
      minRating,
      hasWebsite,
      hasPhone,
      hasEmail,
      query,
      location,
      service,
    },
  };
}

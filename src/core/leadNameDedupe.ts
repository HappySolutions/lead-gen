/**
 * Single source of truth for name keys used when deduplicating leads
 * across OSM / Apify (see mergeLeads) and within OSM-only lists (see places deduplicateByName).
 */
export function normaliseLeadNameForDedupe(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '').trim();
}

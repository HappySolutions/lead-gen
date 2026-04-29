# Epic 2 — Leads API filtering and type consistency

This document describes server-side filtering, response shape, and the shared client guard introduced for Epic 2. It stays in sync with `src/app/api/leads/route.ts`, `src/core/leads-api-guard.ts`, `src/core/types.ts`, and `src/app/home-content.tsx`.

## `GET /api/leads`

### Query parameters

| Parameter     | Type / values | Notes |
|---------------|-----------------|-------|
| `q`           | string          | Search query (required for meaningful results). |
| `loc`         | string          | Location label. |
| `service`     | string          | Optional service filter. |
| `hasWebsite`  | `1` / `true` / `yes` (case-insensitive) | When set, only leads with a `website` URL are kept. |
| `hasPhone`    | same            | Requires `phone`. |
| `hasEmail`    | same            | Requires `email`. |
| `minRating`   | number          | Minimum star rating; non-finite lead ratings are treated as **0** for comparison and sorting. |
| `sortBy`      | `score` \| `rating` \| `reviews` \| `name` | Server-side sort after filters. `score`, `rating`, and `reviews` use **finite-safe** comparators (NaN/undefined → 0) so ordering is stable. |
| `page`        | integer ≥ 1     | Pagination after filter+sort. |
| `limit`       | integer         | Capped by handler (`MAX_LIMIT`); default 20. |

Omitted boolean flags are **false**. The handler parses booleans via `parseBoolParam` (see `route.ts`).

### Pipeline and caps

1. Discovery and enrichment run as before (places, Apify, enrichment, AI where applicable).
2. **`buildLeadsPayload`** applies filters → sort → pagination slice.
3. A hard pool cap **`MAX_RESULTS`** limits candidates **before** pagination; this is a product/cost boundary (documented in `route.ts`), not part of Epic 2 pagination scope.

### Response shape (`LeadsApiResponse`)

- **`items`**: `Lead[]` after filters, sort, and page slice.
- **`meta`**: Echoes the effective filter and pagination state, including:
  - `hasWebsite`, `hasPhone`, `hasEmail` (booleans)
  - `minRating`, `sortBy`, `page`, `limit`, `total`, `totalPages`
  - `query`, `location`, `service`

Types live in `src/core/types.ts` (`LeadsResponseMeta`, `SearchQueryParams`).

## Client guard — `src/core/leads-api-guard.ts`

### `buildLeadsSearchURLSearchParams`

Builds the same query string shape used for **`fetch('/api/leads?...')`** and **`router.replace`** / URL sync on the home page. Use this helper anywhere you need to avoid drift between the browser URL and the API.

### `parseLeadsApiResponse(json: unknown)`

Runtime validation of `/api/leads` JSON (no Zod):

- Requires top-level `items` (array) and `meta` (object).
- Each row must satisfy **`isLeadRow`**: string `id`/`name`, finite `score`, and `location` with finite `lat`/`lng`.
- Returns **`LeadsApiResponse | null`**; the UI treats `null` as an error/invalid payload.

## UI contract

`home-content.tsx` uses `parseLeadsApiResponse` instead of unchecked casts, clears stale `leads` / `total` when a new request starts, and keeps URL parameters aligned with `buildLeadsSearchURLSearchParams` and `useEffect` dependencies on the full filter object.

## Related files

| File | Role |
|------|------|
| `src/app/api/leads/route.ts` | Query parsing, `buildLeadsPayload`, finite-safe sorts, `MAX_RESULTS`. |
| `src/core/leads-api-guard.ts` | `buildLeadsSearchURLSearchParams`, `parseLeadsApiResponse`. |
| `src/core/types.ts` | `LeadSortBy`, `LeadsResponseMeta`, `SearchQueryParams`. |
| `src/app/home-content.tsx` | Fetch, URL sync, empty/loading states. |

# ARCHITECTURE

## Overview
This repository is a Next.js App Router application for lead generation.
It combines local business discovery, enrichment, scoring, and outreach hints.

## High-Level Layers
- `src/app`: routing, pages, API route handlers.
- `src/services`: external providers and domain services.
- `src/core`: shared business logic, types, i18n, theme state.
- `src/ui/components`: reusable UI blocks.
- `src/lib`: Supabase clients for browser/server contexts.
- `src/supabase/migrations`: schema and policy definition.

## Request and Data Flow
1. User submits search from `src/app/page.tsx`.
2. Client calls `GET /api/leads`.
3. `src/app/api/leads/route.ts` validates session and usage limits.
4. Services gather and enrich lead data:
   - `src/services/places.ts`
   - `src/services/apify.ts`
   - `src/services/enrichment.ts`
   - `src/services/ai.ts`
5. Scoring logic from `src/core/scoring.ts` ranks opportunities.
6. API returns normalized lead payload to UI.
7. UI applies local filters/sorting and renders cards/details.

## Auth and Access Flow
1. Middleware gate in `src/middleware.ts` redirects unauthenticated users to `/login`.
2. Login/signup handled in `src/app/login/page.tsx`.
3. Email callback handled by `src/app/auth/callback/route.ts`.
4. User profile loaded through `/api/user/profile` and Supabase clients.

## State and UI Model
- Main page is client-driven with local React state.
- i18n context from `src/core/i18n/useTranslation.tsx`.
- theme context from `src/core/theme/useTheme.tsx`.
- UI composed from `src/ui/components/*`.

## Boundary Rules
1. `services` must not depend on UI components.
2. `ui/components` must not implement data provider logic.
3. `core` should remain reusable and side-effect-light.
4. `app/api` owns orchestration and response shaping.

## Architecture Change Policy
Any change that alters layer boundaries, request flow, or ownership must update this file in the same task.

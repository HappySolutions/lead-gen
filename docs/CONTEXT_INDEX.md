# CONTEXT_INDEX

## Purpose
Task-to-context map. Use this file to decide mandatory reads before any change.

## Global Mandatory
- `docs/AI_HANDOFF.md`
- `docs/TASKING.md`
- `docs/GIT_WORKFLOW.md`
- `docs/TESTING.md` (when adding or changing automated tests)

## Task Type -> Required Context

### UI or UX Changes
- Mandatory:
  - `src/app/page.tsx`
  - `src/ui/components/*`
  - `src/app/globals.css`
  - `src/core/i18n/dictionaries.ts`
- Optional:
  - `src/core/theme/useTheme.tsx`

### API / Server Logic
- Mandatory:
  - `src/app/api/leads/route.ts`
  - `src/services/places.ts`
  - `src/services/apify.ts`
  - `src/services/enrichment.ts`
  - `src/services/ai.ts`
  - `docs/ARCHITECTURE.md`
  - `docs/EPIC2_LEADS_API.md` (leads query contract, filters, guard)
- Optional:
  - `src/core/scoring.ts`
  - `src/core/leads-api-guard.ts`

### Auth / Session / Access
- Mandatory:
  - `src/middleware.ts`
  - `src/app/login/page.tsx`
  - `src/app/auth/callback/route.ts`
  - `src/lib/supabase.server.ts`
  - `src/lib/supabase.browser.ts`
  - `docs/DATABASE.md`

### Database / Migration
- Mandatory:
  - `src/supabase/migrations/001_user_profiles.sql`
  - `docs/DATABASE.md`
  - `docs/ARCHITECTURE.md`

### i18n or RTL/LTR Behavior
- Mandatory:
  - `src/core/i18n/useTranslation.tsx`
  - `src/core/i18n/dictionaries.ts`
  - UI files touched by task

### Theme / Visual Tokens
- Mandatory:
  - `src/core/theme/useTheme.tsx`
  - `src/app/globals.css`

### Process / Governance / Team Rules
- Mandatory:
  - `docs/TASKING.md`
  - `docs/GIT_WORKFLOW.md`
  - `AGENTS.md`

## Reading Priority
1. Safety and process docs.
2. Directly affected feature files.
3. Adjacent integration files.
4. Optional context only if needed.

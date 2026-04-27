# DATABASE

## Source of Truth
- SQL migration file: `src/supabase/migrations/001_user_profiles.sql`
- Runtime access: Supabase via server/browser clients in `src/lib`.

## Current Data Model

### Table: `public.user_profiles`
- `id uuid primary key` -> references `auth.users(id)` with `ON DELETE CASCADE`.
- `email text` (nullable)
- `is_paid boolean default false`
- `searches_used integer default 0`
- `searches_limit integer default 3`
- `created_at timestamp with time zone default timezone('utc', now()) not null`

## Purpose of Core Fields
- `is_paid`: differentiates free vs paid experience.
- `searches_used`: tracks consumed free searches.
- `searches_limit`: configurable search cap for free plan.

## Access Control (RLS)
RLS is enabled on `user_profiles` with policies allowing users to:
- select their own row (`auth.uid() = id`)
- update their own row (`auth.uid() = id`)

No cross-user read/write is allowed by policy.

## Automation
- Trigger function creates profile row after a new auth user is created.
- Trigger runs on `auth.users` insert.

## Application Usage
- `/api/user/profile` reads/creates the profile as needed.
- `/api/leads` checks plan and usage counters before serving full functionality.

## Migration and Consistency Rules
1. Any schema change requires a new migration file under `src/supabase/migrations`.
2. Any policy/trigger change must be documented here in the same task.
3. App behavior depending on profile fields must stay consistent with this document.

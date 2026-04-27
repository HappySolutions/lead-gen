# AI_HANDOFF

## Purpose
This is the strict entrypoint for any agent before touching code in this repository.
If a task conflicts with this document, stop and escalate to the task owner.

## Product Snapshot
- Product: B2B lead generation web app.
- Stack: Next.js App Router + TypeScript + Supabase Auth + Postgres.
- Core promise: search and rank local business leads, enrich contact data, and provide outreach hints.

## Mandatory Pre-Execution Reads
Read in this order before implementation:
1. `docs/CONTEXT_INDEX.md`
2. `docs/TASKING.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATABASE.md`
5. `docs/GIT_WORKFLOW.md`

## Hard Rules
1. Do not start coding before a clear task scope exists.
2. Do not change architecture boundaries without a documented task decision.
3. Do not modify database behavior without migration + docs sync.
4. Do not ship changes without documentation sync in `docs/`.
5. Keep changes minimal, scoped, and reversible.

## Prohibited Actions
- No direct work on `main`.
- No undocumented breaking changes.
- No hidden behavior changes in auth, billing gates, or lead scoring.
- No schema drift between SQL migrations and `docs/DATABASE.md`.

## Required Output Discipline
- Every completed task must include:
  - what changed,
  - why it changed,
  - what docs were updated.
- If docs were not updated, task is incomplete.

## Escalation Triggers
Escalate before implementation when:
- task is ambiguous,
- expected behavior conflicts with current architecture,
- request implies data model or auth policy changes without explicit approval.

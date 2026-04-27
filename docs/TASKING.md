# TASKING

## Purpose
Enforce a predictable execution lifecycle and mandatory doc sync for every task.

## Task Lifecycle

### 1) Intake
- Confirm task goal, scope, and constraints.
- Identify impacted layer: UI, API, Auth, DB, workflow, or docs.
- Resolve ambiguity before implementation.

### 2) Context Load
- Use `docs/CONTEXT_INDEX.md` to load mandatory files.
- Record assumptions explicitly inside task notes.

### 3) Plan
- Define minimal change set.
- Define verification approach.
- Define required documentation updates.

### 4) Execute
- Implement only scoped changes.
- Keep boundaries intact (`app`, `services`, `core`, `ui`, `lib`).

### 5) Validate
- Run relevant checks (lint/build/test if available).
- Verify user-facing behavior against task objective.

### 6) Documentation Sync (Required)
- Update impacted docs in `docs/` within the same task.
- No docs sync means task is not done.

### 7) Handoff
- Summarize: change, reason, validation, docs touched.

## Mandatory Sync Rules
1. Architecture-impacting change -> update `docs/ARCHITECTURE.md`.
2. Data model/policy change -> update `docs/DATABASE.md`.
3. Process change -> update `docs/GIT_WORKFLOW.md` and/or `docs/AI_HANDOFF.md`.
4. Prompting or instruction pattern change -> update `docs/PROMPTING_RULES.md`.

## Scope Control
- Reject silent scope creep.
- Split large tasks into smaller atomic tasks.
- Keep each task independently reviewable.

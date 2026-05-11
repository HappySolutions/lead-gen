<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Operating Entry

Before any implementation, read and follow these files in order:
1. `docs/AI_HANDOFF.md`
2. `docs/CONTEXT_INDEX.md`
3. `docs/TASKING.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATABASE.md`
6. `docs/GIT_WORKFLOW.md`

Prompting conventions and execution templates:
- `docs/PROMPTING_RULES.md`

Non-negotiable:
- No direct feature work on `main`.
- All new work via feature branch from `dev`.
- PR target must be `dev`.
- Documentation sync is required with code changes.

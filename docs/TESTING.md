# Testing (lead-gen)

## Stack

- **Unit + integration:** [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) where UI is tested. Config: [vitest.config.ts](../vitest.config.ts), setup: [vitest.setup.ts](../vitest.setup.ts).
- **End-to-end:** [Playwright](https://playwright.dev/). Config: [e2e/playwright.config.ts](../e2e/playwright.config.ts), specs under [e2e/specs/](../e2e/specs/).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run test` | Vitest once (unit + integration). |
| `npm run test:watch` | Vitest watch mode. |
| `npm run test:e2e` | Playwright (starts `npm run dev` unless CI reuses server). |
| `npm run test:e2e:ui` | Playwright UI mode. |

## CI

GitHub Actions workflow [.github/workflows/ci.yml](../.github/workflows/ci.yml) runs **lint**, **Vitest**, **Next build**, then **Playwright** on `chromium`.

E2E exercises the real Next server (including `src/proxy.ts`). Repository **Secrets** must define:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

so the dev server can refresh the session cookie without crashing. If these are missing in CI, the E2E job will fail until they are configured.

## Layout

- Colocated unit tests: `src/**/*.test.ts(x)`.
- Integration tests and shared mocks: `tests/integration/`, `tests/mocks/`.
- E2E specs and fixtures: `e2e/specs/`, `e2e/fixtures/`.

See also [docs/EPIC2_LEADS_API.md](./EPIC2_LEADS_API.md) for the leads API contract under test.

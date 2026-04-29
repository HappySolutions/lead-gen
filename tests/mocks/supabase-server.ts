import { vi } from 'vitest';

export type MockProfile = {
  is_paid: boolean;
  searches_used: number;
  searches_limit: number;
};

/**
 * Matches `createServerClient` usage in `/api/leads`: `getSession`, then
 * `from('user_profiles').select(...).eq(...).single()` and optional `update().eq()`.
 */
export function createSupabaseClientMock(opts: {
  session?: { user: { id: string } } | null;
  profile: MockProfile | null;
}) {
  const session = opts.session === undefined ? { user: { id: 'test-user-id' } } : opts.session;
  const getSession = vi.fn().mockResolvedValue({
    data: { session },
  });

  const single = vi.fn().mockResolvedValue({ data: opts.profile });
  const eqAfterSelect = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq: eqAfterSelect });

  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });

  const from = vi.fn().mockReturnValue({
    select,
    update,
  });

  return { auth: { getSession }, from };
}

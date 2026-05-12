import { expect, test } from '@playwright/test';

test.describe('/api/leads without session', () => {
  test('returns 401 for authenticated-only resource', async ({ request }) => {
    const res = await request.get('/api/leads?q=gyms&loc=Cairo');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({ error: expect.stringMatching(/not authenticated/i) });
  });

  test('returns 400 when required query params are missing', async ({ request }) => {
    const res = await request.get('/api/leads?q=only');
    expect(res.status()).toBe(400);
  });
});

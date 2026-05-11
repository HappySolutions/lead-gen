import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Lead } from '@/core/types';
import { createSupabaseClientMock } from '../mocks/supabase-server';

const hoisted = vi.hoisted(() => ({
  finalGet: vi.fn(),
  finalSet: vi.fn(),
  osmGet: vi.fn(),
  osmSet: vi.fn(),
  apifyGet: vi.fn(),
  apifySet: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  finalResultsCache: {
    get: hoisted.finalGet,
    set: hoisted.finalSet,
  },
  apifyRawCache: {
    get: hoisted.apifyGet,
    set: hoisted.apifySet,
  },
  osmRawCache: {
    get: hoisted.osmGet,
    set: hoisted.osmSet,
  },
}));

vi.mock('@/lib/supabase.server', () => ({
  createServerClient: hoisted.createServerClient,
}));

import { GET } from '@/app/api/leads/route';

function minimalCachedLead(): Lead {
  return {
    id: 'cached-1',
    name: 'Cached Lead',
    category: 'gym',
    address: '1 St',
    location: { lat: 29.9, lng: 31.1 },
    rating: 4.5,
    score: 50,
    scoreLabel: 'Medium',
    scoreExplanation: 'ok',
    website: 'https://example.com',
  };
}

function requestWithSearch(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'));
}

describe('GET /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.createServerClient.mockReset();
    hoisted.finalGet.mockResolvedValue(null);
    hoisted.osmGet.mockResolvedValue(null);
    hoisted.apifyGet.mockResolvedValue(null);
  });

  it('returns 400 when q is missing', async () => {
    const res = await GET(requestWithSearch('http://localhost/api/leads?loc=Cairo'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing required params/i);
  });

  it('returns 400 when loc is missing', async () => {
    const res = await GET(requestWithSearch('http://localhost/api/leads?q=gyms'));
    expect(res.status).toBe(400);
  });

  it('returns 401 when there is no session', async () => {
    hoisted.createServerClient.mockResolvedValue(
      createSupabaseClientMock({ session: null, profile: null }) as never,
    );
    const res = await GET(requestWithSearch('http://localhost/api/leads?q=gyms&loc=Cairo'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Not authenticated/i);
  });

  it('returns 404 when profile row is missing', async () => {
    hoisted.createServerClient.mockResolvedValue(
      createSupabaseClientMock({ profile: null }) as never,
    );
    const res = await GET(requestWithSearch('http://localhost/api/leads?q=gyms&loc=Cairo'));
    expect(res.status).toBe(404);
  });

  it('returns 403 when free tier search limit is reached', async () => {
    hoisted.createServerClient.mockResolvedValue(
      createSupabaseClientMock({
        profile: { is_paid: false, searches_used: 10, searches_limit: 10 },
      }) as never,
    );
    const res = await GET(requestWithSearch('http://localhost/api/leads?q=gyms&loc=Cairo'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('SEARCH_LIMIT_REACHED');
  });

  it('returns 200 with X-Cache HIT when finalResultsCache has data', async () => {
    hoisted.createServerClient.mockResolvedValue(
      createSupabaseClientMock({
        profile: { is_paid: true, searches_used: 0, searches_limit: 50 },
      }) as never,
    );
    hoisted.finalGet.mockResolvedValue([minimalCachedLead()]);

    const res = await GET(
      requestWithSearch(
        'http://localhost/api/leads?q=gyms&loc=Cairo&hasWebsite=1&minRating=3&sortBy=rating&page=1',
      ),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.meta.query).toBe('gyms');
    expect(body.meta.location).toBe('Cairo');
    expect(body.meta.hasWebsite).toBe(true);
    expect(body.meta.minRating).toBe(3);
    expect(body.meta.sortBy).toBe('rating');
  });
});

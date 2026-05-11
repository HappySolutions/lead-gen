import { describe, expect, it } from 'vitest';
import { buildLeadsSearchURLSearchParams, parseLeadsApiResponse } from './leads-api-guard';
import type { Lead } from './types';

const baseMeta = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  sortBy: 'score' as const,
  minRating: 0,
  hasWebsite: false,
  hasPhone: false,
  hasEmail: false,
  query: 'q',
  location: 'loc',
  service: '',
};

function minimalLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    name: 'Acme Gym',
    category: 'gym',
    address: '1 Main St',
    location: { lat: 30.0, lng: 31.0 },
    score: 72,
    scoreLabel: 'High Potential',
    scoreExplanation: 'Strong fit',
    ...overrides,
  };
}

describe('buildLeadsSearchURLSearchParams', () => {
  const base = {
    q: 'gyms',
    loc: 'Cairo',
    service: 'pt',
    hasWebsite: true,
    hasPhone: false,
    hasEmail: true,
    minRating: 4,
    sortBy: 'rating' as const,
    page: 2,
    limit: 10,
  };

  it('sets q, loc, service, flags, minRating, sortBy, page, limit', () => {
    const qs = buildLeadsSearchURLSearchParams(base);
    expect(qs.get('q')).toBe('gyms');
    expect(qs.get('loc')).toBe('Cairo');
    expect(qs.get('service')).toBe('pt');
    expect(qs.get('hasWebsite')).toBe('1');
    expect(qs.get('hasEmail')).toBe('1');
    expect(qs.get('hasPhone')).toBeNull();
    expect(qs.get('minRating')).toBe('4');
    expect(qs.get('sortBy')).toBe('rating');
    expect(qs.get('page')).toBe('2');
    expect(qs.get('limit')).toBe('10');
  });

  it('omits default sortBy score and default page 1 and default limit 20', () => {
    const qs = buildLeadsSearchURLSearchParams({
      ...base,
      sortBy: 'score',
      page: 1,
      limit: 20,
    });
    expect(qs.get('sortBy')).toBeNull();
    expect(qs.get('page')).toBeNull();
    expect(qs.get('limit')).toBeNull();
  });

  it('omits minRating when zero', () => {
    const qs = buildLeadsSearchURLSearchParams({ ...base, minRating: 0 });
    expect(qs.get('minRating')).toBeNull();
  });

  it('omits empty service', () => {
    const qs = buildLeadsSearchURLSearchParams({ ...base, service: '' });
    expect(qs.get('service')).toBeNull();
  });
});

describe('parseLeadsApiResponse', () => {
  it('parses valid payload', () => {
    const json = {
      items: [minimalLead()],
      meta: baseMeta,
    };
    const parsed = parseLeadsApiResponse(json);
    expect(parsed).not.toBeNull();
    expect(parsed?.items).toHaveLength(1);
    expect(parsed?.meta.query).toBe('q');
  });

  it('returns null for non-object root', () => {
    expect(parseLeadsApiResponse(null)).toBeNull();
    expect(parseLeadsApiResponse([])).toBeNull();
    expect(parseLeadsApiResponse('x')).toBeNull();
  });

  it('returns null when items is not an array', () => {
    expect(parseLeadsApiResponse({ items: {}, meta: baseMeta })).toBeNull();
  });

  it('returns null when meta is not an object', () => {
    expect(parseLeadsApiResponse({ items: [], meta: [] })).toBeNull();
  });

  it('returns null when a row has NaN score', () => {
    const bad = {
      items: [{ ...minimalLead(), score: Number.NaN }],
      meta: baseMeta,
    };
    expect(parseLeadsApiResponse(bad)).toBeNull();
  });

  it('returns null when location lat is NaN', () => {
    const bad = {
      items: [minimalLead({ location: { lat: Number.NaN, lng: 1 } })],
      meta: baseMeta,
    };
    expect(parseLeadsApiResponse(bad)).toBeNull();
  });

  it('returns null when meta sortBy is invalid', () => {
    const bad = {
      items: [minimalLead()],
      meta: { ...baseMeta, sortBy: 'bogus' },
    };
    expect(parseLeadsApiResponse(bad)).toBeNull();
  });

  it('returns null when meta booleans are wrong type', () => {
    const bad = {
      items: [minimalLead()],
      meta: { ...baseMeta, hasWebsite: 'yes' },
    };
    expect(parseLeadsApiResponse(bad)).toBeNull();
  });
});

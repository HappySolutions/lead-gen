import { describe, expect, it } from 'vitest';
import { mergeLeads } from './apify';
import type { RawLead } from './places';

const loc = { lat: 30.04, lng: 31.22 };

function lead(p: Partial<RawLead> & Pick<RawLead, 'osmId' | 'name'>): RawLead {
  return {
    category: 'Restaurant',
    address: '1 Test St',
    location: loc,
    ...p,
  };
}

describe('mergeLeads', () => {
  it('returns OSM only when Apify is empty', () => {
    const osm = [lead({ osmId: 'n1', name: 'Foo Bar' })];
    expect(mergeLeads(osm, [])).toEqual(osm);
  });

  it('returns Apify only when OSM is empty', () => {
    const apify = [lead({ osmId: 'gmaps-1', name: 'Only Gmaps' })];
    expect(mergeLeads([], apify)).toEqual(apify);
  });

  it('merges same normalised name: Apify fields win, osmId kept from OSM', () => {
    const osm = lead({
      osmId: 'n-100',
      name: 'ACME Restaurant!!',
      phone: '+201111',
      website: undefined,
      rating: undefined,
    });
    const apify = lead({
      osmId: 'gmaps-x',
      name: 'ACME  Restaurant',
      phone: '+209999',
      website: 'https://example.com',
      rating: 4.5,
      reviews: 12,
    });
    const out = mergeLeads([osm], [apify]);
    expect(out).toHaveLength(1);
    expect(out[0].osmId).toBe('n-100');
    expect(out[0].phone).toBe('+209999');
    expect(out[0].website).toBe('https://example.com');
    expect(out[0].rating).toBe(4.5);
    expect(out[0].reviews).toBe(12);
  });

  it('keeps OSM-only and appends Apify-only rows', () => {
    const osmOnly = lead({ osmId: 'n1', name: 'OSM Unique' });
    const bothOsm = lead({ osmId: 'n2', name: 'Shared Name' });
    const bothApify = lead({
      osmId: 'g1',
      name: 'shared name',
      rating: 5,
    });
    const apifyOnly = lead({ osmId: 'g2', name: 'Gmaps Only' });

    const out = mergeLeads([osmOnly, bothOsm], [bothApify, apifyOnly]);
    const names = out.map((l) => l.name);
    expect(names).toContain('OSM Unique');
    expect(names).toContain('Gmaps Only');
    expect(out.filter((l) => l.name.toLowerCase().includes('shared'))).toHaveLength(1);
    expect(out.find((l) => l.name === 'shared name')?.rating).toBe(5);
  });

  it('does not duplicate when OSM list has same normalised name twice (pre-merge consumer should dedupe OSM first)', () => {
    const osmDup = [
      lead({ osmId: 'n1', name: 'Same!!' }),
      lead({ osmId: 'n2', name: 'Same' }),
    ];
    const apify: RawLead[] = [];
    const out = mergeLeads(osmDup, apify);
    // mergeLeads does not collapse two OSM-only dupes — places deduplicateByName handles OSM list
    expect(out).toHaveLength(2);
  });
});

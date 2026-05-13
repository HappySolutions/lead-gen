import { describe, expect, it } from 'vitest';
import { normaliseLeadNameForDedupe } from './leadNameDedupe';

describe('normaliseLeadNameForDedupe', () => {
  it('strips punctuation and case for Latin', () => {
    expect(normaliseLeadNameForDedupe('Café Roma!')).toBe('cafroma');
    expect(normaliseLeadNameForDedupe('  Cafe   Roma  ')).toBe('caferoma');
  });

  it('preserves Arabic letters', () => {
    expect(normaliseLeadNameForDedupe('مطعم الأمل')).toBe('مطعمالأمل');
  });
});

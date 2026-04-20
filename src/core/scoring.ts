/**
 * scoring.ts — Pure scoring logic. No I/O, no side effects.
 *
 * Score breakdown (all from real data only):
 *   - Email found        → +35 pts  (highest: email = direct outreach)
 *   - Phone found        → +20 pts
 *   - Website found      → +15 pts
 *   - Social links found → +15 pts  (LinkedIn, Instagram, etc.)
 *   - Description found  → +10 pts  (signals a maintained web presence)
 *   - Opening hours      → + 5 pts
 *
 * Total max = 100. Every point comes from a real field — nothing is assumed.
 */

import { Lead, ScoreLabel } from './types';

interface ScoringField {
  key: keyof Lead | 'socialLinks';
  points: number;
  label: string;
}

const SCORING_FIELDS: ScoringField[] = [
  { key: 'email', points: 35, label: 'Email' },
  { key: 'phone', points: 20, label: 'Phone' },
  { key: 'website', points: 15, label: 'Website' },
  { key: 'socialLinks', points: 15, label: 'Social' },
  { key: 'description', points: 10, label: 'Description' },
  { key: 'openingHours', points: 5, label: 'Hours' },
];

export interface BaseScoreResult {
  score: number;
  explanation: string;
}

export function calculateBaseScore(lead: Partial<Lead>): BaseScoreResult {
  let score = 0;
  const factors: string[] = [];

  for (const field of SCORING_FIELDS) {
    let hasValue = false;

    if (field.key === 'socialLinks') {
      const sl = lead.socialLinks;
      hasValue = !!(sl && Object.values(sl).some(Boolean));
    } else {
      const val = lead[field.key as keyof Lead];
      hasValue = !!(val && String(val).trim().length > 0);
    }

    if (hasValue) {
      score += field.points;
      factors.push(field.label);
    }
  }

  return {
    score: Math.min(100, score),
    explanation: factors.length > 0 ? factors.join(' • ') : 'Basic listing',
  };
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 70) return 'High Potential';
  if (score >= 35) return 'Medium';
  return 'Low';
}

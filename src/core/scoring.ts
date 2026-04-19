/**
 * scoring.ts — Pure scoring logic, no I/O, no side effects.
 *
 * Responsibilities:
 *   - calculateBaseScore()  → 0–100 score from real lead fields only
 *   - applyAIScore()        → merges an optional AI score into the base score
 *   - getScoreLabel()       → maps numeric score to a label
 *
 * Rules:
 *   - NEVER generate or assume fake values
 *   - If a field is absent → it simply doesn't contribute to the score
 *   - If AI score is absent → AI weight is redistributed to completeness
 */

import { Lead, ScoreLabel } from './types';

// ─── Weight configuration ─────────────────────────────────────────────────────

interface ScoringWeights {
  completeness: number; // presence of phone, website, address, hours
  quality: number;      // rating + review count (only when real data exists)
  ai: number;           // AI qualitative score (only when AI ran successfully)
}

// Base weights — must sum to 1.0
const BASE_WEIGHTS: ScoringWeights = {
  completeness: 0.55,
  quality: 0.25,
  ai: 0.20,
};

// ─── Completeness sub-scoring ─────────────────────────────────────────────────

interface CompletenessField {
  key: keyof Lead;
  weight: number; // relative weight within completeness score (must sum to 1.0)
  label: string;
}

const COMPLETENESS_FIELDS: CompletenessField[] = [
  { key: 'address', weight: 0.30, label: 'Address' },
  { key: 'phone', weight: 0.30, label: 'Phone' },
  { key: 'website', weight: 0.25, label: 'Website' },
  { key: 'openingHours', weight: 0.15, label: 'Hours' },
];

function scoreCompleteness(lead: Partial<Lead>): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  for (const field of COMPLETENESS_FIELDS) {
    const val = lead[field.key];
    if (val && String(val).trim().length > 0) {
      score += field.weight * 100;
      factors.push(field.label);
    }
  }

  return { score, factors };
}

// ─── Quality sub-scoring (rating + reviews) ───────────────────────────────────

function scoreQuality(lead: Partial<Lead>): { score: number; hasData: boolean; factors: string[] } {
  const factors: string[] = [];
  let ratingScore = 0;
  let reviewScore = 0;
  let hasRating = false;
  let hasReviews = false;

  if (lead.rating && lead.rating > 0) {
    ratingScore = (lead.rating / 5) * 100;
    hasRating = true;
    factors.push(`Rated ${lead.rating}/5`);
  }

  if (lead.reviews && lead.reviews > 0) {
    // Log scale: 10 reviews ≈ 50pts, 100 ≈ 75pts, 1000 ≈ 100pts
    reviewScore = Math.min((Math.log10(lead.reviews + 1) / 3) * 100, 100);
    hasReviews = true;
    factors.push(`${lead.reviews} reviews`);
  }

  if (!hasRating && !hasReviews) {
    return { score: 0, hasData: false, factors };
  }

  // Blend: rating carries 60%, review volume 40%
  const blended =
    (hasRating ? ratingScore * 0.6 : 0) +
    (hasReviews ? reviewScore * 0.4 : 0);

  // Normalise if only one source is present
  const divisor = (hasRating ? 0.6 : 0) + (hasReviews ? 0.4 : 0);
  const score = blended / divisor;

  return { score, hasData: true, factors };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface BaseScoreResult {
  score: number;
  explanation: string;
}

/**
 * Calculates a base score (0–100) from real lead data only.
 * No AI component — call applyAIScore() separately after AI runs.
 */
export function calculateBaseScore(lead: Partial<Lead>): BaseScoreResult {
  const completeness = scoreCompleteness(lead);
  const quality = scoreQuality(lead);

  // Redistribute weights if quality data is absent
  const weights: ScoringWeights = quality.hasData
    ? BASE_WEIGHTS
    : {
      completeness: BASE_WEIGHTS.completeness + BASE_WEIGHTS.quality,
      quality: 0,
      ai: BASE_WEIGHTS.ai,
    };

  // AI weight is held at neutral (0) until applyAIScore() is called
  const score =
    completeness.score * weights.completeness +
    quality.score * weights.quality;
  // AI portion is NOT included here — applied separately

  // Re-scale to account for the missing AI slot (score is currently out of 0.80 max)
  const scaledScore = score / (1 - weights.ai);

  const allFactors = [...completeness.factors, ...quality.factors];

  return {
    score: Math.min(100, Math.round(scaledScore)),
    explanation: allFactors.length > 0 ? allFactors.join(' • ') : 'Basic listing',
  };
}

/**
 * Merges an AI score into an already-scored lead.
 * If aiScore is null/undefined, the base score is returned unchanged.
 */
export function applyAIScore(baseScore: number, aiScore: number | null): number {
  if (aiScore === null || aiScore === undefined) return baseScore;

  // Blend: base score holds 80%, AI contributes 20%
  const merged = baseScore * (1 - BASE_WEIGHTS.ai) + aiScore * BASE_WEIGHTS.ai;
  return Math.min(100, Math.round(merged));
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 70) return 'High Potential';
  if (score >= 40) return 'Medium';
  return 'Low';
}

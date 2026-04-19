import { Lead, ScoreLabel } from './types';

export interface ScoringWeights {
  quality: number;      // weight for rating and review count
  completeness: number; // weight for address, phone, website
  ai: number;           // weight for AI qualitative assessment
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  quality: 0.45,
  completeness: 0.35,
  ai: 0.20,
};

export const calculateBaseScore = (
  lead: Partial<Lead>,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): { score: number; explanation: string } => {
  let quantitativeScore = 0;
  let quantitativePoints = 0;
  const explanations: string[] = [];

  // 1. Quality (Rating & Reviews)
  if (lead.rating) {
    const ratingScore = (lead.rating / 5) * 100;
    quantitativePoints += 70; // Rating is out of 70 in the quality section
    quantitativeScore += (ratingScore * 0.7);
    explanations.push(`Rating: ${lead.rating}/5`);
  }

  if (lead.reviews) {
    // Logarithmic scale for reviews: 100+ is max points
    const reviewScore = Math.min(Math.log10(lead.reviews + 1) / 2 * 100, 100);
    quantitativePoints += 30; // Reviews are out of 30 in the quality section
    quantitativeScore += (reviewScore * 0.3);
    explanations.push(`${lead.reviews} reviews`);
  } else {
    quantitativePoints += 30;
  }

  const qualitySubtotal = quantitativePoints > 0 ? (quantitativeScore / quantitativePoints) * 100 : 50;

  // 2. Completeness
  let completenessScore = 0;
  const completenessChecks = [
    { key: 'address', weight: 0.4, label: 'Address' },
    { key: 'phone', weight: 0.3, label: 'Phone' },
    { key: 'website', weight: 0.3, label: 'Website' },
  ];

  completenessChecks.forEach(check => {
    if (lead[check.key as keyof Lead]) {
      completenessScore += check.weight * 100;
      explanations.push(`Has ${check.label}`);
    }
  });

  // Calculate final weighted score (excluding AI for now, or assume AI score of 50 if missing)
  const finalScore = (qualitySubtotal * weights.quality) + (completenessScore * weights.completeness) + (50 * weights.ai);

  return {
    score: Math.round(finalScore),
    explanation: explanations.join(' • '),
  };
};

export const getScoreLabel = (score: number): ScoreLabel => {
  if (score >= 75) return 'High Potential';
  if (score >= 40) return 'Medium';
  return 'Low';
};

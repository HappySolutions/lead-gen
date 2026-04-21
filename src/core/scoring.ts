/**
 * scoring.ts — Service-aware scoring.
 *
 * The same business scores differently depending on what service you sell.
 * A restaurant with no website is a 90 for a web designer, a 20 for a POS vendor.
 *
 * calculateServiceScore() is the main function.
 * It detects what the seller offers and scores gaps accordingly.
 */

import { Lead, ScoreLabel } from './types';

export interface ScoreResult {
  score: number;
  explanation: string;
  serviceGaps: string[];
}

// ─── Service category detection ───────────────────────────────────────────────
// Maps what the user says they sell → which fields are "gaps" to score high

interface ServiceProfile {
  // Fields whose ABSENCE indicates a high-value gap
  missingFieldBonus: Array<{ field: keyof Lead | 'socialLinks'; points: number; label: string }>;
  // Fields whose PRESENCE indicates a good fit
  presentFieldBonus: Array<{ field: keyof Lead | 'socialLinks'; points: number; label: string }>;
}

const SERVICE_PROFILES: Record<string, ServiceProfile> = {
  'web design': {
    missingFieldBonus: [
      { field: 'website',     points: 50, label: 'No website — perfect target' },
    ],
    presentFieldBonus: [
      { field: 'phone',       points: 25, label: 'Reachable by phone' },
      { field: 'email',       points: 20, label: 'Has email' },
    ],
  },
  'website': {
    missingFieldBonus: [
      { field: 'website',     points: 50, label: 'No website — perfect target' },
    ],
    presentFieldBonus: [
      { field: 'phone',       points: 25, label: 'Reachable by phone' },
      { field: 'email',       points: 20, label: 'Has email' },
    ],
  },
  'social media': {
    missingFieldBonus: [
      { field: 'socialLinks', points: 45, label: 'No social media presence' },
    ],
    presentFieldBonus: [
      { field: 'website',     points: 20, label: 'Has website' },
      { field: 'phone',       points: 20, label: 'Reachable by phone' },
      { field: 'email',       points: 15, label: 'Has email' },
    ],
  },
  'seo': {
    missingFieldBonus: [],
    presentFieldBonus: [
      { field: 'website',     points: 40, label: 'Has website to optimise' },
      { field: 'phone',       points: 25, label: 'Reachable by phone' },
      { field: 'email',       points: 20, label: 'Has email' },
      { field: 'description', points: 15, label: 'Has web presence' },
    ],
  },
  'accounting': {
    missingFieldBonus: [],
    presentFieldBonus: [
      { field: 'phone',       points: 35, label: 'Reachable by phone' },
      { field: 'email',       points: 30, label: 'Has email' },
      { field: 'website',     points: 20, label: 'Established business' },
      { field: 'openingHours',points: 15, label: 'Active business' },
    ],
  },
  'software': {
    missingFieldBonus: [],
    presentFieldBonus: [
      { field: 'website',     points: 30, label: 'Tech-aware business' },
      { field: 'email',       points: 30, label: 'Has email' },
      { field: 'phone',       points: 25, label: 'Reachable' },
      { field: 'description', points: 15, label: 'Established online' },
    ],
  },
  'crm': {
    missingFieldBonus: [],
    presentFieldBonus: [
      { field: 'website',     points: 30, label: 'Tech-aware business' },
      { field: 'email',       points: 30, label: 'Has email' },
      { field: 'phone',       points: 25, label: 'Reachable' },
      { field: 'description', points: 15, label: 'Established online' },
    ],
  },
  'marketing': {
    missingFieldBonus: [
      { field: 'socialLinks', points: 25, label: 'Weak social presence' },
    ],
    presentFieldBonus: [
      { field: 'website',     points: 25, label: 'Has website' },
      { field: 'phone',       points: 20, label: 'Reachable' },
      { field: 'email',       points: 20, label: 'Has email' },
      { field: 'openingHours',points: 10, label: 'Active business' },
    ],
  },
  'photography': {
    missingFieldBonus: [
      { field: 'socialLinks', points: 30, label: 'No visual social presence' },
    ],
    presentFieldBonus: [
      { field: 'phone',       points: 30, label: 'Reachable by phone' },
      { field: 'email',       points: 25, label: 'Has email' },
      { field: 'website',     points: 15, label: 'Has website' },
    ],
  },
  'printing': {
    missingFieldBonus: [],
    presentFieldBonus: [
      { field: 'phone',       points: 40, label: 'Reachable by phone' },
      { field: 'email',       points: 30, label: 'Has email' },
      { field: 'openingHours',points: 15, label: 'Active business' },
      { field: 'website',     points: 15, label: 'Established online' },
    ],
  },
};

// ─── Default profile (generic reachability) ───────────────────────────────────

const DEFAULT_PROFILE: ServiceProfile = {
  missingFieldBonus: [],
  presentFieldBonus: [
    { field: 'email',        points: 35, label: 'Has email' },
    { field: 'phone',        points: 25, label: 'Has phone' },
    { field: 'website',      points: 20, label: 'Has website' },
    { field: 'socialLinks',  points: 10, label: 'Has social media' },
    { field: 'openingHours', points: 10, label: 'Has opening hours' },
  ],
};

// ─── Detect which service profile to use ─────────────────────────────────────

function detectProfile(service: string): ServiceProfile {
  const lower = service.toLowerCase();
  const key = Object.keys(SERVICE_PROFILES).find(
    (k) => lower.includes(k) || k.includes(lower)
  );
  return key ? SERVICE_PROFILES[key] : DEFAULT_PROFILE;
}

// ─── Field presence check ─────────────────────────────────────────────────────

function hasField(lead: Partial<Lead>, field: keyof Lead | 'socialLinks'): boolean {
  if (field === 'socialLinks') {
    const sl = lead.socialLinks;
    return !!(sl && Object.values(sl).some(Boolean));
  }
  const val = lead[field as keyof Lead];
  return !!(val && String(val).trim().length > 0);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scores a lead based on what service the user is selling.
 * Same lead, different score depending on what gaps are relevant.
 */
export function calculateServiceScore(
  lead: Partial<Lead>,
  service: string = ''
): ScoreResult {
  const profile  = detectProfile(service);
  const gaps: string[]    = [];
  const factors: string[] = [];
  let score = 0;

  // Score gaps (absence of something the seller can fill)
  for (const check of profile.missingFieldBonus) {
    if (!hasField(lead, check.field)) {
      score += check.points;
      gaps.push(check.label);
      factors.push(check.label);
    }
  }

  // Score presence (things that make the lead reachable/viable)
  for (const check of profile.presentFieldBonus) {
    if (hasField(lead, check.field)) {
      score += check.points;
      factors.push(check.label);
    }
  }

  return {
    score:       Math.min(100, score),
    explanation: factors.length > 0 ? factors.join(' • ') : 'Basic listing',
    serviceGaps: gaps,
  };
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 70) return 'High Potential';
  if (score >= 35) return 'Medium';
  return 'Low';
}

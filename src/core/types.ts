export type ScoreLabel = 'High Potential' | 'Medium' | 'Low';

export interface LeadLocation {
  lat: number;
  lng: number;
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;   // OSM does not supply ratings; kept for future enrichment
  reviews?: number;  // Same — kept undefined unless enriched
  openingHours?: string;
  location: LeadLocation;

  // Scoring
  score: number;
  scoreLabel: ScoreLabel;
  scoreExplanation: string;
  aiInsights?: string;
}

export interface SearchFilters {
  hasWebsite: boolean;
  hasPhone: boolean;
  minRating: number;
  sortBy: 'score' | 'rating' | 'reviews';
}

export interface SearchState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
}

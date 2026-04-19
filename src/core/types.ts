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
  rating?: number;
  reviews?: number;
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

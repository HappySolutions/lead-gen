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
  email?: string;           // from OSM or scraped from website
  socialLinks?: {           // scraped from website
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  description?: string;     // scraped meta description from website
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
  hasEmail: boolean;
  minRating: number;
  sortBy: 'score' | 'name' | 'rating' | 'reviews';
}

export interface SearchState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
}

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
  sortBy: 'score' | 'name';
}

export interface SearchState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
}

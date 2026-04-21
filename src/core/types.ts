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
  rating?: number;
  reviews?: number;
  phone?: string;
  website?: string;
  email?: string;
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  description?: string;
  openingHours?: string;
  location: LeadLocation;

  // Scoring
  score: number;
  scoreLabel: ScoreLabel;
  scoreExplanation: string;
  aiInsights?: string;

  // What service gaps make this lead valuable
  serviceGaps?: string[]; // e.g. ['No website', 'No social media']
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

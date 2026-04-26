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
  source?: 'osm' | 'gmaps' | 'merged'; // which data layer produced this lead
  rating?: number;   // Google Maps star rating 1–5
  reviews?: number;  // Google Maps review count
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
  minRating: number;
  sortBy: 'score' | 'rating' | 'reviews' | 'name';
}

export interface SearchState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
}
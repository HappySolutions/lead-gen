export type ScoreLabel = 'High Potential' | 'Medium' | 'Low';
export type LeadSortBy = 'score' | 'rating' | 'reviews' | 'name';

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
  sortBy: LeadSortBy;
}

export interface SearchQueryParams {
  q: string;
  loc: string;
  service?: string;
  lang?: 'en' | 'ar';
  hasWebsite?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  minRating?: number;
  sortBy?: LeadSortBy;
  page?: number;
  limit?: number;
}

export interface LeadsResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortBy: LeadSortBy;
  minRating: number;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  query: string;
  location: string;
  service: string;
}

export interface LeadsApiResponse {
  items: Lead[];
  meta: LeadsResponseMeta;
}

export interface SearchState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
}
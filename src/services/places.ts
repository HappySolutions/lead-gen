import { Lead } from '../core/types';
import { calculateBaseScore, getScoreLabel } from '../core/scoring';
import { analyzeLeadQuality } from './ai';

const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

export const searchLeads = async (
  query: string, 
  location: string,
  useMock: boolean = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
): Promise<Lead[]> => {
  if (useMock) {
    return getMockLeads(query, location);
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Google Places API Key missing');

  // Implementation of Google Places API (New) call
  // This would use fetch with field masking: 'places.displayName,places.formattedAddress,etc.'
  // For the MVP, we assume a structured response.
  return []; 
};

export const normalizePlace = async (place: any): Promise<Lead> => {
  const baseLead: Partial<Lead> = {
    id: place.id || Math.random().toString(36).substr(2, 9),
    name: place.displayName?.text || 'Unknown Business',
    category: place.primaryTypeDisplayName?.text || 'Business',
    address: place.formattedAddress || 'No Address available',
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    reviews: place.userRatingCount,
    location: {
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
    },
  };

  // Enhance with Scoring & AI
  const { score: baseScore, explanation } = calculateBaseScore(baseLead);
  const aiAnalysis = await analyzeLeadQuality(baseLead);
  
  const finalScore = Math.round((baseScore * 0.8) + (aiAnalysis.score * 0.2));

  return {
    ...baseLead as Lead,
    score: finalScore,
    scoreLabel: getScoreLabel(finalScore),
    scoreExplanation: explanation,
    aiInsights: aiAnalysis.explanation,
  };
};

const getMockLeads = async (query: string, location: string): Promise<Lead[]> => {
  await new Promise(r => setTimeout(r, 1200)); // Simulate delay
  
  const mockData = [
    {
      displayName: { text: 'Elite Fitness Center' },
      primaryTypeDisplayName: { text: 'Gym & Wellness' },
      formattedAddress: '123 Zayed St, Cairo, Egypt',
      nationalPhoneNumber: '+20 123 456 7890',
      websiteUri: 'https://elitefitness.com',
      rating: 4.8,
      userRatingCount: 156,
    },
    {
      displayName: { text: 'Downtown Dental Clinic' },
      primaryTypeDisplayName: { text: 'Medical Clinic' },
      formattedAddress: '45 Cairo Rd, Sheikh Zayed',
      nationalPhoneNumber: '+20 111 222 3333',
      rating: 4.9,
      userRatingCount: 42,
    },
    {
      displayName: { text: 'TechEdge Solutions' },
      primaryTypeDisplayName: { text: 'Software Company' },
      formattedAddress: 'Smart Village, Building B4',
      websiteUri: 'https://techedge.io',
      rating: 4.5,
      userRatingCount: 542,
    }
  ];

  return Promise.all(mockData.map(place => normalizePlace(place)));
};

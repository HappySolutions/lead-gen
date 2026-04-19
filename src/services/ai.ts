import { Lead } from '../core/types';

export interface AIAnalysis {
  score: number;
  explanation: string;
  insights: string;
}

export const analyzeLeadQuality = async (lead: Partial<Lead>): Promise<AIAnalysis> => {
  // If we had a real Gemini API Key, we would call it here.
  // For now, we simulate an AI evaluation based on business data.
  
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return simulateAIAnalysis(lead);
  }

  // Placeholder for real Google AI (Gemini) implementation
  try {
    // Real implementation would go here...
    return simulateAIAnalysis(lead);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return { score: 50, explanation: 'AI evaluation unavailable', insights: '' };
  }
};

const simulateAIAnalysis = (lead: Partial<Lead>): AIAnalysis => {
  const hasWebsite = !!lead.website;
  const hasHighRating = (lead.rating || 0) > 4.2;
  const isEstablished = (lead.reviews || 0) > 50;

  if (hasWebsite && hasHighRating && isEstablished) {
    return {
      score: 95,
      explanation: 'Exceptional digital presence with strong social proof and high customer satisfaction.',
      insights: 'Brand authority is high; likely a top-tier industry leader.'
    };
  }

  if (hasWebsite || (hasHighRating && isEstablished)) {
    return {
      score: 75,
      explanation: 'Professional operation with established credibility and consistent activity.',
      insights: 'Solid lead with active business operations and positive public sentiment.'
    };
  }

  return {
    score: 55,
    explanation: 'Standard business footprint with baseline visibility metrics.',
    insights: 'Active entity, though digital optimization opportunities exist to increase engagement.'
  };
};

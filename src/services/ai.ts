/**
 * ai.ts — Optional AI insights layer
 *
 * Uses rule-based heuristics derived from real lead data.
 * If ANTHROPIC_API_KEY is set in env, it can call Claude for richer insights.
 * No fake ratings or fake data are generated.
 */

import { Lead } from '../core/types';

export interface AIAnalysis {
  insights: string;
}

/**
 * Generates a brief insight string for a lead.
 * Called only for top 5 leads to keep API fast.
 */
export async function analyzeLeadQuality(lead: Partial<Lead>): Promise<AIAnalysis> {
  // If an Anthropic key is available, use the real Claude API
  if (process.env.ANTHROPIC_API_KEY) {
    return callClaude(lead);
  }
  // Otherwise fall back to deterministic heuristics
  return heuristicInsight(lead);
}

async function callClaude(lead: Partial<Lead>): Promise<AIAnalysis> {
  try {
    const prompt = `
You are a B2B sales analyst. In 1–2 sentences, describe the lead quality and sales opportunity for this business:
Name: ${lead.name}
Category: ${lead.category}
Address: ${lead.address}
Has phone: ${lead.phone ? 'yes' : 'no'}
Has website: ${lead.website ? 'yes' : 'no'}
Opening hours: ${lead.openingHours ?? 'unknown'}

Be specific, factual, and avoid generic statements.
`.trim();

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';
    return { insights: text.trim() };
  } catch (err) {
    console.error('Claude API failed, falling back to heuristic:', err);
    return heuristicInsight(lead);
  }
}

function heuristicInsight(lead: Partial<Lead>): AIAnalysis {
  const hasWebsite = !!lead.website;
  const hasPhone = !!lead.phone;
  const hasHours = !!lead.openingHours;

  if (hasWebsite && hasPhone && hasHours) {
    return {
      insights:
        'Well-documented business with strong digital presence. High contact accessibility makes outreach straightforward.',
    };
  }

  if (hasWebsite && hasPhone) {
    return {
      insights:
        'Established business with direct contact info and online presence. Good candidate for digital services pitch.',
    };
  }

  if (hasPhone && !hasWebsite) {
    return {
      insights:
        'Has direct contact but lacks a website. Strong opportunity to offer web or digital marketing services.',
    };
  }

  if (hasWebsite && !hasPhone) {
    return {
      insights:
        'Online presence exists but no listed phone. May respond better to digital outreach channels.',
    };
  }

  return {
    insights:
      'Limited contact data in public records. Verify existence on-site or via local directories before outreach.',
  };
}

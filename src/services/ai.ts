/**
 * ai.ts — Outreach insight layer.
 *
 * Frames every lead as a SALES OPPORTUNITY — not a competitor profile.
 * The question is always: "How do I reach this business and what do I pitch?"
 *
 * Uses enriched data (email, social, description) for specific recommendations.
 * Server-side only. Called for top 5 leads after scoring.
 */

import { Lead } from '../core/types';

export interface AIAnalysis {
  insights: string;
}

export async function analyzeLeadQuality(lead: Partial<Lead>): Promise<AIAnalysis> {
  if (process.env.ANTHROPIC_API_KEY) return callClaude(lead);
  return heuristicInsight(lead);
}

async function callClaude(lead: Partial<Lead>): Promise<AIAnalysis> {
  const socialStr = lead.socialLinks
    ? Object.entries(lead.socialLinks).filter(([, v]) => v).map(([k]) => k).join(', ')
    : 'none';

  const prompt = `You are a B2B sales coach. A salesperson found this business as a potential CLIENT to sell services to. Give them a 1–2 sentence outreach recommendation.

Business: ${lead.name} (${lead.category})
Location: ${lead.address}
Contact: ${lead.email ? `email: ${lead.email}` : 'no email'}, ${lead.phone ? `phone: ${lead.phone}` : 'no phone'}
Online: ${lead.website ? `website: ${lead.website}` : 'no website'}, social: ${socialStr}
About: ${lead.description ?? 'no description available'}

Focus on: (1) the best channel to reach them, (2) what gap or need they likely have that a vendor could fill.
Be specific and actionable. Do NOT describe what their business does — tell the salesperson how to approach them.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude ${res.status}`);
    const data = await res.json();
    return { insights: data?.content?.[0]?.text?.trim() ?? '' };
  } catch (err) {
    console.error('[ai] Claude failed:', err);
    return heuristicInsight(lead);
  }
}

function heuristicInsight(lead: Partial<Lead>): AIAnalysis {
  const email = lead.email;
  const phone = lead.phone;
  const website = lead.website;
  const linkedin = lead.socialLinks?.linkedin;
  const instagram = lead.socialLinks?.instagram;
  const hasDesc = !!lead.description;

  if (email) {
    return { insights: `Send a cold email to ${email} — reference their ${lead.category?.toLowerCase()} business and propose a specific service. Email gives them time to evaluate before responding.` };
  }
  if (linkedin) {
    return { insights: `No public email found. Connect on LinkedIn and open with a relevant observation about their business before pitching.` };
  }
  if (phone && !website) {
    return { insights: `Call ${phone} directly — this business has no website, which is a clear opening to pitch web or digital services. Keep the call under 2 minutes.` };
  }
  if (phone) {
    return { insights: `Call ${phone} and ask for the owner or manager. ${hasDesc ? 'Their site description suggests they are active — call during opening hours.' : 'Confirm they are the decision-maker before pitching.'}` };
  }
  if (instagram) {
    return { insights: `No phone or email listed. Send a DM via Instagram — keep it short and personal, reference something specific about their profile.` };
  }
  if (website) {
    return { insights: `Visit their website and look for a contact form, team page, or staff email. A personalised email beats a generic contact form submission.` };
  }
  return { insights: `Minimal online presence — this business may not be digitally active. A walk-in during business hours or a local directory lookup could uncover a direct contact.` };
}
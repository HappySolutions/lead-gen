/**
 * ai.ts — Service-aware outreach insight.
 * Now receives what the user sells so the pitch is specific.
 */

import { Lead } from '../core/types';

export interface AIAnalysis {
  insights: string;
}

export async function analyzeLeadQuality(
  lead: Partial<Lead>,
  service: string = '',
  serviceGaps: string[] = [],
  language: 'en' | 'ar' = 'en'
): Promise<AIAnalysis> {
  if (process.env.ANTHROPIC_API_KEY) return callClaude(lead, service, serviceGaps, language);
  return heuristicInsight(lead, service, serviceGaps, language);
}

async function callClaude(
  lead: Partial<Lead>,
  service: string,
  serviceGaps: string[],
  language: 'en' | 'ar'
): Promise<AIAnalysis> {
  const gapsStr  = serviceGaps.length > 0 ? serviceGaps.join(', ') : 'none identified';
  const socialStr = lead.socialLinks
    ? Object.entries(lead.socialLinks).filter(([, v]) => v).map(([k]) => k).join(', ')
    : 'none';

  const serviceClause = service
    ? `The salesperson sells: ${service}.`
    : 'The salesperson sells a professional service.';

  const languageClause =
    language === 'ar'
      ? 'Write the final outreach recommendation in Arabic (Modern Standard Arabic).'
      : 'Write the final outreach recommendation in English.';

  const prompt = `You are a B2B sales coach. ${serviceClause}
${languageClause}

They found this business as a prospect. Give them a 1–2 sentence outreach recommendation that is specific to their service.

Business: ${lead.name} (${lead.category})
Location: ${lead.address}
Phone: ${lead.phone ?? 'not listed'}
Email: ${lead.email ?? 'not found'}
Website: ${lead.website ?? 'none'}
Social: ${socialStr}
Description: ${lead.description ?? 'not available'}
Service gaps identified: ${gapsStr}

Tell them: (1) the best channel, (2) the specific angle based on what gaps exist. Be direct. No generic advice.`;

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
    return heuristicInsight(lead, service, serviceGaps, language);
  }
}

function heuristicInsight(
  lead: Partial<Lead>,
  service: string,
  serviceGaps: string[],
  language: 'en' | 'ar'
): AIAnalysis {
  const hasEmail    = !!lead.email;
  const hasPhone    = !!lead.phone;
  const linkedin    = lead.socialLinks?.linkedin;
  const instagram   = lead.socialLinks?.instagram;
  const hasWebsite  = !!lead.website;
  const serviceName = service || 'your service';

  if (language === 'ar') {
    const category = lead.category ? `${lead.category}` : 'النشاط';
    const safeService = service || 'خدمتك';

    if (serviceGaps.includes('No website — perfect target') && hasPhone) {
      return { insights: `اتصل على ${lead.phone} وابدأ بعبارة مباشرة: "لاحظت أن نشاطكم لا يملك موقعًا إلكترونيًا — أنا أساعد شركات ${category} في هذه المنطقة على بناء موقع يجلب عملاء. هل لديك دقيقتان أشرح الفكرة؟"` };
    }
    if (serviceGaps.includes('No social media presence') && hasEmail) {
      return { insights: `أرسل بريدًا إلى ${lead.email} مع لقطة شاشة لصفحة منافس على إنستغرام، ثم اسأل إن كانوا يريدون نفس النتيجة لنشاطهم. الدليل المرئي يقنع أسرع من أي كلام.` };
    }
    if (serviceGaps.includes('No website — perfect target') && hasEmail) {
      return { insights: `أرسل بريدًا إلى ${lead.email} واذكر مثالًا لمنافس محلي لديه موقع، ثم اعرض بناء موقع مشابه يبرز خدماتهم. المقارنة المحددة ترفع نسبة الرد.` };
    }

    if (hasEmail)   return { insights: `أرسل بريدًا إلى ${lead.email} برسالة قصيرة عن ${safeService} مع جملة واحدة مخصصة لنشاط ${category}. التخصيص يزيد الردود بشكل كبير.` };
    if (linkedin)   return { insights: `ابدأ عبر لينكدإن (لا يوجد بريد). أرسل طلب اتصال واذكر أنك تعمل مع شركات ${category} في نفس المنطقة مع فكرة محددة لتحسين النتائج بسرعة.` };
    if (hasPhone)   return { insights: `اتصل على ${lead.phone} خلال ساعات العمل واطلب مسؤول القرار. اجعل العرض في جملتين: المشكلة التي لاحظتها + كيف تحلها بخدمتك.` };
    if (instagram)  return { insights: `أرسل رسالة خاصة عبر إنستغرام: جملة عن ${safeService} + ملاحظة محددة عن حسابهم/محتواهم + سؤال واحد بنعم/لا لفتح الحوار.` };
    if (hasWebsite) return { insights: `راجع صفحة "تواصل معنا" في موقعهم للعثور على بريد أو اسم مسؤول، ثم تواصل برسالة قصيرة تربط خدمتك بهدف واضح (مكالمات/حجوزات/زيارات).` };
    return { insights: `بيانات التواصل محدودة — جرّب البحث عن جهة اتصال مباشرة عبر جوجل أو قم بزيارة سريعة للمكان وقدم عرضًا مختصرًا.` };
  }

  // Gap-specific pitches
  if (serviceGaps.includes('No website — perfect target') && hasPhone) {
    return { insights: `Call ${lead.phone} and open with: "I noticed you don't have a website — I build them for ${lead.category?.toLowerCase()} businesses in this area. Takes 2 minutes to explain." High conversion angle.` };
  }
  if (serviceGaps.includes('No social media presence') && hasEmail) {
    return { insights: `Email ${lead.email} with a screenshot showing a competitor's Instagram. Ask if they'd like the same for their business. Visual proof outperforms any pitch.` };
  }
  if (serviceGaps.includes('No website — perfect target') && hasEmail) {
    return { insights: `Email ${lead.email} referencing a local competitor with a website. Offer to build something similar. Specific comparisons convert better than generic pitches.` };
  }

  // Fallback by channel
  if (hasEmail)    return { insights: `Email ${lead.email} with a short pitch for ${serviceName}. Reference their ${lead.category?.toLowerCase()} specifically — personalised emails get 3× the response rate.` };
  if (linkedin)    return { insights: `LinkedIn is your entry point — no email found. Send a connection request mentioning you work with ${lead.category?.toLowerCase()} businesses in the area.` };
  if (hasPhone)    return { insights: `Call ${lead.phone} during opening hours. Ask for the owner by name if you can find it. Phone beats email for service businesses.` };
  if (instagram)   return { insights: `DM via Instagram — keep it to one sentence about ${serviceName} and one specific thing you noticed about their profile.` };
  if (hasWebsite)  return { insights: `Check their website's contact page or "About" section for a direct email or name before reaching out.` };
  return { insights: `Limited contact data — try a walk-in visit or Google "${lead.name} ${lead.category}" to find a direct contact.` };
}

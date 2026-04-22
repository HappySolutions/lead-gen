/**
 * enrichment.ts — Website enrichment layer.
 *
 * For each lead that has a website, fetches the homepage and extracts:
 *   - Email addresses (mailto: links + visible text regex)
 *   - Social media links (LinkedIn, Instagram, Facebook, Twitter/X)
 *   - Meta description (for AI context and UI display)
 *
 * Rules:
 *   - Only fetches public homepages — no login walls, no sitemaps
 *   - Hard 5s timeout per request — never blocks the pipeline
 *   - Runs in parallel across all leads — total wall time ≈ slowest single fetch
 *   - Returns partial data on any failure — never throws
 *   - Server-side only — imported only by route.ts
 */

export interface EnrichmentResult {
    email?: string;
    description?: string;
    socialLinks?: {
      linkedin?: string;
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
  }
  
  // ─── Extractors ───────────────────────────────────────────────────────────────
  
  function extractEmails(html: string): string | undefined {
    // 1. mailto: links (most reliable)
    const mailtoMatch = html.match(/href=["']mailto:([^"'?\s]+)/i);
    if (mailtoMatch) return mailtoMatch[1].toLowerCase();
  
    // 2. Visible email pattern (avoid false positives with a strict regex)
    const textMatch = html.match(
      /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}\b/
    );
    if (textMatch) {
      const email = textMatch[0].toLowerCase();
      // Filter out common false positives
      const excluded = ['example.com', 'domain.com', 'email.com', 'yourdomain', 'sentry.io', 'wixpress.com'];
      if (!excluded.some((ex) => email.includes(ex))) return email;
    }
  
    return undefined;
  }
  
  function extractSocialLinks(html: string): EnrichmentResult['socialLinks'] {
    const social: EnrichmentResult['socialLinks'] = {};
  
    const patterns: Array<[keyof NonNullable<EnrichmentResult['socialLinks']>, RegExp]> = [
      ['linkedin',  /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/i],
      ['instagram', /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>?#]+/i],
      ['facebook',  /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>?#]+/i],
      ['twitter',   /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^\s"'<>?#]+/i],
    ];
  
    for (const [key, regex] of patterns) {
      const match = html.match(regex);
      if (match) social[key] = match[0];
    }
  
    return Object.keys(social).length > 0 ? social : undefined;
  }
  
  function extractDescription(html: string): string | undefined {
    // og:description (usually better quality than meta description)
    const ogMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{10,300})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{10,300})["'][^>]+property=["']og:description["']/i);
    if (ogMatch) return ogMatch[1].trim();
  
    // Standard meta description
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,300})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{10,300})["'][^>]+name=["']description["']/i);
    if (metaMatch) return metaMatch[1].trim();
  
    return undefined;
  }
  
  // ─── Core fetch ───────────────────────────────────────────────────────────────
  
  async function fetchHomepage(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000); // hard 5s limit
  
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeadGeniBot/1.0)',
          'Accept': 'text/html',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
  
      if (!res.ok) return null;
  
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html')) return null;
  
      // Read only first 100KB — enough for head + footer, avoids large downloads
      const reader = res.body?.getReader();
      if (!reader) return null;
  
      let html = '';
      let bytesRead = 0;
      const MAX_BYTES = 100_000;
  
      while (bytesRead < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        html += new TextDecoder().decode(value);
        bytesRead += value.length;
      }
  
      reader.cancel();
      return html;
    } catch {
      return null; // timeout, network error, CORS — all handled silently
    } finally {
      clearTimeout(timeout);
    }
  }
  
  // ─── Public API ───────────────────────────────────────────────────────────────
  
  /**
   * Enriches a single lead's website.
   * Always resolves — returns {} on any error.
   */
  export async function enrichWebsite(website: string): Promise<EnrichmentResult> {
    const html = await fetchHomepage(website);
    if (!html) return {};
  
    return {
      email:       extractEmails(html),
      description: extractDescription(html),
      socialLinks: extractSocialLinks(html),
    };
  }
  
  /**
   * Enriches all leads with websites in parallel.
   * Caps concurrency at 5 to avoid hammering servers.
   */
  export async function enrichLeads<T extends { website?: string }>(
    leads: T[]
  ): Promise<(T & EnrichmentResult)[]> {
    const CONCURRENCY = 5;
    const results: (T & EnrichmentResult)[] = [];
  
    // Process in batches of CONCURRENCY
    for (let i = 0; i < leads.length; i += CONCURRENCY) {
      const batch = leads.slice(i, i + CONCURRENCY);
      const enriched = await Promise.all(
        batch.map(async (lead) => {
          if (!lead.website) return { ...lead } as T & EnrichmentResult;
          const data = await enrichWebsite(lead.website);
          const l = lead as any;
          // Only overwrite if we found something new, otherwise preserve existing
          return {
            ...lead,
            email:       data.email       || l.email,
            description: data.description || l.description,
            socialLinks: data.socialLinks || l.socialLinks,
          } as T & EnrichmentResult;
        })
      );
      results.push(...enriched);
    }
  
    return results;
  }
  
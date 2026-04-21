/**
 * tagResolver.ts — Translates any freeform user query into OSM tags.
 *
 * Strategy (in order of priority):
 *   1. Exact match in STATIC_MAP — instant, no API call
 *   2. Partial/fuzzy match in STATIC_MAP — still instant
 *   3. Claude API call — handles any unknown niche, returns OSM tags as JSON
 *   4. Fallback to office=company — never blocks the search, just broad
 *
 * All calls are server-side only (imported by places.ts).
 */

// ─── Static map (fast path) ───────────────────────────────────────────────────
// Covers the most common searches. Claude handles everything else.

const STATIC_MAP: Record<string, string[]> = {
    // Fitness
    gym: ['leisure=fitness_centre'], fitness: ['leisure=fitness_centre'],
    yoga: ['leisure=fitness_centre'], pilates: ['leisure=fitness_centre'],
    sports: ['leisure=sports_centre'], swimming: ['leisure=swimming_pool'],
    pool: ['leisure=swimming_pool'],
  
    // Medical
    clinic: ['amenity=clinic'], doctor: ['amenity=doctors'],
    hospital: ['amenity=hospital'], dental: ['amenity=dentist'],
    dentist: ['amenity=dentist'], pharmacy: ['amenity=pharmacy'],
    optician: ['shop=optician'], physiotherapy: ['amenity=physiotherapist'],
    veterinary: ['amenity=veterinary'], vet: ['amenity=veterinary'],
    nursing: ['amenity=nursing_home'], drugstore: ['amenity=pharmacy'],
    dermatologist: ['amenity=doctors'], pediatrician: ['amenity=doctors'],
    psychiatrist: ['amenity=doctors'], psychologist: ['amenity=doctors'],
  
    // Food & beverage
    restaurant: ['amenity=restaurant'], cafe: ['amenity=cafe'],
    coffee: ['amenity=cafe'], bakery: ['shop=bakery'],
    fastfood: ['amenity=fast_food'], 'fast food': ['amenity=fast_food'],
    bar: ['amenity=bar'], pub: ['amenity=pub'],
    catering: ['amenity=restaurant'], juice: ['amenity=cafe'],
  
    // Retail
    supermarket: ['shop=supermarket'], grocery: ['shop=supermarket'],
    clothing: ['shop=clothes'], clothes: ['shop=clothes'],
    shoes: ['shop=shoes'], electronics: ['shop=electronics'],
    furniture: ['shop=furniture'], hardware: ['shop=hardware'],
    bookstore: ['shop=books'], books: ['shop=books'],
    jewelry: ['shop=jewelry'], florist: ['shop=florist'],
    cosmetics: ['shop=cosmetics'], perfume: ['shop=perfumery'],
    toys: ['shop=toys'], art: ['shop=art'],
    antiques: ['shop=antiques'], carpet: ['shop=carpet'],
    lighting: ['shop=lighting'], kitchen: ['shop=kitchen'],
    mobile: ['shop=mobile_phone'], phone: ['shop=mobile_phone'],
  
    // Beauty
    salon: ['shop=hairdresser'], hairdresser: ['shop=hairdresser'],
    barber: ['shop=hairdresser'], spa: ['leisure=spa'],
    massage: ['leisure=massage'], nails: ['shop=beauty'],
    beauty: ['shop=beauty'], tattoo: ['shop=tattoo'],
  
    // Automotive
    mechanic: ['shop=car_repair'], garage: ['shop=car_repair'],
    car: ['shop=car'], dealership: ['shop=car'],
    tires: ['shop=tyres'], tyres: ['shop=tyres'],
    carwash: ['amenity=car_wash'], 'car wash': ['amenity=car_wash'],
    fuel: ['amenity=fuel'], petrol: ['amenity=fuel'],
    parking: ['amenity=parking'], motorcycle: ['shop=motorcycle'],
  
    // Finance & legal
    bank: ['amenity=bank'], insurance: ['office=insurance'],
    lawyer: ['office=lawyer'], legal: ['office=lawyer'],
    notary: ['office=notary'], accountant: ['office=accountant'],
    accounting: ['office=accountant'], financial: ['office=financial'],
    tax: ['office=tax_advisor'],
  
    // Professional services
    it: ['office=it'], software: ['office=it'], tech: ['office=it'],
    startup: ['office=company'], company: ['office=company'],
    coworking: ['amenity=coworking_space'], 'co-working': ['amenity=coworking_space'],
    'real estate': ['office=estate_agent'], property: ['office=estate_agent'],
    architect: ['office=architect'], engineering: ['office=engineer'],
    consultant: ['office=consulting'], consulting: ['office=consulting'],
    marketing: ['office=company'], advertising: ['office=advertising_agency'],
    recruitment: ['office=employment_agency'], hr: ['office=employment_agency'],
    travel: ['shop=travel_agency'], logistics: ['office=logistics'],
    security: ['office=security'], media: ['office=media'],
    printing: ['shop=copyshop'], copyshop: ['shop=copyshop'],
  
    // Education
    school: ['amenity=school'], kindergarten: ['amenity=kindergarten'],
    nursery: ['amenity=kindergarten'], university: ['amenity=university'],
    college: ['amenity=college'], language: ['amenity=language_school'],
    tutoring: ['amenity=tutoring_centre'], training: ['amenity=training'],
    'driving school': ['amenity=driving_school'], library: ['amenity=library'],
  
    // Hospitality
    hotel: ['tourism=hotel'], hostel: ['tourism=hostel'],
    guesthouse: ['tourism=guest_house'], resort: ['tourism=hotel'],
    motel: ['tourism=motel'], events: ['amenity=events_venue'],
    wedding: ['amenity=events_venue'], conference: ['amenity=conference_centre'],
    photography: ['shop=photo'],
  
    // Construction & trade
    construction: ['office=construction_company'], contractor: ['office=construction_company'],
    plumber: ['craft=plumber'], electrician: ['craft=electrician'],
    painter: ['craft=painter'], carpenter: ['craft=carpenter'],
    cleaning: ['office=cleaning_company'], landscaping: ['office=landscape_architect'],
  
    // Wholesale & production
    wholesale: ['shop=wholesale'], factory: ['man_made=works'],
  };

// Arabic fast-path keywords (covers common categories without needing Claude).
// Note: we normalize both the user query and these keys, so lookups are stable
// across different Arabic letter forms/diacritics.
const STATIC_MAP_AR_RAW: Record<string, string[]> = {
  // Fitness
  'جيم': ['leisure=fitness_centre'],
  'نادي رياضي': ['leisure=fitness_centre'],
  'صالة رياضية': ['leisure=fitness_centre'],
  'يوغا': ['leisure=fitness_centre'],
  'سباحة': ['leisure=swimming_pool'],
  'حمام سباحة': ['leisure=swimming_pool'],

  // Medical
  'عيادة': ['amenity=clinic'],
  'مستشفى': ['amenity=hospital'],
  'صيدلية': ['amenity=pharmacy'],
  'طبيب': ['amenity=doctors'],
  'دكتور': ['amenity=doctors'],
  'طبيبة': ['amenity=doctors'],
  'أسنان': ['amenity=dentist'],
  'عيادة أسنان': ['amenity=dentist'],
  'بيطري': ['amenity=veterinary'],
  'عيادة بيطرية': ['amenity=veterinary'],

  // Food & beverage
  'مطعم': ['amenity=restaurant'],
  'مطاعم': ['amenity=restaurant'],
  'كافيه': ['amenity=cafe'],
  'مقهى': ['amenity=cafe'],
  'قهوة': ['amenity=cafe'],
  'مخبز': ['shop=bakery'],
  'حلويات': ['shop=bakery'],

  // Retail
  'سوبرماركت': ['shop=supermarket'],
  'بقالة': ['shop=supermarket'],
  'ملابس': ['shop=clothes'],
  'أحذية': ['shop=shoes'],
  'جوالات': ['shop=mobile_phone'],
  'موبايلات': ['shop=mobile_phone'],
  'الكترونيات': ['shop=electronics'],
  'إلكترونيات': ['shop=electronics'],

  // Beauty
  'صالون': ['shop=hairdresser'],
  'حلاق': ['shop=hairdresser'],
  'سبا': ['leisure=spa'],
  'تجميل': ['shop=beauty'],

  // Finance & legal
  'بنك': ['amenity=bank'],
  'محامي': ['office=lawyer'],
  'محاماة': ['office=lawyer'],
  'محاسب': ['office=accountant'],
  'محاسبة': ['office=accountant'],

  // Education
  'مدرسة': ['amenity=school'],
  'حضانة': ['amenity=kindergarten'],
  'جامعة': ['amenity=university'],

  // Hospitality
  'فندق': ['tourism=hotel'],
  'منتجع': ['tourism=hotel'],

  // Automotive
  'ميكانيكي': ['shop=car_repair'],
  'ورشة': ['shop=car_repair'],
  'مغسلة سيارات': ['amenity=car_wash'],
  'بنزين': ['amenity=fuel'],
  'محطة وقود': ['amenity=fuel'],
};

const STATIC_MAP_AR: Record<string, string[]> = Object.fromEntries(
  Object.entries(STATIC_MAP_AR_RAW).map(([k, v]) => [normalizeArabic(k), v])
);
  
  // ─── Claude-powered resolver (slow path — any niche) ─────────────────────────
  
  async function resolveWithClaude(query: string): Promise<string[]> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return ['office=company']; // graceful fallback if no key
  
    const prompt = `You are an OpenStreetMap expert. Convert this business search query into OSM tags.
  
  Query: "${query}"
  
  Return ONLY a JSON array of OSM tag strings in "key=value" format. Max 3 tags.
  Choose from real OSM tags like: amenity=clinic, shop=clothes, office=lawyer, leisure=fitness_centre, tourism=hotel, craft=plumber, etc.
  
  Examples:
  - "digital marketing agency" → ["office=company"]
  - "dermatology clinic" → ["amenity=clinic","amenity=doctors"]
  - "CrossFit box" → ["leisure=fitness_centre"]
  - "notary public" → ["office=notary"]
  - "dog grooming" → ["shop=pet_grooming","amenity=veterinary"]
  
  Return ONLY the JSON array. No explanation.`;
  
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
  
      if (!res.ok) throw new Error(`Claude tag resolver: ${res.status}`);
  
      const data = await res.json();
      const text: string = data?.content?.[0]?.text ?? '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const tags: string[] = JSON.parse(clean);
  
      // Validate — must be "key=value" strings
      const valid = tags.filter((t) => typeof t === 'string' && t.includes('='));
      return valid.length > 0 ? valid : ['office=company'];
    } catch (err) {
      console.error('[tagResolver] Claude failed:', err);
      return ['office=company'];
    }
  }
  
  // ─── Public API ───────────────────────────────────────────────────────────────
  
  /**
   * Resolves a freeform user query to OSM tags.
   * Never throws — worst case returns ['office=company'].
   */
  export async function resolveOSMTags(query: string): Promise<string[]> {
    const lower = query.toLowerCase().trim();
    const hasArabic = /[\u0600-\u06FF]/.test(query);
    const normalizedAr = hasArabic ? normalizeArabic(query) : '';
  
    // 1. Exact match
    if (STATIC_MAP[lower]) {
      console.log(`[tagResolver] Static exact: "${lower}"`);
      return STATIC_MAP[lower];
    }

    if (hasArabic && STATIC_MAP_AR[normalizedAr]) {
      console.log(`[tagResolver] Arabic exact: "${normalizedAr}"`);
      return STATIC_MAP_AR[normalizedAr];
    }
  
    // 2. Partial match (query contains a known key or vice versa)
    const partialKey = Object.keys(STATIC_MAP).find(
      (k) => lower.includes(k) || k.includes(lower)
    );
    if (partialKey) {
      console.log(`[tagResolver] Static partial: "${lower}" → "${partialKey}"`);
      return STATIC_MAP[partialKey];
    }

    if (hasArabic) {
      const partialArKey = Object.keys(STATIC_MAP_AR).find((k) => {
        if (!k) return false;
        return normalizedAr.includes(k) || k.includes(normalizedAr);
      });
      if (partialArKey) {
        console.log(`[tagResolver] Arabic partial: "${normalizedAr}" → "${partialArKey}"`);
        return STATIC_MAP_AR[partialArKey];
      }
    }
  
    // 3. Claude resolves any unknown niche
    console.log(`[tagResolver] Claude resolving: "${lower}"`);
    return resolveWithClaude(query);
  }

function normalizeArabic(input: string): string {
  // Trim, remove tatweel + harakat, normalize common variants.
  return input
    .trim()
    .replace(/\u0640/g, '') // tatweel
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // harakat/marks
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
}
  
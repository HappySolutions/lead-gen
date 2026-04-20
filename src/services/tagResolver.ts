/**
 * tagResolver.ts — Translates any freeform user query (any language) into OSM tags.
 *
 * Strategy:
 *   1. Exact/partial match in STATIC_MAP (English keys only — instant)
 *   2. Claude resolves anything else — handles Arabic, French, slang, niche terms
 *
 * The Claude prompt explicitly instructs the model to treat the input as
 * "the type of business to find as a sales lead" — not a competitor search.
 */

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

    // Food & beverage
    restaurant: ['amenity=restaurant'], cafe: ['amenity=cafe'],
    coffee: ['amenity=cafe'], bakery: ['shop=bakery'],
    fastfood: ['amenity=fast_food'], 'fast food': ['amenity=fast_food'],
    bar: ['amenity=bar'], pub: ['amenity=pub'],
    catering: ['amenity=restaurant'],

    // Retail
    supermarket: ['shop=supermarket'], grocery: ['shop=supermarket'],
    clothing: ['shop=clothes'], clothes: ['shop=clothes'],
    shoes: ['shop=shoes'], electronics: ['shop=electronics'],
    furniture: ['shop=furniture'], hardware: ['shop=hardware'],
    bookstore: ['shop=books'], jewelry: ['shop=jewelry'],
    florist: ['shop=florist'], cosmetics: ['shop=cosmetics'],
    toys: ['shop=toys'], mobile: ['shop=mobile_phone'],
    phone: ['shop=mobile_phone'], lighting: ['shop=lighting'],

    // Beauty
    salon: ['shop=hairdresser'], hairdresser: ['shop=hairdresser'],
    barber: ['shop=hairdresser'], spa: ['leisure=spa'],
    massage: ['leisure=massage'], nails: ['shop=beauty'],
    beauty: ['shop=beauty'], tattoo: ['shop=tattoo'],

    // Automotive
    mechanic: ['shop=car_repair'], garage: ['shop=car_repair'],
    car: ['shop=car'], dealership: ['shop=car'],
    tires: ['shop=tyres'], carwash: ['amenity=car_wash'],
    fuel: ['amenity=fuel'], petrol: ['amenity=fuel'],
    parking: ['amenity=parking'], motorcycle: ['shop=motorcycle'],

    // Finance & legal
    bank: ['amenity=bank'], insurance: ['office=insurance'],
    lawyer: ['office=lawyer'], legal: ['office=lawyer'],
    notary: ['office=notary'], accountant: ['office=accountant'],
    accounting: ['office=accountant'], financial: ['office=financial'],

    // Professional services
    it: ['office=it'], software: ['office=it'], tech: ['office=it'],
    startup: ['office=company'], company: ['office=company'],
    coworking: ['amenity=coworking_space'],
    'real estate': ['office=estate_agent'], property: ['office=estate_agent'],
    architect: ['office=architect'], engineering: ['office=engineer'],
    consultant: ['office=consulting'], consulting: ['office=consulting'],
    marketing: ['office=company'], advertising: ['office=advertising_agency'],
    recruitment: ['office=employment_agency'],
    travel: ['shop=travel_agency'], logistics: ['office=logistics'],
    security: ['office=security'], media: ['office=media'],
    printing: ['shop=copyshop'],

    // Education
    school: ['amenity=school'], kindergarten: ['amenity=kindergarten'],
    nursery: ['amenity=kindergarten'], university: ['amenity=university'],
    college: ['amenity=college'], language: ['amenity=language_school'],
    tutoring: ['amenity=tutoring_centre'], training: ['amenity=training'],
    'driving school': ['amenity=driving_school'], library: ['amenity=library'],

    // Hospitality
    hotel: ['tourism=hotel'], hostel: ['tourism=hostel'],
    guesthouse: ['tourism=guest_house'], resort: ['tourism=hotel'],
    events: ['amenity=events_venue'], conference: ['amenity=conference_centre'],
    photography: ['shop=photo'],

    // Construction & trade
    construction: ['office=construction_company'],
    contractor: ['office=construction_company'],
    plumber: ['craft=plumber'], electrician: ['craft=electrician'],
    painter: ['craft=painter'], carpenter: ['craft=carpenter'],
    cleaning: ['office=cleaning_company'],

    // Wholesale & production
    wholesale: ['shop=wholesale'], factory: ['man_made=works'],
};

// ─── Arabic common terms (direct map — no API call needed) ────────────────────
const ARABIC_MAP: Record<string, string[]> = {
    'صالة رياضية': ['leisure=fitness_centre'],
    'جيم': ['leisure=fitness_centre'],
    'صالة جيم': ['leisure=fitness_centre'],
    'نادي رياضي': ['leisure=sports_centre'],
    'يوغا': ['leisure=fitness_centre'],
    'عيادة': ['amenity=clinic'],
    'مستشفى': ['amenity=hospital'],
    'طبيب': ['amenity=doctors'],
    'صيدلية': ['amenity=pharmacy'],
    'أسنان': ['amenity=dentist'],
    'طبيب أسنان': ['amenity=dentist'],
    'مطعم': ['amenity=restaurant'],
    'كافيه': ['amenity=cafe'],
    'كافيتيريا': ['amenity=cafe'],
    'قهوة': ['amenity=cafe'],
    'مخبز': ['shop=bakery'],
    'حلاق': ['shop=hairdresser'],
    'صالون': ['shop=hairdresser'],
    'صالون تجميل': ['shop=beauty'],
    'سبا': ['leisure=spa'],
    'فندق': ['tourism=hotel'],
    'محامي': ['office=lawyer'],
    'محاسب': ['office=accountant'],
    'مدرسة': ['amenity=school'],
    'حضانة': ['amenity=kindergarten'],
    'جامعة': ['amenity=university'],
    'بنك': ['amenity=bank'],
    'بنوك': ['amenity=bank'],
    'تأمين': ['office=insurance'],
    'عقارات': ['office=estate_agent'],
    'سيارات': ['shop=car'],
    'ميكانيكي': ['shop=car_repair'],
    'محل': ['shop=convenience'],
    'سوبرماركت': ['shop=supermarket'],
    'ملابس': ['shop=clothes'],
    'الكترونيات': ['shop=electronics'],
    'مواد بناء': ['shop=hardware'],
    'مقاول': ['office=construction_company'],
    'شركة': ['office=company'],
    'مكتب': ['office=company'],
    'تسويق': ['office=company'],
    'اعلانات': ['office=advertising_agency'],
    'شحن': ['office=logistics'],
    'طباعة': ['shop=copyshop'],
    'تنظيف': ['office=cleaning_company'],
    'حراسة': ['office=security'],
    'بيطري': ['amenity=veterinary'],
    'مسبح': ['leisure=swimming_pool'],
    'وكالة سفر': ['shop=travel_agency'],
};

// ─── Claude resolver (any language, any niche) ────────────────────────────────

async function resolveWithClaude(query: string): Promise<string[]> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.warn('[tagResolver] No ANTHROPIC_API_KEY — using office=company fallback');
        return ['office=company'];
    }

    const prompt = `You are an OpenStreetMap expert. The user is searching for businesses to sell services to (B2B lead generation). Their query may be in any language including Arabic, French, or English.

User query: "${query}"

Task: Convert this to the correct OpenStreetMap tags that would find this type of business on a map.

Return ONLY a valid JSON array of OSM tag strings in "key=value" format. Max 3 tags.
Use real OSM tags: amenity=clinic, shop=clothes, office=lawyer, leisure=fitness_centre, tourism=hotel, craft=plumber, etc.

Examples:
- "صالة رياضية" (Arabic: gym) → ["leisure=fitness_centre"]
- "عيادات أسنان" (Arabic: dental clinics) → ["amenity=dentist"]
- "digital marketing agency" → ["office=company","office=advertising_agency"]
- "CrossFit box" → ["leisure=fitness_centre"]
- "محامي" (Arabic: lawyer) → ["office=lawyer"]
- "مطاعم" (Arabic: restaurants) → ["amenity=restaurant"]

Return ONLY the JSON array, no explanation, no markdown.`;

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

        if (!res.ok) throw new Error(`Claude ${res.status}`);

        const data = await res.json();
        const text: string = data?.content?.[0]?.text ?? '[]';
        const clean = text.replace(/```json|```/g, '').trim();
        const tags: string[] = JSON.parse(clean);
        const valid = tags.filter((t) => typeof t === 'string' && t.includes('='));

        console.log(`[tagResolver] Claude resolved "${query}" →`, valid);
        return valid.length > 0 ? valid : ['office=company'];
    } catch (err) {
        console.error('[tagResolver] Claude failed:', err);
        return ['office=company'];
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function resolveOSMTags(query: string): Promise<string[]> {
    const trimmed = query.trim();
    const lower = trimmed.toLowerCase();

    // 1. Arabic static map (exact match)
    if (ARABIC_MAP[trimmed]) {
        console.log(`[tagResolver] Arabic static: "${trimmed}"`);
        return ARABIC_MAP[trimmed];
    }

    // 2. English static map (exact match)
    if (STATIC_MAP[lower]) {
        console.log(`[tagResolver] English static: "${lower}"`);
        return STATIC_MAP[lower];
    }

    // 3. English partial match
    const partialKey = Object.keys(STATIC_MAP).find(
        (k) => lower.includes(k) || k.includes(lower)
    );
    if (partialKey) {
        console.log(`[tagResolver] Partial match: "${lower}" → "${partialKey}"`);
        return STATIC_MAP[partialKey];
    }

    // 4. Claude handles everything else (Arabic, French, niche terms, etc.)
    console.log(`[tagResolver] Claude resolving: "${trimmed}"`);
    return resolveWithClaude(trimmed);
}
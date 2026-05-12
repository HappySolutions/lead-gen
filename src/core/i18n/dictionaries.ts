export interface Dictionary {
  branding: {
    name: string;
    tagline: string;
  };
  header: {
    subtitle: string;
  };
  hero: {
    title: string;
    description: string;
  };
  search: {
    servicePlaceholder: string;
    queryPlaceholder: string;
    locationPlaceholder: string;
    button: string;
    searching: string;
  };
  filters: {
    hasWebsite: string;
    hasPhone: string;
    hasEmail: string;
    sortBy: string;
    minRating: string;
    sortOptions: {
      score: string;
      name: string;
      rating: string;
      reviews: string;
    };
  };
  leads: {
    highPotential: string;
    medium: string;
    low: string;
    viewDetails: string;
    viewFullProfile: string;
    upgradeToView: string;
    upgradeToUnlock: string;
    export: string;
    exportUpgrade: string;
    upgradeHiddenLeads: (count: number) => string;
    upgradeDescription: string;
    unlockAllLeads: string;
    found: string;
    reviews: string;
    aiInsight: string;
    outreachTip: string;
    noResults: string;
    adjustFilters: string;
  };
  emptyState: {
    title: string;
    description: string;
  };
  details: {
    contactInfo: string;
    openInMaps: string;
    aiAnalysis: string;
    dataQuality: string;
    completeness: string;
    aiCredibility: string;
    social: string;
  };
  auth: {
    signOut: string;
  };
  profile: {
    pro: string;
    freeSearchesLeft: (count: number) => string;
    zeroSearchesLeft: string;
  };
  upgrade: {
    limitReachedTitle: (limit: number) => string;
    limitReachedSub: string;
    button: string;
    unlockButton: string;
    unlockTitle: (count: number) => string;
    unlockDescription: string;
    whatsappMessage: (email: string) => string;
  };
}

export const en: Dictionary = {
  branding: {
    name: 'LeadGeni',
    tagline: 'Find businesses that need your service',
  },
  header: {
    subtitle: 'Find businesses that need your service',
  },
  hero: {
    title: 'Find businesses that need your service',
    description:
      'Tell us about your service and who you want to sell to. We find local businesses with the gaps your service fills — ranked by how likely they are to buy.',
  },
  search: {
    servicePlaceholder: 'What service do you offer? (e.g. web design, accounting, SEO)',
    queryPlaceholder: 'Who do you want to sell to? (e.g. restaurants, clinics, gyms)',
    locationPlaceholder: 'City or area',
    button: 'Find leads',
    searching: 'Searching...',
  },
  filters: {
    hasWebsite: 'Has website',
    hasPhone: 'Has phone',
    hasEmail: 'Has email',
    sortBy: 'Sort by',
    minRating: 'Min Rating',
    sortOptions: {
      score: 'Score',
      name: 'Name',
      rating: 'Rating',
      reviews: 'Reviews',
    },
  },
  leads: {
    highPotential: 'High Potential',
    medium: 'Medium',
    low: 'Low',
    viewDetails: 'View details',
    viewFullProfile: 'View full profile',
    upgradeToView: 'Upgrade to view',
    upgradeToUnlock: 'Upgrade to unlock',
    export: 'Export CSV',
    exportUpgrade: 'Export CSV (upgrade)',
    upgradeHiddenLeads: (count: number) => `${count} more leads are hidden.`,
    upgradeDescription:
      'Upgrade to unlock all contact details, emails, social links and CSV export.',
    unlockAllLeads: 'Unlock all leads',
    found: 'leads',
    reviews: 'reviews',
    aiInsight: 'AI INSIGHT',
    outreachTip: 'Outreach tip',
    noResults: 'No results match your current filters.',
    adjustFilters: 'Try adjusting the rating or requirements.',
  },
  emptyState: {
    title: 'Ready to find clients?',
    description:
      'Enter what you sell (e.g. "web design") and who to target (e.g. "restaurants") to get a scored list of prospects with contact info.',
  },
  details: {
    contactInfo: 'Contact Information',
    openInMaps: 'Open in Google Maps',
    aiAnalysis: 'AI Analysis & Scoring',
    dataQuality: 'Data Quality',
    completeness: 'Completeness',
    aiCredibility: 'AI Credibility',
    social: 'Social',
  },
  auth: {
    signOut: 'Sign out',
  },
  profile: {
    pro: 'Pro',
    freeSearchesLeft: (count: number) => `${count} search${count === 1 ? '' : 'es'} left`,
    zeroSearchesLeft: '0 searches left',
  },
  upgrade: {
    limitReachedTitle: (limit: number) => `You've used all ${limit} free searches.`,
    limitReachedSub: 'Contact us on WhatsApp to upgrade and get unlimited access.',
    button: 'Upgrade via WhatsApp',
    unlockButton: 'Unlock via WhatsApp',
    unlockTitle: (count: number) => `${count} more leads are hidden.`,
    unlockDescription: 'Pay once and get full access to all leads, contact info, and CSV export.',
    whatsappMessage: (email: string) => `Hi, I want to upgrade my LeadGeni account.\nEmail: ${email}`,
  },
};

export const ar: Dictionary = {
  branding: {
    name: 'ليدجيني',
    tagline: 'اعثر على شركات تحتاج خدماتك',
  },
  header: {
    subtitle: 'اعثر على شركات تحتاج خدماتك',
  },
  hero: {
    title: 'اعثر على شركات تحتاج خدماتك',
    description:
      'أخبرنا بما تقدمه من خدمات ولمن تريد البيع له. سنعثر على شركات محلية لديها فجوات يمكن لخدمتك سدّها — مرتبة حسب احتمالية الشراء.',
  },
  search: {
    servicePlaceholder: 'ما هي الخدمة التي تقدمها؟ (مثلاً: تصميم مواقع، محاسبة، سيو)',
    queryPlaceholder: 'من تريد البيع له؟ (مثلاً: مطاعم، عيادات، نوادٍ رياضية)',
    locationPlaceholder: 'المدينة أو المنطقة',
    button: 'ابحث عن عملاء',
    searching: 'جاري البحث...',
  },
  filters: {
    hasWebsite: 'يوجد موقع إلكتروني',
    hasPhone: 'يوجد هاتف',
    hasEmail: 'يوجد بريد إلكتروني',
    sortBy: 'ترتيب حسب',
    minRating: 'أقل تقييم',
    sortOptions: {
      score: 'التقييم الكلي',
      name: 'الاسم',
      rating: 'التقييم',
      reviews: 'المراجعات',
    },
  },
  leads: {
    highPotential: 'إمكانات عالية',
    medium: 'متوسط',
    low: 'منخفض',
    viewDetails: 'عرض التفاصيل',
    viewFullProfile: 'عرض الملف الكامل',
    upgradeToView: 'قم بالترقية للعرض',
    upgradeToUnlock: 'قم بالترقية لإلغاء القفل',
    export: 'تصدير CSV',
    exportUpgrade: 'تصدير CSV (ترقية)',
    upgradeHiddenLeads: (count: number) => `هناك ${count} عملاء إضافيين مخفيين.`,
    upgradeDescription:
      'قم بالترقية لإلغاء قفل جميع بيانات التواصل والبريد والروابط الاجتماعية وتصدير CSV.',
    unlockAllLeads: 'افتح جميع العملاء',
    found: 'عملاء',
    reviews: 'تقييم',
    aiInsight: 'رؤية الذكاء الاصطناعي',
    outreachTip: 'نصيحة للتواصل',
    noResults: 'لا توجد نتائج تطابق التصفية الحالية.',
    adjustFilters: 'جرب تعديل التقييم أو المتطلبات.',
  },
  emptyState: {
    title: 'هل أنت مستعد للعثور على عملاء؟',
    description:
      'أدخل ما تبيعه (مثلاً "تصميم مواقع") ومن تستهدف (مثلاً "مطاعم") للحصول على قائمة عملاء محتملين مع بيانات التواصل.',
  },
  details: {
    contactInfo: 'بيانات التواصل',
    openInMaps: 'فتح في خرائط جوجل',
    aiAnalysis: 'تحليل الذكاء الاصطناعي والتقييم',
    dataQuality: 'جودة البيانات',
    completeness: 'الاكتمال',
    aiCredibility: 'مصداقية الذكاء الاصطناعي',
    social: 'التواصل الاجتماعي',
  },
  auth: {
    signOut: 'تسجيل الخروج',
  },
  profile: {
    pro: 'احترافي',
    freeSearchesLeft: (count: number) => `بقي ${count} ${count === 1 ? 'بحث' : 'عمليات بحث'}`,
    zeroSearchesLeft: 'انتهت عمليات البحث',
  },
  upgrade: {
    limitReachedTitle: (limit: number) => `لقد استخدمت جميع عمليات البحث المجانية (${limit}).`,
    limitReachedSub: 'تواصل معنا عبر واتساب للترقية والحصول على وصول غير محدود.',
    button: 'ترقية عبر واتساب',
    unlockButton: 'فتح عبر واتساب',
    unlockTitle: (count: number) => `هناك ${count} عملاء إضافيين مخفيين.`,
    unlockDescription: 'ادفع مرة واحدة واحصل على وصول كامل لجميع العملاء وبيانات التواصل وتصدير CSV.',
    whatsappMessage: (email: string) => `مرحباً، أريد ترقية حسابي في LeadGeni.\nالبريد الإلكتروني: ${email}`,
  },
};

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
  };
  emptyState: {
    title: string;
    description: string;
  };
}

export const en: Dictionary = {
  branding: {
    name: 'LeadGeni',
    tagline: 'Find businesses that need what you sell',
  },
  header: {
    subtitle: 'Find businesses that need what you sell',
  },
  hero: {
    title: 'Find businesses that need what you sell',
    description:
      'Tell us what you sell and who you want to sell to. We find local businesses with the gaps your service fills — ranked by how likely they are to buy.',
  },
  search: {
    servicePlaceholder: 'What do you sell? (e.g. web design, accounting, SEO)',
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
    found: 'leads found',
    reviews: 'reviews',
    aiInsight: 'AI INSIGHT',
    outreachTip: 'Outreach tip',
  },
  emptyState: {
    title: 'Ready to find clients?',
    description:
      'Enter what you sell (e.g. "web design") and who to target (e.g. "restaurants") to get a scored list of prospects with contact info.',
  },
};

export const ar: Dictionary = {
  branding: {
    name: 'LeadGeni',
    tagline: 'اعثر على شركات تحتاج ما تبيعه',
  },
  header: {
    subtitle: 'اعثر على شركات تحتاج ما تبيعه',
  },
  hero: {
    title: 'اعثر على شركات تحتاج ما تبيعه',
    description:
      'أخبرنا بما تبيعه ومن تريد البيع له. سنعثر على شركات محلية لديها فجوات يمكن لخدمتك سدّها — مرتبة حسب احتمالية الشراء.',
  },
  search: {
    servicePlaceholder: 'ماذا تبيع؟ (مثلاً: تصميم مواقع، محاسبة، سيو)',
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
    found: 'عملاء تم العثور عليهم',
    reviews: 'تقييم',
    aiInsight: 'رؤية الذكاء الاصطناعي',
    outreachTip: 'نصيحة للتواصل',
  },
  emptyState: {
    title: 'هل أنت مستعد للعثور على عملاء؟',
    description:
      'أدخل ما تبيعه (مثلاً "تصميم مواقع") ومن تستهدف (مثلاً "مطاعم") للحصول على قائمة عملاء محتملين مع بيانات التواصل.',
  },
};

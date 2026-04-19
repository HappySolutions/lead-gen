export interface Dictionary {
  branding: {
    name: string;
  };
  search: {
    placeholder: string;
    location: string;
    button: string;
    searching: string;
  };
  filters: {
    hasWebsite: string;
    hasPhone: string;
    sortBy: string;
    sortOptions: {
      score: string;
      rating: string;
      reviews: string;
    };
  };
  leads: {
    highPotential: string;
    medium: string;
    low: string;
    viewDetails: string;
    rating: string;
    reviews: string;
    export: string;
    found: string;
    aiInsight: string;
    scoreLabel: string;
  };
  emptyState: {
    title: string;
    description: string;
  };
}

export const en: Dictionary = {
  branding: {
    name: 'LeadGeni',
  },
  search: {
    placeholder: 'What are you looking for? (e.g. Gyms, Clinics)',
    location: 'Location (e.g. Sheikh Zayed)',
    button: 'Find Leads',
    searching: 'Searching...',
  },
  filters: {
    hasWebsite: 'Has Website',
    hasPhone: 'Has Phone',
    sortBy: 'Sort by',
    sortOptions: {
      score: 'Score',
      rating: 'Rating',
      reviews: 'Popularity',
    },
  },
  leads: {
    highPotential: 'High Potential',
    medium: 'Medium',
    low: 'Low',
    viewDetails: 'View Details',
    rating: 'Rating',
    reviews: 'reviews',
    export: 'Export CSV',
    found: 'leads found',
    aiInsight: 'AI INSIGHT',
    scoreLabel: 'Score',
  },
  emptyState: {
    title: 'Ready to start?',
    description: 'Enter a business type and location to generate leads.',
  },
};

export const ar: Dictionary = {
  branding: {
    name: 'LeadGeni',
  },
  search: {
    placeholder: 'ماذا تبحث عنه؟ (مثلاً: صالات رياضية، عيادات)',
    location: 'الموقع (مثلاً: الشيخ زايد)',
    button: 'ابحث عن عملاء',
    searching: 'جاري البحث...',
  },
  filters: {
    hasWebsite: 'يوجد موقع إلكتروني',
    hasPhone: 'يوجد هاتف',
    sortBy: 'ترتيب حسب',
    sortOptions: {
      score: 'التقييم الكلي',
      rating: 'تقييم العملاء',
      reviews: 'الشعبية',
    },
  },
  leads: {
    highPotential: 'إمكانات عالية',
    medium: 'متوسط',
    low: 'منخفض',
    viewDetails: 'عرض التفاصيل',
    rating: 'التقييم',
    reviews: 'تقييم',
    export: 'تصدير CSV',
    found: 'عملاء تم العثور عليهم',
    aiInsight: 'رؤية الذكاء الاصطناعي',
    scoreLabel: 'الدرجة',
  },
  emptyState: {
    title: 'هل أنت مستعد للبدء؟',
    description: 'أدخل نوع العمل والموقع لبدء البحث عن العملاء.',
  },
};

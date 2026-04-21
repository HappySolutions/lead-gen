'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Dictionary, en, ar } from './dictionaries';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // IMPORTANT: keep initial render stable for SSR hydration.
  // We intentionally DO NOT read localStorage in the initializer.
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('leadgeni_lang') as Language;
      if (saved === 'en' || saved === 'ar') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage(saved);
      }
    } catch {
      // ignore (e.g. blocked storage)
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('leadgeni_lang', language);
    // Update document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: language === 'ar' ? ar : en,
    isRTL: language === 'ar',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

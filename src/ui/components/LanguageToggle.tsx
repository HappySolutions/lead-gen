'use client';

import React from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, isRTL } = useTranslation();

  return (
    <div style={styles.container}>
      <Globe size={16} color="#64748b" />
      <button 
        onClick={() => setLanguage('en')}
        style={language === 'en' ? styles.activeBtn : styles.btn}
      >
        English
      </button>
      <div style={styles.divider} />
      <button 
        onClick={() => setLanguage('ar')}
        style={language === 'ar' ? styles.activeBtnAr : styles.btnAr}
      >
        العربية
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fff',
    padding: '4px 8px',
    borderRadius: '100px',
    border: '1px solid #e2e8f0',
    width: 'fit-content',
  },
  btn: {
    border: 'none',
    background: 'none',
    fontSize: '12px',
    fontWeight: '500',
    color: '#64748b',
    padding: '4px 8px',
    borderRadius: '100px',
    cursor: 'pointer',
  },
  activeBtn: {
    border: 'none',
    background: '#eff6ff',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    padding: '4px 8px',
    borderRadius: '1000px',
  },
  btnAr: {
    border: 'none',
    background: 'none',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    padding: '4px 8px',
    borderRadius: '100px',
    cursor: 'pointer',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  activeBtnAr: {
    border: 'none',
    background: '#f5f3ff',
    fontSize: '13px',
    fontWeight: '600',
    color: '#7c3aed',
    padding: '4px 8px',
    borderRadius: '1000px',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  divider: {
    width: '1px',
    height: '14px',
    backgroundColor: '#e2e8f0',
  }
};

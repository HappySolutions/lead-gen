'use client';

import React from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslation();

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
    backgroundColor: 'var(--card)',
    padding: '4px 8px',
    borderRadius: '100px',
    border: '1px solid var(--border)',
    width: 'fit-content',
    boxShadow: 'var(--shadow-sm)',
  },
  btn: {
    border: 'none',
    background: 'none',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--muted)',
    padding: '4px 8px',
    borderRadius: '100px',
    cursor: 'pointer',
  },
  activeBtn: {
    border: 'none',
    background: 'var(--accent)',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--primary)',
    padding: '4px 8px',
    borderRadius: '1000px',
  },
  btnAr: {
    border: 'none',
    background: 'none',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--muted)',
    padding: '4px 8px',
    borderRadius: '100px',
    cursor: 'pointer',
    fontFamily: '"IBM Plex Sans Arabic", sans-serif',
  },
  activeBtnAr: {
    border: 'none',
    background: 'var(--accent)',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--primary)',
    padding: '4px 8px',
    borderRadius: '1000px',
    fontFamily: '"IBM Plex Sans Arabic", sans-serif',
  },
  divider: {
    width: '1px',
    height: '14px',
    backgroundColor: 'var(--border)',
  }
};

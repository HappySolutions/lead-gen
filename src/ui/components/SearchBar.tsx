'use client';

import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface SearchBarProps {
  onSearch: (query: string, location: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const { t, isRTL } = useTranslation();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query && location) {
      onSearch(query, location);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputGroup}>
        <Search size={18} style={styles.icon} />
        <input
          type="text"
          placeholder={t.search.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.input}
          required
        />
      </div>
      <div className="divider" style={styles.divider} />
      <div style={styles.inputGroup}>
        <MapPin size={18} style={styles.icon} />
        <input
          type="text"
          placeholder={t.search.location}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={styles.input}
          required
        />
      </div>
      <button 
        type="submit" 
        disabled={isLoading}
        style={{
          ...styles.button,
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? t.search.searching : t.search.button}
      </button>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--card)',
    padding: '8px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    border: '1px solid var(--border)',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    padding: '0 12px',
  },
  icon: {
    color: 'var(--muted-foreground)',
    marginInlineEnd: '12px',
  },
  input: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '15px',
    color: 'var(--foreground)',
    fontWeight: '500',
    padding: '12px 0',
    backgroundColor: 'transparent',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--border)',
    margin: '0 8px',
  },
  button: {
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    marginInlineStart: '8px',
    transition: 'all 0.2s ease',
  }
};

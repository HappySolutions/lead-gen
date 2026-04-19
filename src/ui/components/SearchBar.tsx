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
        <Search size={18} style={isRTL ? styles.iconAr : styles.icon} />
        <input
          type="text"
          placeholder={t.search.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.input}
          required
        />
      </div>
      <div style={styles.divider} />
      <div style={styles.inputGroup}>
        <MapPin size={18} style={isRTL ? styles.iconAr : styles.icon} />
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
          marginLeft: isRTL ? '0' : '8px',
          marginRight: isRTL ? '8px' : '0',
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
    backgroundColor: '#fff',
    padding: '8px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    border: '1px solid #e2e8f0',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    padding: '0 12px',
  },
  icon: {
    color: '#94a3b8',
    marginRight: '12px',
  },
  iconAr: {
    color: '#94a3b8',
    marginLeft: '12px',
  },
  input: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '15px',
    color: '#1e293b',
    fontWeight: '500',
    padding: '12px 0',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#e2e8f0',
    margin: '0 8px',
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    marginLeft: '8px',
    transition: 'all 0.2s ease',
  }
};

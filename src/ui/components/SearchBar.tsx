'use client';

import React, { useState } from 'react';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface SearchBarProps {
  onSearch: (query: string, location: string, service: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const { t } = useTranslation();
  const [query,    setQuery]    = useState('');
  const [location, setLocation] = useState('');
  const [service,  setService]  = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query && location) onSearch(query, location, service);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.wrapper}>
      {/* Row 1: what they sell */}
      <div style={styles.row}>
        <div style={styles.inputGroup}>
          <Briefcase size={16} style={styles.icon} />
          <input
            type="text"
            placeholder={t.search.servicePlaceholder}
            value={service}
            onChange={(e) => setService(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.dividerH} />

      {/* Row 2: who to target + where */}
      <div style={styles.row}>
        <div style={styles.inputGroup}>
          <Search size={16} style={styles.icon} />
          <input
            type="text"
            placeholder={t.search.queryPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.dividerV} />
        <div style={{ ...styles.inputGroup, flex: '0 0 200px' }}>
          <MapPin size={16} style={styles.icon} />
          <input
            type="text"
            placeholder={t.search.locationPlaceholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{ ...styles.button, opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? t.search.searching : t.search.button}
        </button>
      </div>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    backgroundColor: 'var(--card)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid var(--border)',
    width: '100%',
    maxWidth: '860px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    padding: '0 10px',
  },
  icon: {
    color: 'var(--muted-foreground)',
    marginRight: '10px',
    flexShrink: 0,
  },
  input: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    color: 'var(--foreground)',
    padding: '12px 0',
    backgroundColor: 'transparent',
  },
  dividerH: {
    height: '1px',
    backgroundColor: 'var(--secondary)',
    margin: '0 12px',
  },
  dividerV: {
    width: '1px',
    height: '20px',
    backgroundColor: 'var(--border)',
    margin: '0 4px',
    flexShrink: 0,
  },
  button: {
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
    padding: '11px 22px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: '4px',
  },
};

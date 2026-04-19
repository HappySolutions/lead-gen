'use client';

import React from 'react';
import { SearchFilters } from '@/core/types';
import { Filter, SortAsc } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface FiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export const Filters: React.FC<FiltersProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();
  
  const toggleFilter = (key: keyof Pick<SearchFilters, 'hasWebsite' | 'hasPhone'>) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, sortBy: e.target.value as any });
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <Filter size={16} color="#64748b" />
        <button 
          onClick={() => toggleFilter('hasWebsite')}
          style={filters.hasWebsite ? styles.activeFilter : styles.filter}
        >
          {t.filters.hasWebsite}
        </button>
        <button 
          onClick={() => toggleFilter('hasPhone')}
          style={filters.hasPhone ? styles.activeFilter : styles.filter}
        >
          {t.filters.hasPhone}
        </button>
      </div>

      <div style={styles.section}>
        <SortAsc size={16} color="#64748b" />
        <span style={styles.sortLabel}>{t.filters.sortBy}</span>
        <select 
          value={filters.sortBy} 
          onChange={handleSortChange}
          style={styles.select}
        >
          <option value="score">{t.filters.sortOptions.score}</option>
          <option value="rating">{t.filters.sortOptions.rating}</option>
          <option value="reviews">{t.filters.sortOptions.reviews}</option>
        </select>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    marginTop: '24px',
    borderBottom: '1px solid #e2e8f0',
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filter: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
  },
  activeFilter: {
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2563eb',
    cursor: 'pointer',
  },
  select: {
    border: '1px solid #e2e8f0',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    outline: 'none',
    backgroundColor: '#fff',
  }
};

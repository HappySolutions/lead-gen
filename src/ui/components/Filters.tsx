'use client';

import React from 'react';
import { SearchFilters } from '@/core/types';
import { Filter, SortAsc, Star } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface FiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export const Filters: React.FC<FiltersProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();
  const toggle = (key: keyof Pick<SearchFilters, 'hasWebsite' | 'hasPhone' | 'hasEmail'>) =>
    onChange({ ...filters, [key]: !filters[key] });

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <Filter size={14} color="#94a3b8" />
        {(['hasWebsite', 'hasPhone', 'hasEmail'] as const).map((key) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={filters[key] ? styles.active : styles.pill}
          >
            {{ hasWebsite: t.filters.hasWebsite, hasPhone: t.filters.hasPhone, hasEmail: t.filters.hasEmail }[key]}
          </button>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sliderContainer}>
          <Star size={14} color="#f59e0b" fill="#f59e0b" />
          <span style={styles.sliderLabel}>{t.filters.minRating}: {filters.minRating}</span>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.minRating}
            onChange={(e) => onChange({ ...filters, minRating: parseFloat(e.target.value) })}
            style={styles.slider}
          />
        </div>

        <SortAsc size={14} color="#94a3b8" />
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SearchFilters['sortBy'] })}
          style={styles.select}
        >
          <option value="score">{t.filters.sortBy}: {t.filters.sortOptions.score}</option>
          <option value="rating">{t.filters.sortBy}: {t.filters.sortOptions.rating}</option>
          <option value="reviews">{t.filters.sortBy}: {t.filters.sortOptions.reviews}</option>
          <option value="name">{t.filters.sortBy}: {t.filters.sortOptions.name}</option>
        </select>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--secondary)', marginBottom: '8px', flexWrap: 'wrap', gap: '16px' },
  section:    { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  pill:       { backgroundColor: 'var(--card)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', color: 'var(--muted)', cursor: 'pointer' },
  active:     { backgroundColor: 'var(--accent)', border: '1px solid var(--primary)', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--accent-foreground)', cursor: 'pointer' },
  select:     { border: '1px solid var(--border)', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', color: 'var(--secondary-foreground)', outline: 'none', backgroundColor: 'var(--card)' },
  sliderContainer: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '8px' },
  sliderLabel: { fontSize: '12px', fontWeight: '500', color: 'var(--muted)', minWidth: '80px' },
  slider: { width: '80px', height: '4px', cursor: 'pointer', accentColor: '#6366f1' },
};

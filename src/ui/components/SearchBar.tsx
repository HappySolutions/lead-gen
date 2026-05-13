'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Briefcase, Target } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';
import styles from './SearchBar.module.css';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchBarProps {
  onSearch: (query: string, location: string, service: string, lat?: number, lng?: number) => void;
  isLoading: boolean;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 500;
const LOCATION_LISTBOX_ID = 'search-location-suggestions';

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const { t, isRTL } = useTranslation();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(input)}&countrycodes=eg&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'LeadGeni-MVP/1.0 (contact@leadgeni.io)' },
        signal: ac.signal,
      });
      if (!res.ok) return;
      const data: NominatimResult[] = await res.json();
      if (ac.signal.aborted) return;
      setSuggestions(data);
      setIsOpen(data.length > 0);
      setActiveIdx(-1);
    } catch {
      /* AbortError or network failure — silently ignore */
    }
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocation(val);
    setCoords(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS);
  };

  const selectSuggestion = (item: NominatimResult) => {
    setLocation(item.display_name);
    setCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
    setIsOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIdx(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query && location) onSearch(query, location, service, coords?.lat, coords?.lng);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.wrapper}
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={t.search.button}
    >
      <div className={styles.stack}>
        <div
          className={`${styles.capsule}${isOpen && suggestions.length > 0 ? ` ${styles.capsuleOpen}` : ''}`}
        >
          <div className={styles.cell}>
            <Briefcase size={18} strokeWidth={1.75} className={styles.icon} aria-hidden />
            <input
              type="text"
              className={styles.input}
              placeholder={t.search.servicePlaceholder}
              value={service}
              onChange={(e) => setService(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.cell}>
            <Target size={18} strokeWidth={1.75} className={styles.icon} aria-hidden />
            <input
              type="text"
              className={styles.input}
              placeholder={t.search.queryPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div
            ref={wrapperRef}
            className={`${styles.cell} ${styles.cellLocation}`}
          >
            <MapPin size={18} strokeWidth={1.75} className={styles.icon} aria-hidden />
            <input
              type="text"
              className={styles.input}
              placeholder={t.search.locationPlaceholder}
              value={location}
              onChange={handleLocationChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              required
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={LOCATION_LISTBOX_ID}
              aria-autocomplete="list"
              aria-activedescendant={activeIdx >= 0 ? `loc-option-${activeIdx}` : undefined}
            />
            {isOpen && suggestions.length > 0 && (
              <ul
                id={LOCATION_LISTBOX_ID}
                className={styles.dropdown}
                role="listbox"
                aria-label={t.search.locationPlaceholder}
              >
                {suggestions.map((item, idx) => (
                  <li
                    key={`${item.lat}-${item.lon}`}
                    id={`loc-option-${idx}`}
                    role="option"
                    aria-selected={idx === activeIdx}
                    className={`${styles.dropdownItem} ${idx === activeIdx ? styles.dropdownItemActive : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <MapPin size={12} strokeWidth={2} style={{ flexShrink: 0, color: 'var(--muted-foreground)' }} aria-hidden />
                    <span className={styles.dropdownText}>{item.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          type="submit"
          className={styles.submit}
          disabled={isLoading}
        >
          {isLoading ? t.search.searching : t.search.button}
        </button>
      </div>
    </form>
  );
};

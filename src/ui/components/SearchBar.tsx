'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

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

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const { t } = useTranslation();
  const [query,       setQuery]       = useState('');
  const [location,    setLocation]    = useState('');
  const [service,     setService]     = useState('');
  const [coords,      setCoords]      = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions]  = useState<NominatimResult[]>([]);
  const [isOpen,      setIsOpen]      = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);

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

  // Close dropdown on click outside
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

  // Cleanup timers on unmount
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
        <div ref={wrapperRef} style={{ ...styles.inputGroup, flex: '0 0 200px', position: 'relative' }}>
          <MapPin size={16} style={styles.icon} />
          <input
            type="text"
            placeholder={t.search.locationPlaceholder}
            value={location}
            onChange={handleLocationChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            style={styles.input}
            required
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-activedescendant={activeIdx >= 0 ? `loc-option-${activeIdx}` : undefined}
          />
          {isOpen && suggestions.length > 0 && (
            <ul style={styles.dropdown} role="listbox">
              {suggestions.map((item, idx) => (
                <li
                  key={`${item.lat}-${item.lon}`}
                  id={`loc-option-${idx}`}
                  role="option"
                  aria-selected={idx === activeIdx}
                  style={{
                    ...styles.dropdownItem,
                    backgroundColor: idx === activeIdx ? 'var(--secondary)' : 'transparent',
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(item)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <MapPin size={12} style={{ marginRight: '8px', flexShrink: 0, color: 'var(--muted-foreground)' }} />
                  <span style={styles.dropdownText}>{item.display_name}</span>
                </li>
              ))}
            </ul>
          )}
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
    overflow: 'visible',
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    listStyle: 'none',
    margin: '4px 0 0 0',
    padding: '4px 0',
    maxHeight: '240px',
    overflowY: 'auto',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--foreground)',
    transition: 'background-color 0.1s',
  },
  dropdownText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
};

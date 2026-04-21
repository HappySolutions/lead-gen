'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SearchBar } from '@/ui/components/SearchBar';
import { LeadCard } from '@/ui/components/LeadCard';
import { Filters } from '@/ui/components/Filters';
import { LeadDetails } from '@/ui/components/LeadDetails';
import { LanguageToggle } from '@/ui/components/LanguageToggle';
import { ThemeToggle } from '@/ui/components/ThemeToggle';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Lead, SearchFilters } from '@/core/types';
import { Download, Target, TrendingUp, LayoutDashboard, Lock } from 'lucide-react';

// ─── Free tier: first 5 leads show full data, rest are blurred ───────────────
const FREE_TIER_LIMIT = 5;

export default function Home() {
  const { t, language } = useTranslation();
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUnlocked,   setIsUnlocked]   = useState(false); // paid tier toggle
  const [lastSearch,   setLastSearch]   = useState<{ query: string; location: string; service: string } | null>(null);
  const lastSearchRef = useRef<{ query: string; location: string; service: string } | null>(null);
  const [filters,      setFilters]      = useState<SearchFilters>({
    hasWebsite: false,
    hasPhone:   false,
    hasEmail:   false,
    sortBy:     'score',
  });

  const runSearch = async (
    query: string,
    location: string,
    service: string,
    lang: string
  ) => {
    setLoading(true);
    setError(null);
    const payload = { query, location, service };
    setLastSearch(payload);
    lastSearchRef.current = payload;
    try {
      const url = `/api/leads?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}&service=${encodeURIComponent(service)}&lang=${encodeURIComponent(lang)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error ?? 'Search failed');
      }
      setLeads(await resp.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, location: string, service: string) => {
    await runSearch(query, location, service, language);
  };

  // If the user switches language after searching, re-run the last search so
  // server-generated fields (like AI insights) match the selected language.
  const lastLanguageRef = useRef(language);
  useEffect(() => {
    if (lastLanguageRef.current === language) return;
    lastLanguageRef.current = language;
    const s = lastSearchRef.current;
    if (!s) return;
    void runSearch(s.query, s.location, s.service, language);
  }, [language]);

  const processedLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (filters.hasWebsite && !lead.website) return false;
        if (filters.hasPhone   && !lead.phone)   return false;
        if (filters.hasEmail   && !lead.email)   return false;
        return true;
      })
      .sort((a, b) =>
        filters.sortBy === 'score' ? b.score - a.score :
        filters.sortBy === 'name'  ? a.name.localeCompare(b.name) : 0
      );
  }, [leads, filters]);

  const exportToCSV = () => {
    if (!isUnlocked) { alert('Upgrade to export leads'); return; }
    const headers = ['Name', 'Category', 'Address', 'Phone', 'Email', 'Website', 'LinkedIn', 'Score', 'Gaps'];
    const rows = processedLeads.map((l) => [
      l.name, l.category, l.address,
      l.phone ?? '', l.email ?? '', l.website ?? '',
      l.socialLinks?.linkedin ?? '',
      l.score,
      (l.serviceGaps ?? []).join('; '),
    ]);
    const csv  = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `leads-${Date.now()}.csv` });
    a.click();
  };

  const lockedCount = Math.max(0, processedLeads.length - FREE_TIER_LIMIT);

  return (
    <main style={styles.container}>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.branding}>
          <div style={styles.logo}><Target size={22} color="#fff" /></div>
          <div>
            <h1 style={styles.h1}>{t.branding.name}</h1>
            <p style={styles.subtitle}>{t.header.subtitle}</p>
          </div>
        </div>
        <div style={styles.actions}>
          <ThemeToggle />
          <LanguageToggle />
          {leads.length > 0 && (
            <div style={styles.stat}>
              <TrendingUp size={14} color="#10b981" />
              <span>{leads.length} {t.leads.found}</span>
            </div>
          )}
        </div>
      </header>

      {/* Hero + search */}
      <section style={styles.heroSection}>
        <h2 style={styles.heroTitle}>{t.hero.title}</h2>
        <p style={styles.heroSub}>
          {t.hero.description}
        </p>
        <SearchBar onSearch={handleSearch} isLoading={loading} />
      </section>

      {/* Results */}
      {processedLeads.length > 0 && (
        <div>
          <div style={styles.resultsBar}>
            <Filters filters={filters} onChange={setFilters} />
            <button onClick={exportToCSV} style={styles.exportBtn}>
              {isUnlocked ? <Download size={14} /> : <Lock size={14} />}
              <span style={{ marginLeft: '6px' }}>
                {isUnlocked ? t.leads.export : t.leads.exportUpgrade}
              </span>
            </button>
          </div>

          <div style={styles.grid}>
            {processedLeads.map((lead, i) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                locked={!isUnlocked && i >= FREE_TIER_LIMIT}
                onViewDetails={isUnlocked || i < FREE_TIER_LIMIT ? setSelectedLead : undefined}
              />
            ))}
          </div>

          {/* Upgrade prompt */}
          {!isUnlocked && lockedCount > 0 && (
            <div style={styles.upgradeBox}>
              <Lock size={20} color="#6366f1" />
              <div style={styles.upgradeText}>
                <strong>{t.leads.upgradeHiddenLeads(lockedCount)}</strong> {t.leads.upgradeDescription}
              </div>
              {/* Replace onClick with your Stripe/payment link */}
              <button onClick={() => setIsUnlocked(true)} style={styles.upgradeBtn}>
                {t.leads.unlockAllLeads}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedLead && (
        <LeadDetails lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Empty state */}
      {!loading && leads.length === 0 && !error && (
        <div style={styles.empty}>
          <LayoutDashboard size={44} color="#e2e8f0" />
          <h3 style={styles.emptyTitle}>{t.emptyState.title}</h3>
          <p style={styles.emptySub}>
            {t.emptyState.description}
          </p>
        </div>
      )}

      {error && <div style={styles.errorBox}>{error}</div>}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container:   { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 32px' },
  branding:    { display: 'flex', alignItems: 'center', gap: '14px' },
  logo:        { backgroundColor: '#6366f1', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  h1:          { fontSize: '22px', fontWeight: '700', color: 'var(--foreground)', margin: 0 },
  subtitle:    { fontSize: '13px', color: 'var(--muted)', margin: 0 },
  actions:     { display: 'flex', alignItems: 'center', gap: '16px' },
  stat:        { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-foreground)', backgroundColor: 'var(--card)', padding: '6px 14px', borderRadius: '100px', border: '1px solid var(--border)' },
  heroSection: { textAlign: 'center', padding: '20px 0 56px', maxWidth: '860px', margin: '0 auto' },
  heroTitle:   { fontSize: '2.4rem', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em', margin: '0 0 16px' },
  heroSub:     { fontSize: '16px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 auto 32px', maxWidth: '580px' },
  resultsBar:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' },
  exportBtn:   { display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' },
  upgradeBox:  { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '20px 24px', marginBottom: '48px', flexWrap: 'wrap' },
  upgradeText: { flex: 1, fontSize: '14px', color: '#3730a3', lineHeight: '1.5' },
  upgradeBtn:  { backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', flexShrink: 0 },
  empty:       { textAlign: 'center', padding: '80px 0', color: '#94a3b8' },
  emptyTitle:  { fontSize: '20px', fontWeight: '600', color: '#475569', margin: '16px 0 8px' },
  emptySub:    { fontSize: '14px', color: '#94a3b8', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' },
  errorBox:    { padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', border: '1px solid #fecaca', marginTop: '20px', fontSize: '14px' },
};

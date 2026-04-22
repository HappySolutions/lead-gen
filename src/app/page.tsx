'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar }    from '@/ui/components/SearchBar';
import { LeadCard }     from '@/ui/components/LeadCard';
import { LeadCardSkeleton } from '@/ui/components/LeadCardSkeleton';
import { Filters }      from '@/ui/components/Filters';
import { LeadDetails }  from '@/ui/components/LeadDetails';
import { LanguageToggle } from '@/ui/components/LanguageToggle';
import { ThemeToggle }    from '@/ui/components/ThemeToggle';
import { Lead, SearchFilters } from '@/core/types';
import { createBrowserClient } from '@/lib/supabase.browser';
import { Download, Target, TrendingUp, LayoutDashboard, Lock, MapPin, LogOut, Filter } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_CARDS     = 3;   // how many cards are fully visible on free tier
const WHATSAPP_NUMBER = '01282048435'; // replace with your number e.g. 201234567890

const LOADING_STEPS = [
  { label: 'Searching Google Maps...',    duration: 8_000  },
  { label: 'Collecting business data...', duration: 10_000 },
  { label: 'Scraping contact details...', duration: 8_000  },
  { label: 'Enriching website data...',   duration: 6_000  },
  { label: 'Scoring leads...',            duration: 3_000  },
  { label: 'Generating outreach tips...', duration: 5_000  },
];

// ─── User profile shape ───────────────────────────────────────────────────────
interface UserProfile {
  id:             string;
  email:          string;
  is_paid:        boolean;
  searches_used:  number;
  searches_limit: number;
}


// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const supabase = createBrowserClient();

  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [lastQuery,    setLastQuery]    = useState({ q: '', loc: '' });
  const [filters,      setFilters]      = useState<SearchFilters>({
    hasWebsite: false, hasPhone: false, hasEmail: false,
    minRating: 0, sortBy: 'score',
  });

  // ── Load user profile on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((p) => p && setProfile(p))
      .catch(() => {});
  }, []);

  const router = useRouter();

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setProfile(null); // Clear UI immediately
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = async (query: string, location: string, service: string) => {
    setLoading(true);
    setError(null);
    setLimitReached(false);
    // Note: We don't clear leads here to prevent a flash of empty state. 
    // The loading skeletons will overlay/replace the view based on 'loading' state.
    setLastQuery({ q: query, loc: location });

    try {
      const url = `/api/leads?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}&service=${encodeURIComponent(service)}`;
      const resp = await fetch(url);

      if (resp.status === 403) {
        const body = await resp.json();
        if (body.error === 'SEARCH_LIMIT_REACHED') {
          setLimitReached(true);
          setLoading(false);
          return;
        }
      }

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error ?? 'Search failed');
      }

      const data = await resp.json();

      // Update local searches_used counter from response header
      const used = resp.headers.get('X-Searches-Used');
      if (used && profile) {
        setProfile((p) => p ? { ...p, searches_used: Number(used) } : p);
      }

      setLeads(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ── WhatsApp upgrade redirect ──────────────────────────────────────────────
  const handleUpgrade = () => {
    const msg = encodeURIComponent(
      `Hi, I want to upgrade my LeadGeni account.\nEmail: ${profile?.email ?? 'unknown'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  // ── Filters + sort ─────────────────────────────────────────────────────────
  const processedLeads = useMemo(() => {
    return leads
      .filter((l) => {
        if (filters.hasWebsite && !l.website) return false;
        if (filters.hasPhone   && !l.phone)   return false;
        if (filters.hasEmail   && !l.email)   return false;
        // If minRating is > 0, hide leads with no rating or lower rating
        if (filters.minRating > 0 && (l.rating ?? 0) < filters.minRating) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'score')   return b.score - a.score;
        if (filters.sortBy === 'rating') {
          const rA = a.rating ?? -1; // Push undefined to bottom
          const rB = b.rating ?? -1;
          return rB - rA;
        }
        if (filters.sortBy === 'reviews') {
          const vA = a.reviews ?? -1;
          const vB = b.reviews ?? -1;
          return vB - vA;
        }
        if (filters.sortBy === 'name')    return a.name.localeCompare(b.name);
        return 0;
      });
  }, [leads, filters]);

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (!profile?.is_paid) { handleUpgrade(); return; }
    const headers = ['Name', 'Category', 'Address', 'Phone', 'Email', 'Website', 'Rating', 'Reviews', 'Score'];
    const rows = processedLeads.map((l) => [
      l.name, l.category, l.address, l.phone ?? '', l.email ?? '',
      l.website ?? '', l.rating ?? '', l.reviews ?? '', l.score,
    ]);
    const csv  = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `leads-${Date.now()}.csv` }).click();
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const isPaid      = profile?.is_paid ?? false;
  const searchesLeft = profile 
    ? Math.max(0, (profile.searches_limit ?? 3) - (profile.searches_used ?? 0)) 
    : null;
  const lockedCount  = isPaid ? 0 : Math.max(0, processedLeads.length - FREE_CARDS);

  return (
    <main style={styles.container}>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.branding}>
          <div style={styles.logo}><Target size={22} color="#fff" /></div>
          <div>
            <h1 style={styles.h1}>LeadGeni</h1>
            <p style={styles.subtitle}>Find businesses that need what you sell</p>
          </div>
        </div>
        <div style={styles.actions}>
          <ThemeToggle />
          <LanguageToggle />

          {/* Search counter badge */}
          {!profile ? (
            <div className="skeleton" style={{ width: 100, height: 28, borderRadius: 100 }} />
          ) : (
            <>
              {!isPaid && (
                <div style={{ ...styles.badge, ...(searchesLeft === 0 ? styles.badgeWarn : {}) }}>
                  {searchesLeft === 0
                    ? '0 searches left'
                    : `${searchesLeft} search${searchesLeft === 1 ? '' : 'es'} left`
                  }
                </div>
              )}
              {isPaid && <div style={styles.badgePaid}>Pro</div>}
            </>
          )}

          {leads.length > 0 && (
            <div style={styles.stat}><TrendingUp size={14} color="#10b981" /><span>{leads.length} leads</span></div>
          )}

          {/* Sign out */}
          {!profile ? (
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8 }} />
          ) : (
            <button onClick={handleSignOut} style={styles.signOutBtn} title="Sign out">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Hero + search */}
      <section style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Find businesses that need what you sell</h2>
        <p style={styles.heroSub}>
          Powered by Google Maps. Real ratings, reviews, and contact data — ranked by fit for your service.
        </p>
        <SearchBar onSearch={handleSearch} isLoading={loading} />
      </section>

      {/* Search limit reached */}
      {limitReached && (
        <div style={styles.limitBox}>
          <Lock size={20} color="#6366f1" />
          <div style={styles.upgradeText}>
            <strong>You've used all {profile?.searches_limit} free searches.</strong> Contact us on WhatsApp to upgrade and get unlimited access.
          </div>
          <button onClick={handleUpgrade} style={styles.whatsappBtn}>
            Upgrade via WhatsApp
          </button>
        </div>
      )}

      {/* Results or Loading Skeletons */}
      {(loading || leads.length > 0) && !limitReached && (
        <div>
          <div style={styles.resultsBar}>
            <Filters filters={filters} onChange={setFilters} />
            <button onClick={exportToCSV} style={styles.exportBtn}>
              {isPaid ? <Download size={14} /> : <Lock size={14} />}
              <span style={{ marginLeft: '6px' }}>{isPaid ? 'Export CSV' : 'Export CSV'}</span>
            </button>
          </div>

          <div style={styles.grid}>
            {loading ? (
              // Show 6 skeletons during loading
              Array.from({ length: 6 }).map((_, i) => (
                <LeadCardSkeleton key={i} />
              ))
            ) : processedLeads.length > 0 ? (
              // Show actual leads
              processedLeads.map((lead, i) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  locked={!isPaid && i >= FREE_CARDS}
                  onViewDetails={isPaid || i < FREE_CARDS ? setSelectedLead : undefined}
                />
              ))
            ) : (
              <div style={styles.noResults}>
                <Filter size={32} color="var(--muted-foreground)" />
                <p>No results match your current filters. Try adjusting the rating or requirements.</p>
              </div>
            )}
          </div>

          {/* Upgrade prompt at bottom of results */}
          {!loading && !isPaid && lockedCount > 0 && (
            <div style={styles.upgradeBox}>
              <Lock size={20} color="#6366f1" />
              <div style={styles.upgradeText}>
                <strong>{lockedCount} more leads are hidden.</strong> Pay once and get full access to all leads, contact info, and CSV export.
              </div>
              <button onClick={handleUpgrade} style={styles.whatsappBtn}>
                Unlock via WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {selectedLead && (
        <LeadDetails lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Empty state */}
      {!loading && !limitReached && leads.length === 0 && !error && (
        <div style={styles.empty}>
          <LayoutDashboard size={44} color="#e2e8f0" />
          <h3 style={styles.emptyTitle}>Ready to find clients?</h3>
          <p style={styles.emptySub}>
            Enter what you sell and who to target.
            {profile && !isPaid && searchesLeft !== null && (
              <> You have <strong>{searchesLeft} free search{searchesLeft === 1 ? '' : 'es'}</strong> remaining.</>
            )}
          </p>
        </div>
      )}

      {error && <div style={styles.errorBox}>{error}</div>}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container:   { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 32px', flexWrap: 'wrap', gap: '12px' },
  branding:    { display: 'flex', alignItems: 'center', gap: '14px' },
  logo:        { backgroundColor: '#6366f1', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  h1:          { fontSize: '22px', fontWeight: '700', color: 'var(--foreground)', margin: 0 },
  subtitle:    { fontSize: '13px', color: 'var(--muted)', margin: 0 },
  actions:     { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  badge:       { fontSize: '12px', fontWeight: '600', color: 'var(--secondary-foreground)', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '100px' },
  badgeWarn:   { color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  badgePaid:   { fontSize: '12px', fontWeight: '700', color: '#059669', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '5px 12px', borderRadius: '100px' },
  stat:        { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-foreground)', backgroundColor: 'var(--card)', padding: '6px 14px', borderRadius: '100px', border: '1px solid var(--border)' },
  signOutBtn:  { display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted)', cursor: 'pointer' },
  heroSection: { textAlign: 'center', padding: '20px 0 56px', maxWidth: '860px', margin: '0 auto' },
  heroTitle:   { fontSize: '2.4rem', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em', margin: '0 0 16px' },
  heroSub:     { fontSize: '16px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 auto 32px', maxWidth: '580px' },
  resultsBar:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' },
  exportBtn:   { display: 'flex', alignItems: 'center', backgroundColor: 'var(--foreground)', color: 'var(--background)', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' },
  limitBox:    { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', flexWrap: 'wrap' },
  upgradeBox:  { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginBottom: '48px', flexWrap: 'wrap' },
  upgradeText: { flex: 1, fontSize: '14px', color: 'var(--secondary-foreground)', lineHeight: '1.5' },
  whatsappBtn: { backgroundColor: '#25d366', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', flexShrink: 0 },
  empty:       { textAlign: 'center', padding: '80px 0', color: 'var(--muted-foreground)' },
  emptyTitle:  { fontSize: '20px', fontWeight: '600', color: 'var(--muted)', margin: '16px 0 8px' },
  emptySub:    { fontSize: '14px', color: 'var(--muted-foreground)', maxWidth: '420px', margin: '0 auto', lineHeight: '1.6' },
  errorBox:    { padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', border: '1px solid #fecaca', marginTop: '20px', fontSize: '14px' },
  noResults:   { gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
};

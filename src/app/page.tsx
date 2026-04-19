'use client';

import React, { useState, useMemo } from 'react';
import { SearchBar } from '@/ui/components/SearchBar';
import { LeadCard } from '@/ui/components/LeadCard';
import { Filters } from '@/ui/components/Filters';
import { LeadDetails } from '@/ui/components/LeadDetails';
import { LanguageToggle } from '@/ui/components/LanguageToggle';
import { Lead, SearchFilters } from '@/core/types';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Download, Database, TrendingUp, LayoutDashboard } from 'lucide-react';

export default function Home() {
  const { t, isRTL } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    hasWebsite: false,
    hasPhone: false,
    minRating: 0,
    sortBy: 'score',
  });

  const handleSearch = async (query: string, location: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/leads?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}`);
      if (!resp.ok) throw new Error('Failed to fetch leads');
      const data = await resp.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processedLeads = useMemo(() => {
    let result = leads.filter(lead => {
      if (filters.hasWebsite && !lead.website) return false;
      if (filters.hasPhone && !lead.phone) return false;
      return true;
    });

    // Create a new array reference before sorting
    return [...result].sort((a, b) => {
      if (filters.sortBy === 'score') return b.score - a.score;
      if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (filters.sortBy === 'reviews') return (b.reviews || 0) - (a.reviews || 0);
      return 0;
    });
  }, [leads, filters]);

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Address', 'Phone', 'Website', 'Rating', 'Score'];
    const rows = processedLeads.map(l => [
      l.name, l.category, l.address, l.phone || '', l.website || '', l.rating || '', l.score
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <main className="container">
      <header style={styles.header}>
        <div style={styles.branding}>
          <div style={styles.logo}>
            <Database size={24} color="#fff" />
          </div>
          <div>
            <h1 style={styles.h1}>{t.branding.name}</h1>
            <p style={styles.subtitle}>{t.branding.tagline}</p>
          </div>
        </div>
        
        <div style={styles.actions}>
          <LanguageToggle />
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <TrendingUp size={16} color="#10b981" />
              <span>{leads.length} {t.leads.found}</span>
            </div>
          </div>
        </div>
      </header>

      <section style={styles.searchSection}>
        <div style={styles.heroText}>
          <h2 style={{ fontSize: isRTL ? '2rem' : '2.5rem' }}>{isRTL ? 'جد عملاءك المثاليين' : 'Find your next big client'}</h2>
          <p>{isRTL ? 'ابحث في ملايين الشركات مع نظام تقييم الجودة الآلي.' : 'Search millions of businesses with automated lead quality scoring.'}</p>
        </div>
        <SearchBar onSearch={handleSearch} isLoading={loading} />
      </section>

      {leads.length > 0 && (
        <div className="animate-in" style={{ animationDelay: '0.2s' }}>
          <div style={styles.resultsHeader}>
            <Filters filters={filters} onChange={setFilters} />
            <button onClick={exportToCSV} style={styles.exportButton}>
              <Download size={16} style={{ [isRTL ? 'marginLeft' : 'marginRight']: '8px' }} />
              {t.leads.export}
            </button>
          </div>

          <div style={styles.grid}>
            {processedLeads.map((lead) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                onViewDetails={setSelectedLead}
              />
            ))}
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadDetails 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
        />
      )}

      {!loading && leads.length === 0 && !error && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <LayoutDashboard size={48} color="#e2e8f0" />
          </div>
          <h3>{t.emptyState.title}</h3>
          <p>{t.emptyState.description}</p>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <p>Error: {error}</p>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 0',
    marginBottom: '40px',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    backgroundColor: '#6366f1',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  h1: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '2px',
    fontFamily: 'var(--font-heading)',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  stats: {
    backgroundColor: '#fff',
    padding: '8px 16px',
    borderRadius: '100px',
    border: '1px solid #e2e8f0',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
  searchSection: {
    textAlign: 'center',
    marginBottom: '60px',
    padding: '40px 0',
  },
  heroText: {
    marginBottom: '32px',
    maxWidth: '600px',
    margin: '0 auto 32px auto',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
    marginBottom: '60px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '100px 0',
    color: '#64748b',
  },
  emptyIcon: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  errorBox: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    textAlign: 'center',
    marginTop: '20px',
  }
};

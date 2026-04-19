'use client';

import React, { useState, useMemo } from 'react';
import { SearchBar } from '@/ui/components/SearchBar';
import { LeadCard } from '@/ui/components/LeadCard';
import { Filters } from '@/ui/components/Filters';
import { Lead, SearchFilters } from '@/core/types';
import { Download, LayoutDashboard, Database, TrendingUp } from 'lucide-react';

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    return result.sort((a, b) => {
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
            <h1 style={styles.h1}>LeadGen MVP</h1>
            <p style={styles.subtitle}>B2B Business Prospecting Engine</p>
          </div>
        </div>
        
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <TrendingUp size={16} color="#10b981" />
            <span>{leads.length} leads found</span>
          </div>
        </div>
      </header>

      <section style={styles.searchSection}>
        <div style={styles.heroText}>
          <h2>Find your next big client</h2>
          <p>Search millions of businesses with automated lead quality scoring.</p>
        </div>
        <SearchBar onSearch={handleSearch} isLoading={loading} />
      </section>

      {leads.length > 0 && (
        <div className="animate-in" style={{ animationDelay: '0.2s' }}>
          <div style={styles.resultsHeader}>
            <Filters filters={filters} onChange={setFilters} />
            <button onClick={exportToCSV} style={styles.exportButton}>
              <Download size={16} style={{ marginRight: '8px' }} />
              Export CSV
            </button>
          </div>

          <div style={styles.grid}>
            {processedLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {!loading && leads.length === 0 && !error && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <LayoutDashboard size={48} color="#e2e8f0" />
          </div>
          <h3>Ready to start?</h3>
          <p>Enter a business type and location to generate leads.</p>
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
    marginBottom: '48px',
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
    fontSize: '20px',
    margin: 0,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },
  stats: {
    display: 'flex',
    gap: '24px',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500',
  },
  searchSection: {
    textAlign: 'center',
    marginBottom: '64px',
  },
  heroText: {
    marginBottom: '32px',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '32px',
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    height: 'fit-content',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 0',
    color: '#94a3b8',
  },
  emptyIcon: {
    marginBottom: '20px',
  },
  errorBox: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '12px',
    border: '1px solid #fee2e2',
    textAlign: 'center',
  }
};

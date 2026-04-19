'use client';

import React from 'react';
import { Lead } from '@/core/types';
import { Star, MapPin, Globe, Phone, Info, Zap } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface LeadCardProps {
  lead: Lead;
  onViewDetails?: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onViewDetails }) => {
  const { t, isRTL } = useTranslation();
  const isHighPotential = lead.score >= 75;

  const translatedScoreLabel = lead.score >= 75 ? t.leads.highPotential : (lead.score >= 40 ? t.leads.medium : t.leads.low);
  
  return (
    <div style={styles.card} className="animate-in">
      <div style={styles.header}>
        <div style={styles.mainInfo}>
          <h3 style={styles.title}>{lead.name}</h3>
          <span style={styles.category}>{lead.category}</span>
        </div>
        <div style={{
          ...styles.scoreBadge,
          backgroundColor: isHighPotential ? '#f0fdf4' : '#f8fafc',
          borderColor: isHighPotential ? '#bbf7d0' : '#e2e8f0',
          color: isHighPotential ? '#15803d' : '#64748b',
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }}>
          <Zap size={14} style={{ [isRTL ? 'marginLeft' : 'marginRight']: '6px' }} />
          <span style={styles.scoreText}>{lead.score}</span>
          <span style={styles.scoreLabel}>{translatedScoreLabel}</span>
        </div>
      </div>

      <div style={styles.ratingRow}>
        <div style={styles.stars}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < Math.floor(lead.rating || 0) ? '#f59e0b' : 'none'}
              color={i < Math.floor(lead.rating || 0) ? '#f59e0b' : '#cbd5e1'}
            />
          ))}
          <span style={styles.ratingText}>{lead.rating}</span>
          <span style={styles.reviewCount}>({lead.reviews || 0} {t.leads.reviews})</span>
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <MapPin size={14} style={styles.detailIcon} />
          <span>{lead.address}</span>
        </div>
        {lead.phone && (
          <div style={styles.detailItem}>
            <Phone size={14} style={styles.detailIcon} />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.website && (
          <div style={styles.detailItem}>
            <Globe size={14} style={styles.detailIcon} />
            <a href={lead.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
              {new URL(lead.website).hostname}
            </a>
          </div>
        )}
      </div>

      {lead.aiInsights && (
        <div style={styles.aiBox}>
          <div style={styles.aiHeader}>
            <Info size={12} style={{ [isRTL ? 'marginLeft' : 'marginRight']: '6px' }} />
            <span>{t.leads.aiInsight}</span>
          </div>
          <p style={styles.aiText}>{lead.aiInsights}</p>
        </div>
      )}

      <button 
        onClick={(e) => {
          e.preventDefault();
          onViewDetails?.(lead);
        }}
        style={styles.moreButton}
      >
        {t.leads.viewDetails}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '18px',
    color: '#0f172a',
    fontWeight: '600',
  },
  category: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  scoreBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  scoreText: {
    fontSize: '15px',
    margin: '0 4px',
  },
  scoreLabel: {
    fontSize: '12px',
    opacity: 0.8,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
  },
  stars: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  ratingText: {
    marginLeft: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  reviewCount: {
    marginLeft: '6px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#475569',
  },
  detailIcon: {
    color: '#94a3b8',
    flexShrink: 0,
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
  },
  aiBox: {
    backgroundColor: '#f5f3ff',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ede9fe',
  },
  aiHeader: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  aiText: {
    fontSize: '12px',
    color: '#5b21b6',
    lineHeight: '1.5',
    margin: 0,
  },
  moreButton: {
    marginTop: '8px',
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'transparent',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 10,
  }
};

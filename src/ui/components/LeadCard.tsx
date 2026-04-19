'use client';

import React from 'react';
import { Lead } from '@/core/types';
import { MapPin, Globe, Phone, Info, Zap, Clock } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface LeadCardProps {
  lead: Lead;
  onViewDetails?: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onViewDetails }) => {
  const { t, isRTL } = useTranslation();
  const isHighPotential = lead.score >= 70;

  const translatedScoreLabel =
    lead.score >= 70 ? t.leads.highPotential : lead.score >= 40 ? t.leads.medium : t.leads.low;

  return (
    <div style={styles.card} className="animate-in">
      <div style={styles.header}>
        <div style={styles.mainInfo}>
          <h3 style={styles.title}>{lead.name}</h3>
          <span style={styles.category}>{lead.category}</span>
        </div>
        <div
          style={{
            ...styles.scoreBadge,
            backgroundColor: isHighPotential ? '#f0fdf4' : '#f8fafc',
            borderColor: isHighPotential ? '#bbf7d0' : '#e2e8f0',
            color: isHighPotential ? '#15803d' : '#64748b',
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}
        >
          <Zap size={14} style={{ [isRTL ? 'marginLeft' : 'marginRight']: '6px' }} />
          <span style={styles.scoreText}>{lead.score}</span>
          <span style={styles.scoreLabel}>{translatedScoreLabel}</span>
        </div>
      </div>

      {/* Only show rating row if real data exists */}
      {(lead.rating || lead.reviews) && (
        <div style={styles.ratingRow}>
          {lead.rating && (
            <span style={styles.ratingText}>★ {lead.rating.toFixed(1)}</span>
          )}
          {lead.reviews && (
            <span style={styles.reviewCount}>
              ({lead.reviews} {t.leads.reviews})
            </span>
          )}
        </div>
      )}

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
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              {(() => {
                try {
                  return new URL(lead.website).hostname;
                } catch {
                  return lead.website;
                }
              })()}
            </a>
          </div>
        )}
        {lead.openingHours && (
          <div style={styles.detailItem}>
            <Clock size={14} style={styles.detailIcon} />
            <span style={styles.hours}>{lead.openingHours}</span>
          </div>
        )}
      </div>

      {/* Score explanation pills */}
      {lead.scoreExplanation && (
        <div style={styles.scoreFactors}>
          {lead.scoreExplanation.split(' • ').map((factor) => (
            <span key={factor} style={styles.factorPill}>
              {factor}
            </span>
          ))}
        </div>
      )}

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
    gap: '14px',
    transition: 'all 0.3s ease',
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
    fontSize: '17px',
    color: '#0f172a',
    fontWeight: '600',
    margin: 0,
  },
  category: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'capitalize',
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
    gap: '4px',
  },
  scoreText: {
    fontSize: '15px',
  },
  scoreLabel: {
    fontSize: '11px',
    opacity: 0.8,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  ratingText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f59e0b',
  },
  reviewCount: {
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
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.5',
  },
  detailIcon: {
    color: '#94a3b8',
    flexShrink: 0,
    marginTop: '2px',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
  },
  hours: {
    fontSize: '12px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  scoreFactors: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  factorPill: {
    fontSize: '11px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    padding: '2px 8px',
    borderRadius: '100px',
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
    marginTop: '4px',
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'transparent',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

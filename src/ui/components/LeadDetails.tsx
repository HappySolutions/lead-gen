'use client';

import React from 'react';
import { Lead } from '@/core/types';
import { X, MapPin, Globe, Phone, Info, Zap, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface LeadDetailsProps {
  lead: Lead | null;
  onClose: () => void;
}

export const LeadDetails: React.FC<LeadDetailsProps> = ({ lead, onClose }) => {
  const { t, isRTL } = useTranslation();
  if (!lead) return null;

  return (
    <div style={styles.overlay} onClick={onClose} className="fade-in">
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        className="slide-up"
      >
        <button onClick={onClose} style={{ ...styles.closeBtn, [isRTL ? 'left' : 'right']: '24px' }}>
          <X size={20} />
        </button>

        <header style={{ ...styles.header, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <span style={styles.categoryBadge}>{lead.category}</span>
            <h2 style={styles.title}>{lead.name}</h2>
            <div style={{ ...styles.ratingRow, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[...Array(5)].map((_, i) => (
                  <Zap
                    key={i}
                    size={14}
                    fill={i < Math.floor(lead.rating || 0) ? '#f59e0b' : 'none'}
                    color={i < Math.floor(lead.rating || 0) ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </div>
              <span style={styles.ratingText}>{lead.rating}</span>
              <span style={styles.reviewsText}>({lead.reviews} {t.leads.reviews})</span>
            </div>
          </div>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreValue}>{lead.score}</span>
            <span style={styles.scoreLabel}>/ 100</span>
          </div>
        </header>

        <div style={styles.content}>
          <div style={{ ...styles.mainGrid, direction: isRTL ? 'rtl' : 'ltr' }}>
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>{isRTL ? 'معلومات الاتصال' : 'Contact Information'}</h4>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <MapPin size={16} color="#94a3b8" />
                  <span>{lead.address}</span>
                </div>
                {lead.phone && (
                  <div style={styles.infoItem}>
                    <Phone size={16} color="#94a3b8" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.website && (
                  <div style={styles.infoItem}>
                    <Globe size={16} color="#94a3b8" />
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      {lead.website}
                    </a>
                  </div>
                )}
              </div>
              
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + lead.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.mapLink}
              >
                <ExternalLink size={16} />
                {isRTL ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}
              </a>
            </section>

            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>{isRTL ? 'تحليل AI والدرجات' : 'AI Analysis & Scoring'}</h4>
              <div style={styles.scoreBreakdown}>
                <ScoreBar label={isRTL ? 'جودة البيانات' : 'Data Quality'} value={lead.score >= 50 ? 90 : 60} color="#6366f1" />
                <ScoreBar label={isRTL ? 'الاكتمال' : 'Completeness'} value={lead.website && lead.phone ? 100 : 70} color="#10b981" />
                <ScoreBar label={isRTL ? 'مصداقية AI' : 'AI Credibility'} value={lead.score >= 75 ? 95 : 55} color="#f59e0b" />
              </div>
              
              {lead.aiInsights && (
                <div style={styles.aiInsights}>
                  <div style={{ ...styles.aiLabel, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <Info size={14} />
                    <span>{t.leads.aiInsight}</span>
                  </div>
                  <p style={styles.aiText}>{lead.aiInsights}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={styles.scoreBarContainer}>
    <div style={styles.scoreBarHeader}>
      <span style={styles.scoreBarLabel}>{label}</span>
      <span style={styles.scoreBarValue}>{value}%</span>
    </div>
    <div style={styles.scoreBarTrack}>
      <div style={{ ...styles.scoreBarFill, width: `${value}%`, backgroundColor: color }} />
    </div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '24px',
    userSelect: 'none',
  },
  modal: {
    backgroundColor: 'var(--card)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    userSelect: 'text',
  },
  closeBtn: {
    position: 'absolute',
    top: '24px',
    border: 'none',
    background: 'var(--secondary)',
    width: '36px',
    height: '36px',
    borderRadius: '1000px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--muted)',
    transition: 'all 0.2s',
  },
  header: {
    padding: '40px 40px 32px 40px',
    borderBottom: '1px solid var(--secondary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
  },
  categoryBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: '#eef2ff',
    padding: '4px 10px',
    borderRadius: '6px',
    marginBottom: '12px',
    display: 'inline-block',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--foreground)',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  ratingText: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--secondary-foreground)',
  },
  reviewsText: {
    fontSize: '14px',
    color: 'var(--muted-foreground)',
  },
  scoreCircle: {
    backgroundColor: 'var(--foreground)',
    color: 'var(--background)',
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)',
    flexShrink: 0,
  },
  scoreValue: {
    fontSize: '28px',
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: '10px',
    opacity: 0.6,
    fontWeight: '700',
  },
  content: {
    padding: '40px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontSize: '15px',
    color: 'var(--secondary-foreground)',
    lineHeight: '1.5',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '600',
  },
  mapLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    textDecoration: 'none',
    color: 'var(--secondary-foreground)',
    fontSize: '14px',
    fontWeight: '600',
    width: 'fit-content',
    marginTop: '12px',
    transition: 'all 0.2s',
  },
  scoreBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  scoreBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scoreBarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '600',
  },
  scoreBarLabel: {
    color: 'var(--secondary-foreground)',
  },
  scoreBarValue: {
    color: 'var(--foreground)',
  },
  scoreBarTrack: {
    height: '6px',
    backgroundColor: 'var(--secondary)',
    borderRadius: '100px',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '100px',
  },
  aiInsights: {
    backgroundColor: '#f5f3ff',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #ede9fe',
    marginTop: '12px',
  },
  aiLabel: {
    color: '#7c3aed',
    fontSize: '11px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
  },
  aiText: {
    fontSize: '13px',
    color: '#5b21b6',
    lineHeight: '1.6',
    margin: 0,
  }
};

'use client';

import React from 'react';
import { Lead } from '@/core/types';
import { MapPin, Globe, Phone, Mail, Zap, MessageSquare, Lock, AlertTriangle, Star } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface LeadCardProps {
  lead: Lead;
  locked?: boolean;
  onViewDetails?: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, locked = false, onViewDetails }) => {
  const { t } = useTranslation();
  const scoreColor =
    lead.score >= 70 ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' } :
    lead.score >= 35 ? { bg: '#fffbeb', border: '#fde68a', text: '#92400e' } :
                       { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };

  const scoreLabel =
    lead.score >= 70 ? t.leads.highPotential :
    lead.score >= 35 ? t.leads.medium : t.leads.low;

  // Blur helper — hides value when locked
  const blurred: React.CSSProperties = locked
    ? { filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }
    : {};

  const contactVal = (val: string | undefined, fallback: string) =>
    locked ? fallback : (val ?? '—');

  return (
    <div style={{ ...styles.card, ...(locked ? styles.cardLocked : {}) }}>

      {locked && (
        <div style={styles.lockBadge}>
          <Lock size={11} />
          <span>{t.leads.upgradeToUnlock}</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.mainInfo}>
          <h3 style={styles.title}>{lead.name}</h3>
          <div style={styles.metaRow}>
            <span style={styles.category}>{lead.category}</span>
            {lead.rating !== undefined && (
              <div style={styles.ratingBox}>
                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                <span style={styles.ratingText}>{lead.rating} ({lead.reviews ?? 0})</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ ...styles.scoreBadge, backgroundColor: scoreColor.bg, borderColor: scoreColor.border, color: scoreColor.text }}>
          <Zap size={12} />
          <span style={styles.scoreNum}>{lead.score}</span>
          <span style={styles.scoreLabel}>{scoreLabel}</span>
        </div>
      </div>

      {/* Service gaps — the reason this lead is valuable */}
      {lead.serviceGaps && lead.serviceGaps.length > 0 && (
        <div style={styles.gapsRow}>
          <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span style={styles.gapsText}>{lead.serviceGaps.join(' · ')}</span>
        </div>
      )}

      {/* Description */}
      {lead.description && !locked && (
        <p style={styles.description}>{lead.description}</p>
      )}

      {/* Contact info */}
      <div style={styles.contactBlock}>
        <div style={styles.detailItem}>
          <MapPin size={13} style={styles.icon} />
          <span>{lead.address}</span>
        </div>
        {(lead.email || locked) && (
          <div style={{ ...styles.detailItem, ...blurred }}>
            <Mail size={13} style={styles.icon} />
            <a href={locked ? undefined : `mailto:${lead.email}`} style={styles.link}>
              {contactVal(lead.email, 'info@example•••.com')}
            </a>
          </div>
        )}
        {(lead.phone || locked) && (
          <div style={{ ...styles.detailItem, ...(locked ? blurred : {}) }}>
            <Phone size={13} style={styles.icon} />
            <a href={locked ? undefined : `tel:${lead.phone}`} style={styles.link}>
              {contactVal(lead.phone, '+20 1•• ••• ••••')}
            </a>
          </div>
        )}
        {lead.website && (
          <div style={{ ...styles.detailItem, ...(locked ? blurred : {}) }}>
            <Globe size={13} style={styles.icon} />
            <a href={locked ? undefined : lead.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
              {locked ? 'www.example•••.com' : (() => { try { return new URL(lead.website!).hostname; } catch { return lead.website; } })()}
            </a>
          </div>
        )}
      </div>

      {/* Social channels */}
      {!locked && lead.socialLinks && Object.values(lead.socialLinks).some(Boolean) && (
        <div style={styles.channelsRow}>
          <span style={styles.channelsLabel}>Social:</span>
          {/* <div style={styles.channels}>
            {lead.socialLinks.linkedin  && <a href={lead.socialLinks.linkedin}  target="_blank" rel="noopener noreferrer" style={{ ...styles.pill, ...styles.linkedinPill }}><Linkedin  size={11} /> LinkedIn</a>}
            {lead.socialLinks.instagram && <a href={lead.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ ...styles.pill, ...styles.instagramPill }}><Instagram size={11} /> Instagram</a>}
            {lead.socialLinks.facebook  && <a href={lead.socialLinks.facebook}  target="_blank" rel="noopener noreferrer" style={{ ...styles.pill, ...styles.facebookPill }}><Facebook  size={11} /> Facebook</a>}
          </div> */}
        </div>
      )}

      {/* AI outreach tip */}
      {!locked && lead.aiInsights && (
        <div style={styles.insightBox}>
          <div style={styles.insightHeader}><MessageSquare size={11} /><span>{t.leads.outreachTip}</span></div>
          <p style={styles.insightText}>{lead.aiInsights}</p>
        </div>
      )}

      {/* Score factors */}
      {!locked && lead.scoreExplanation && lead.scoreExplanation !== 'Basic listing' && (
        <div style={styles.factors}>
          {lead.scoreExplanation.split(' • ').map((f) => (
            <span key={f} style={styles.factorPill}>{f}</span>
          ))}
        </div>
      )}

      <button
        onClick={() => onViewDetails?.(lead)}
        style={{ ...styles.detailsBtn, ...(locked ? styles.detailsBtnLocked : {}) }}
        disabled={locked}
      >
        {locked ? t.leads.upgradeToView : t.leads.viewFullProfile}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card:           { backgroundColor: 'var(--card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--secondary)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' },
  cardLocked:     { opacity: 0.75, backgroundColor: 'var(--secondary)' },
  lockBadge:      { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#6366f1', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  mainInfo:       { display: 'flex', flexDirection: 'column', gap: '3px' },
  metaRow:        { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  title:          { fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', margin: 0 },
  category:       { fontSize: '12px', color: 'var(--muted)', fontWeight: '500', textTransform: 'capitalize' },
  ratingBox:      { display: 'flex', alignItems: 'center', gap: '3px' },
  ratingText:     { fontSize: '11px', color: 'var(--muted)', fontWeight: '500' },
  scoreBadge:     { display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  scoreNum:       { fontSize: '14px' },
  scoreLabel:     { fontSize: '11px', opacity: 0.85 },
  gapsRow:        { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '6px 10px' },
  gapsText:       { fontSize: '12px', color: '#f59e0b', fontWeight: '500' },
  description:    { fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  contactBlock:   { display: 'flex', flexDirection: 'column', gap: '7px' },
  detailItem:     { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--secondary-foreground)' },
  icon:           { color: 'var(--muted-foreground)', flexShrink: 0 },
  link:           { color: '#6366f1', textDecoration: 'none', fontWeight: '500', wordBreak: 'break-all' },
  channelsRow:    { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  channelsLabel:  { fontSize: '11px', color: '#94a3b8', fontWeight: '500' },
  channels:       { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  pill:           { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', textDecoration: 'none', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
  linkedinPill:   { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  instagramPill:  { backgroundColor: '#fdf4ff', color: '#7e22ce', borderColor: '#e9d5ff' },
  facebookPill:   { backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' },
  insightBox:     { backgroundColor: 'var(--secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '3px solid #6366f1', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  insightHeader:  { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' },
  insightText:    { fontSize: '12px', color: 'var(--secondary-foreground)', lineHeight: '1.5', margin: 0 },
  factors:        { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  factorPill:     { fontSize: '10px', backgroundColor: 'var(--secondary)', color: 'var(--muted)', padding: '2px 7px', borderRadius: '100px', fontWeight: '500' },
  detailsBtn: {
    width: '100%',
    padding: '9px',
    borderRadius: '8px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--secondary-foreground)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  detailsBtnLocked: {
    cursor: 'not-allowed',
    color: 'var(--muted-foreground)',
    borderColor: 'var(--secondary)',
  },
};

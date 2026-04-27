'use client';

import React from 'react';
import { Lead } from '@/core/types';
import { 
  MapPin, Globe, Phone, Mail, Zap, MessageSquare, 
  Lock, AlertTriangle, Star, Share2
} from 'lucide-react';
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

      <div style={styles.header}>
        <div style={styles.mainInfo}>
          <h3 style={styles.title}>{lead.name}</h3>
          <div style={styles.metaRow}>
            <span style={styles.category}>{lead.category}</span>
            {lead.rating !== undefined && (
              <div style={styles.ratingBox}>
                <Star size={13} fill="#ffb800" color="#ffb800" />
                <span style={styles.ratingText}>{lead.rating}</span>
                <span style={styles.reviewsCount}>({lead.reviews ?? 0})</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ ...styles.scoreBadge, backgroundColor: scoreColor.bg, borderColor: scoreColor.border, color: scoreColor.text }}>
          <Zap size={12} />
          <span style={styles.scoreNum}>{lead.score}</span>
        </div>
      </div>

      {lead.serviceGaps && lead.serviceGaps.length > 0 && (
        <div style={styles.gapsRow}>
          <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span style={styles.gapsText}>{lead.serviceGaps.join(' · ')}</span>
        </div>
      )}

      <div style={styles.contactBlock}>
        <div style={styles.detailItem}>
          <MapPin size={13} style={styles.icon} />
          <span style={styles.truncateText}>{lead.address}</span>
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
      </div>

      {/* Ticket 1.3: Responsive Social Buttons */}
      {!locked && lead.socialLinks && Object.values(lead.socialLinks).some(Boolean) && (
        <div style={styles.channelsRow}>
          <div style={styles.channels}>
            {lead.socialLinks.linkedin  && (
              <a href={lead.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ ...styles.pill, ...styles.linkedinPill }}>
                <Share2 size={11} /> LinkedIn
              </a>
            )}
            {lead.socialLinks.instagram && (
              <a href={lead.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ ...styles.pill, ...styles.instagramPill }}>
                <Share2 size={11} /> Instagram
              </a>
            )}
            {lead.socialLinks.facebook  && (
              <a href={lead.socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={{ ...styles.pill, ...styles.facebookPill }}>
                <Share2 size={11} /> Facebook
              </a>
            )}
          </div>
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
  card:           { backgroundColor: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--secondary)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', width: '100%', maxWidth: '450px' },
  cardLocked:     { opacity: 0.8 },
  lockBadge:      { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#6366f1', backgroundColor: '#f5f3ff', padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  mainInfo:       { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  metaRow:        { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  title:          { fontSize: '15px', fontWeight: '600', color: 'var(--foreground)', margin: 0, wordBreak: 'break-word' },
  category:       { fontSize: '11px', color: 'var(--muted)', fontWeight: '500' },
  ratingBox:      { display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fff9e6', padding: '1px 6px', borderRadius: '8px' },
  ratingText:     { fontSize: '11px', color: '#92400e', fontWeight: '700' },
  reviewsCount:   { fontSize: '10px', color: '#a16207', opacity: 0.7 },
  scoreBadge:     { display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', borderRadius: '6px', border: '1px solid', fontSize: '12px', fontWeight: '700' },
  scoreNum:       { fontSize: '13px' },
  gapsRow:        { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', padding: '6px' },
  gapsText:       { fontSize: '11px', color: '#d97706', fontWeight: '500' },
  contactBlock:   { display: 'flex', flexDirection: 'column', gap: '6px' },
  detailItem:     { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' },
  icon:           { color: 'var(--muted-foreground)', flexShrink: 0 },
  link:           { color: '#6366f1', textDecoration: 'none', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  truncateText:   { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  channelsRow:    { marginTop: '4px' },
  channels:       { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  pill:           { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', textDecoration: 'none', border: '1px solid #e2e8f0' },
  linkedinPill:   { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  instagramPill:  { backgroundColor: '#fdf4ff', color: '#7e22ce', borderColor: '#e9d5ff' },
  facebookPill:   { backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' },
  detailsBtn:     { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  detailsBtnLocked: { cursor: 'not-allowed', opacity: 0.5 },
};
'use client';

import React from 'react';
import { Lead } from '@/core/types';
import { MapPin, Globe, Phone, Mail, Zap, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface LeadCardProps {
  lead: Lead;
  onViewDetails?: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onViewDetails }) => {
  const { t } = useTranslation();

  const scoreColor =
    lead.score >= 70 ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' } :
      lead.score >= 35 ? { bg: '#fffbeb', border: '#fde68a', text: '#92400e' } :
        { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };

  const scoreLabel =
    lead.score >= 70 ? t.leads.highPotential :
      lead.score >= 35 ? t.leads.medium : t.leads.low;

  // What channels are available to reach this prospect
  const reachChannels: string[] = [];
  if (lead.email) reachChannels.push('Email');
  if (lead.phone) reachChannels.push('Phone');
  if (lead.socialLinks?.linkedin) reachChannels.push('LinkedIn');
  if (lead.socialLinks?.instagram) reachChannels.push('Instagram');
  if (lead.socialLinks?.facebook) reachChannels.push('Facebook');
  if (lead.website && reachChannels.length === 0) reachChannels.push('Web form');

  return (
    <div style={styles.card}>

      {/* Header — name, category, score */}
      <div style={styles.header}>
        <div style={styles.mainInfo}>
          <h3 style={styles.title}>{lead.name}</h3>
          <span style={styles.category}>{lead.category}</span>
        </div>
        <div style={{ ...styles.scoreBadge, backgroundColor: scoreColor.bg, borderColor: scoreColor.border, color: scoreColor.text }}>
          <Zap size={12} />
          <span style={styles.scoreNum}>{lead.score}</span>
          <span style={styles.scoreLabel}>{scoreLabel}</span>
        </div>
      </div>

      {/* Description — what this prospect does */}
      {lead.description && (
        <p style={styles.description}>{lead.description}</p>
      )}

      {/* Contact info */}
      <div style={styles.contactBlock}>
        <div style={styles.detailItem}>
          <MapPin size={13} style={styles.icon} />
          <span>{lead.address}</span>
        </div>
        {lead.email && (
          <div style={styles.detailItem}>
            <Mail size={13} style={styles.icon} />
            <a href={`mailto:${lead.email}`} style={styles.link}>{lead.email}</a>
          </div>
        )}
        {lead.phone && (
          <div style={styles.detailItem}>
            <Phone size={13} style={styles.icon} />
            <a href={`tel:${lead.phone}`} style={styles.link}>{lead.phone}</a>
          </div>
        )}
        {lead.website && (
          <div style={styles.detailItem}>
            <Globe size={13} style={styles.icon} />
            <a href={lead.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
              {(() => { try { return new URL(lead.website).hostname; } catch { return lead.website; } })()}
            </a>
          </div>
        )}
      </div>

      {/* Reach channels — what a salesperson can use */}
      {reachChannels.length > 0 && (
        <div style={styles.channelsRow}>
          <span style={styles.channelsLabel}>Reach via:</span>
          <div style={styles.channels}>
            {lead.email && (
              <a href={`mailto:${lead.email}`} style={styles.channelPill} title={lead.email}>
                <Mail size={11} /> Email
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} style={styles.channelPill} title={lead.phone}>
                <Phone size={11} /> Call
              </a>
            )}
            {/* {lead.socialLinks?.linkedin && (
              <a href={lead.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ ...styles.channelPill, ...styles.linkedinPill }}>
                <Linkedin size={11} /> LinkedIn
              </a>
            )}
            {lead.socialLinks?.instagram && (
              <a href={lead.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ ...styles.channelPill, ...styles.instagramPill }}>
                <Instagram size={11} /> Instagram
              </a>
            )}
            {lead.socialLinks?.facebook && (
              <a href={lead.socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={{ ...styles.channelPill, ...styles.facebookPill }}>
                <Facebook size={11} /> Facebook
              </a>
            )} */}
          </div>
        </div>
      )}

      {/* AI outreach insight */}
      {lead.aiInsights && (
        <div style={styles.insightBox}>
          <div style={styles.insightHeader}>
            <MessageSquare size={11} />
            <span>Outreach tip</span>
          </div>
          <p style={styles.insightText}>{lead.aiInsights}</p>
        </div>
      )}

      {/* Score factors */}
      {lead.scoreExplanation && lead.scoreExplanation !== 'Basic listing' && (
        <div style={styles.factors}>
          {lead.scoreExplanation.split(' • ').map((f) => (
            <span key={f} style={styles.factorPill}>{f}</span>
          ))}
        </div>
      )}

      <button onClick={() => onViewDetails?.(lead)} style={styles.detailsBtn}>
        View full profile
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  mainInfo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  title: { fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 },
  category: { fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'capitalize' },
  scoreBadge: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '5px 9px', borderRadius: '8px', border: '1px solid',
    fontSize: '12px', fontWeight: '600', flexShrink: 0,
  },
  scoreNum: { fontSize: '14px' },
  scoreLabel: { fontSize: '11px', opacity: 0.85 },
  description: {
    fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
  },
  contactBlock: { display: 'flex', flexDirection: 'column', gap: '7px' },
  detailItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '12px', color: '#475569',
  },
  icon: { color: '#94a3b8', flexShrink: 0 },
  link: { color: '#6366f1', textDecoration: 'none', fontWeight: '500', wordBreak: 'break-all' },
  channelsRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  channelsLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: '500', flexShrink: 0 },
  channels: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  channelPill: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: '600', padding: '3px 8px',
    borderRadius: '6px', textDecoration: 'none',
    backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
  },
  linkedinPill: { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  instagramPill: { backgroundColor: '#fdf4ff', color: '#7e22ce', borderColor: '#e9d5ff' },
  facebookPill: { backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' },
  insightBox: {
    backgroundColor: '#f8fafc', padding: '10px 12px',
    borderRadius: '8px', border: '1px solid #e2e8f0',
    borderLeft: '3px solid #6366f1',
  },
  insightHeader: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: '700', color: '#6366f1',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px',
  },
  insightText: { fontSize: '12px', color: '#334155', lineHeight: '1.5', margin: 0 },
  factors: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  factorPill: {
    fontSize: '10px', backgroundColor: '#f1f5f9', color: '#64748b',
    padding: '2px 7px', borderRadius: '100px', fontWeight: '500',
  },
  detailsBtn: {
    marginTop: '2px', width: '100%', padding: '9px',
    borderRadius: '8px', border: '1px solid #e2e8f0',
    backgroundColor: 'transparent', color: '#475569',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
};
'use client';

import React from 'react';

export function LeadCardSkeleton() {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.left}>
          <div className="skeleton" style={{ height: 16, width: '65%', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 8, marginTop: 8 }} />
        </div>

        <div style={styles.badge}>
          <div className="skeleton" style={{ height: 20, width: 90, borderRadius: 8 }} />
        </div>
      </div>

      <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 8 }} />

      <div style={styles.contact}>
        <div className="skeleton" style={{ height: 12, width: '95%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 8 }} />
      </div>

      <div className="skeleton" style={{ height: 36, width: '100%', borderRadius: 10, marginTop: 8 }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--card)',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid var(--secondary)',
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
  left: { flex: 1 },
  badge: { flexShrink: 0 },
  contact: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: 4,
  },
};
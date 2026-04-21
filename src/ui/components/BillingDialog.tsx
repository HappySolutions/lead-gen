'use client';

import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/core/i18n/useTranslation';

interface BillingDialogProps {
  open: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
  whatsappHref: string;
}

export const BillingDialog: React.FC<BillingDialogProps> = ({
  open,
  onClose,
  onPaymentConfirmed,
  whatsappHref,
}) => {
  const { language } = useTranslation();
  if (!open) return null;

  const copy =
    language === 'ar'
      ? {
          title: 'فتح جميع العملاء',
          body: 'للدفع وتفعيل الباقة، تواصل معنا عبر واتساب. بعد تأكيد الدفع سيتم فتح جميع البيانات ومنحك 10 عمليات بحث.',
          whatsapp: 'الدفع عبر واتساب',
          confirmed: 'تم تأكيد الدفع',
          close: 'إغلاق',
        }
      : {
          title: 'Unlock all leads',
          body: 'To pay and activate your plan, message us on WhatsApp. After payment is confirmed, all leads unlock and you get 10 searches.',
          whatsapp: 'Pay on WhatsApp',
          confirmed: 'Payment confirmed',
          close: 'Close',
        };

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn} aria-label={copy.close}>
          <X size={18} />
        </button>

        <h3 style={styles.title}>{copy.title}</h3>
        <p style={styles.body}>{copy.body}</p>

        <div style={styles.actions}>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={styles.whatsappBtn}>
            <MessageCircle size={16} />
            <span>{copy.whatsapp}</span>
          </a>

          <button onClick={onPaymentConfirmed} style={styles.confirmBtn}>
            {copy.confirmed}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
    zIndex: 3000,
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    borderRadius: '16px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
    padding: '18px 18px 16px',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'var(--secondary)',
    border: '1px solid var(--border)',
    color: 'var(--secondary-foreground)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: '2px 0 10px',
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--foreground)',
  },
  body: {
    margin: '0 0 14px',
    fontSize: '13px',
    lineHeight: 1.55,
    color: 'var(--muted)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  whatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: '#22c55e',
    color: '#052e16',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '13px',
    border: '1px solid rgba(5,46,22,0.15)',
  },
  confirmBtn: {
    padding: '10px 12px',
    borderRadius: '12px',
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
    fontWeight: 800,
    fontSize: '13px',
  },
};


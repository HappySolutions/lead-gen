'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase.browser';
import { Target, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const [mode,       setMode]       = useState<Mode>('signin');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [signedUp,   setSignedUp]   = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSignedUp(true);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) { setError(err.message); return; }
      router.replace('/');
    }
  };

  if (signedUp) {
    return (
      <main style={s.page}>
        <div style={s.card}>
          <div style={s.logoWrap}>
            <div style={s.logo}><Target size={24} color="#fff" /></div>
            <h1 style={s.brand}>LeadGeni</h1>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={s.successIcon}>✓</div>
            <h2 style={s.title}>Confirm your email</h2>
            <p style={s.sub}>
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click it to activate your account, then come back and sign in.
            </p>
            <button onClick={() => { setSignedUp(false); setMode('signin'); }} style={s.btn}>
              Back to sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logo}><Target size={24} color="#fff" /></div>
          <h1 style={s.brand}>LeadGeni</h1>
        </div>

        <div style={s.tabs}>
          <button
            onClick={() => { setMode('signin'); setError(null); }}
            style={{ ...s.tab, ...(mode === 'signin' ? s.tabActive : {}) }}
          >
            Sign in
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            style={{ ...s.tab, ...(mode === 'signup' ? s.tabActive : {}) }}
          >
            Create account
          </button>
        </div>

        <h2 style={s.title}>
          {mode === 'signin' ? 'Welcome back' : 'Get started free'}
        </h2>
        <p style={s.sub}>
          {mode === 'signin'
            ? 'Sign in to your LeadGeni account.'
            : 'Create your account. First 3 searches are free.'}
        </p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.inputWrap}>
            <Mail size={15} style={s.inputIcon} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.input}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div style={s.inputWrap}>
            <Lock size={15} style={s.inputIcon} />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={s.eyeBtn}
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={15} color="var(--muted)" /> : <Eye size={15} color="var(--muted)" />}
            </button>
          </div>

          {error && <p style={s.error}>{friendlyError(error)}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : mode === 'signin' ? 'Sign in' : 'Create account'
            }
          </button>
        </form>

        <p style={s.footer}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            style={s.switchBtn}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials'))   return 'Wrong email or password.';
  if (msg.includes('Email not confirmed'))          return 'Please confirm your email first. Check your inbox.';
  if (msg.includes('User already registered'))      return 'An account with this email already exists. Sign in instead.';
  if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.';
  if (msg.includes('rate limit'))                   return 'Too many attempts. Please wait a minute and try again.';
  return msg;
}

const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', padding: '24px' },
  card:        { backgroundColor: 'var(--card)', borderRadius: '20px', padding: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px' },
  logoWrap:    { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', justifyContent: 'center' },
  logo:        { backgroundColor: '#6366f1', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brand:       { fontSize: '20px', fontWeight: '700', color: 'var(--foreground)', margin: 0 },
  tabs:        { display: 'flex', backgroundColor: 'var(--secondary)', borderRadius: '10px', padding: '3px', marginBottom: '24px', gap: '3px' },
  tab:         { flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '500', color: 'var(--muted)', cursor: 'pointer' },
  tabActive:   { backgroundColor: 'var(--card)', color: 'var(--foreground)', fontWeight: '600', boxShadow: 'var(--shadow-sm)' },
  title:       { fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 6px', textAlign: 'center' as const },
  sub:         { fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px', textAlign: 'center' as const, lineHeight: '1.6' },
  form:        { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  inputWrap:   { display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', padding: '0 14px', backgroundColor: 'var(--card)', transition: 'border-color 0.2s' },
  inputIcon:   { color: 'var(--muted)', flexShrink: 0, marginRight: '10px' },
  input:       { flex: 1, border: 'none', outline: 'none', padding: '12px 0', fontSize: '14px', backgroundColor: 'transparent', color: 'var(--foreground)' },
  eyeBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 },
  error:       { fontSize: '13px', color: '#dc2626', margin: '2px 0 0', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' },
  btn:         { backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' },
  successIcon: { width: '48px', height: '48px', backgroundColor: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', color: '#10b981' },
  footer:      { fontSize: '13px', color: 'var(--muted)', textAlign: 'center' as const, margin: '20px 0 0' },
  switchBtn:   { background: 'none', border: 'none', color: '#6366f1', fontWeight: '600', cursor: 'pointer', fontSize: '13px', padding: 0 },
};
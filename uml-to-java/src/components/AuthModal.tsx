import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { XIcon, SpinnerIcon } from './Icons';

interface Props {
  onClose: () => void;
  /** Optional tab to open on mount */
  initialTab?: 'signin' | 'signup';
}

type Tab = 'signin' | 'signup' | 'reset';

const INPUT: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#f4f4f5', padding: '11px 14px',
  fontSize: 13, outline: 'none', transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

const BTN: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: 8,
  border: 'none', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 7, transition: 'all 0.2s',
};

function Field({
  label, type = 'text', value, onChange, placeholder, error,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);
  const isPass = type === 'password';
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#71717a', marginBottom: 5, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...INPUT,
            borderColor: error ? 'rgba(239,68,68,0.6)' : focused ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.1)',
            paddingRight: isPass ? 40 : 14,
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            tabIndex={-1}
          >
            {show ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p style={{ margin: '5px 0 0', fontSize: 11, color: '#f87171' }}>{error}</p>}
    </div>
  );
}

export default function AuthModal({ onClose, initialTab = 'signin' }: Props) {
  const [tab,      setTab]      = useState<Tab>(initialTab);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string; confirm?: string }>({});

  const reset = (t: Tab) => {
    setTab(t); setError(''); setSuccess('');
    setFieldErr({}); setPassword(''); setConfirm('');
  };

  const validate = () => {
    const errs: typeof fieldErr = {};
    if (!email.includes('@')) errs.email = 'Enter a valid email address';
    if (tab !== 'reset') {
      if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    }
    if (tab === 'signup' && password !== confirm) errs.confirm = 'Passwords do not match';
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.');
      return;
    }
    if (!validate()) return;

    setLoading(true); setError(''); setSuccess('');
    try {
      if (tab === 'signin') {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onClose();
      } else if (tab === 'signup') {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setTab('signin');
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (e) throw e;
        setSuccess('Password reset email sent. Check your inbox.');
      }
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 12000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: '"IBM Plex Sans",system-ui,sans-serif' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 28px 24px', position: 'relative', boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#52525b', cursor: 'pointer', padding: '5px 6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f4f4f5'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <XIcon size={10} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', boxShadow: '0 0 12px rgba(249,115,22,0.4)' }}>U</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>UML<span style={{ color: '#f97316' }}>→Code</span></span>
        </div>

        {/* Title */}
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#f4f4f5', letterSpacing: -0.5 }}>
          {tab === 'signin' ? 'Welcome back' : tab === 'signup' ? 'Create your account' : 'Reset password'}
        </h2>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: '#71717a', lineHeight: 1.55 }}>
          {tab === 'signin'  && 'Sign in to save diagrams and collaborate in real time.'}
          {tab === 'signup'  && 'Free forever. No credit card required.'}
          {tab === 'reset'   && "We'll send a reset link to your email."}
        </p>

        {/* Tab pills — only for signin/signup */}
        {tab !== 'reset' && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, marginBottom: 22, border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => reset(t)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t ? 'rgba(249,115,22,0.14)' : 'transparent',
                  color:      tab === t ? '#f97316'               : '#52525b',
                  borderColor: tab === t ? 'rgba(249,115,22,0.3)' : 'transparent',
                  outline: tab === t ? '1px solid rgba(249,115,22,0.25)' : 'none',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#6ee7b7', lineHeight: 1.55 }}>
            {success}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#fca5a5', lineHeight: 1.55 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={fieldErr.email} />

          {tab !== 'reset' && (
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={fieldErr.password} />
          )}

          {tab === 'signup' && (
            <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" error={fieldErr.confirm} />
          )}

          {/* Forgot password */}
          {tab === 'signin' && (
            <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 18 }}>
              <button type="button" onClick={() => reset('reset')}
                style={{ background: 'none', border: 'none', color: '#52525b', fontSize: 11, cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f97316'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...BTN, background: loading ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', marginTop: tab === 'signin' ? 0 : 8, boxShadow: loading ? 'none' : '0 0 20px rgba(249,115,22,0.35)', opacity: loading ? 0.8 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 0 28px rgba(249,115,22,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.35)'; }}
          >
            {loading && <SpinnerIcon size={13} />}
            {tab === 'signin' ? 'Sign In'          :
             tab === 'signup' ? 'Create Account'   :
                                'Send Reset Email'}
          </button>
        </form>

        {/* Back to sign in from reset */}
        {tab === 'reset' && (
          <button type="button" onClick={() => reset('signin')}
            style={{ background: 'none', border: 'none', color: '#52525b', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: 14, transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f97316'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; }}
          >
            ← Back to sign in
          </button>
        )}

        {/* Bottom note */}
        {tab === 'signup' && (
          <p style={{ margin: '14px 0 0', fontSize: 11, color: '#3f3f46', textAlign: 'center', lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <span style={{ color: '#52525b' }}>Terms of Service</span> and{' '}
            <span style={{ color: '#52525b' }}>Privacy Policy</span>.
          </p>
        )}
      </div>
    </div>
  );
}

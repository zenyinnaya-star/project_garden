import { useState, useRef, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface Props {
  user:    User;
  onSignOut: () => void;
  onOpenAuth?: () => void;
}

/** Deterministic pastel color from an email string */
function avatarColor(email: string): string {
  const PALETTE = ['#f97316','#3b82f6','#10b981','#8b5cf6','#ec4899','#06b6d4','#f59e0b','#84cc16'];
  let h = 0;
  for (const c of email) h = Math.imul(31, h) + c.charCodeAt(0);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export default function UserMenu({ user, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const email  = user.email ?? 'user';
  const initials = email.slice(0, 2).toUpperCase();
  const color  = avatarColor(email);
  const shortEmail = email.length > 22 ? email.slice(0, 22) + '…' : email;

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        title={email}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: color + '22', border: `1.5px solid ${color}55`,
          color, fontSize: 11, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', userSelect: 'none',
          boxShadow: open ? `0 0 0 2px ${color}44` : 'none',
          letterSpacing: 0.3,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = color + '33'; e.currentTarget.style.borderColor = color + '88'; }}
        onMouseLeave={e => { e.currentTarget.style.background = color + '22'; e.currentTarget.style.borderColor = color + '55'; }}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 11000,
            background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, minWidth: 200,
            boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden', animation: 'fadeInDown 0.15s ease both',
          }}
        >
          {/* User info */}
          <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: color + '22', border: `1.5px solid ${color}55`, color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7', marginBottom: 1 }}>{shortEmail}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }}/>
                  <span style={{ fontSize: 10, color: '#52525b' }}>Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '6px 6px' }}>
            <MenuItem
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              }
              label="Saved Projects"
              badge="Soon"
              onClick={() => setOpen(false)}
              disabled
            />
            <MenuItem
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M20 21a8 8 0 10-16 0"/>
                </svg>
              }
              label="Profile"
              badge="Soon"
              onClick={() => setOpen(false)}
              disabled
            />
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 6px' }}/>

          <div style={{ padding: '6px 6px 6px' }}>
            <MenuItem
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              }
              label="Sign Out"
              danger
              onClick={() => { onSignOut(); setOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon, label, badge, danger, disabled, onClick,
}: {
  icon: React.ReactNode; label: string; badge?: string;
  danger?: boolean; disabled?: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const fg = danger ? '#f87171' : hovered ? '#f4f4f5' : '#a1a1aa';
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        background: hovered && !disabled ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)') : 'transparent',
        border: 'none', borderRadius: 6, padding: '8px 9px', color: fg,
        fontSize: 12, cursor: disabled ? 'default' : 'pointer', textAlign: 'left',
        transition: 'background 0.15s, color 0.15s', opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={() => { if (!disabled) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(139,92,246,0.18)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '1px 6px', letterSpacing: 0.3 }}>
          {badge}
        </span>
      )}
    </button>
  );
}

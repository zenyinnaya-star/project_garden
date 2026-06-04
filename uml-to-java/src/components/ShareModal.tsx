import { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import type { CollabPeer } from '../hooks/useCollab';
import { isSupabaseConfigured } from '../lib/supabase';

interface Props {
  roomId:      string;
  peers:       CollabPeer[];
  isConnected: boolean;
  myColor:     string;
  myName:      string;
  onClose:     () => void;
  onStopSharing: () => void;
}

export default function ShareModal({
  roomId, peers, isConnected, myColor, myName, onClose, onStopSharing,
}: Props) {
  const [copied, setCopied]     = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const copy = (text: string, which: 'url' | 'id') => {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'url') { setCopied(true);   setTimeout(() => setCopied(false),   2000); }
      else                 { setCopiedId(true);  setTimeout(() => setCopiedId(false), 2000); }
    });
  };

  /* Keep the room in the URL while modal is open */
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    window.history.replaceState(null, '', url.toString());
  }, [roomId]);

  const allPeers: (CollabPeer & { isMe?: boolean })[] = [
    { sessionId: 'me', displayName: myName, color: myColor, isMe: true },
    ...peers,
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '62px 12px 0 0', fontFamily: '"IBM Plex Sans",system-ui,sans-serif' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 340, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)', animation: 'slideInRight 0.2s ease both' }}
      >
        <style>{`@keyframes slideInRight { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:none} }`}</style>

        {/* Header */}
        <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)', border: `1px solid ${isConnected ? 'rgba(16,185,129,0.35)' : 'rgba(249,115,22,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isConnected ? '#10b981' : '#f97316'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5' }}>Live Collaboration</div>
            <div style={{ fontSize: 10, color: isConnected ? '#10b981' : '#f97316', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: isConnected ? '#10b981' : '#f97316', animation: isConnected ? 'pulse 2s infinite' : 'none' }}/>
              {isConnected ? `Live · ${allPeers.length} in room` : 'Connecting…'}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#52525b', cursor: 'pointer', padding: '4px 5px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f4f4f5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; }}
          >
            <XIcon size={9} />
          </button>
        </div>

        {/* Not configured warning */}
        {!isSupabaseConfigured && (
          <div style={{ margin: '12px 14px 0', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 3 }}>Supabase not configured</div>
            <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.6 }}>
              Add <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, color: '#a1a1aa', fontSize: 10 }}>VITE_SUPABASE_URL</code> and <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, color: '#a1a1aa', fontSize: 10 }}>VITE_SUPABASE_ANON_KEY</code> to <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, color: '#a1a1aa', fontSize: 10 }}>.env.local</code> to enable real-time sync.
            </div>
          </div>
        )}

        {/* Share link */}
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 }}>Share this link</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"JetBrains Mono",monospace', lineHeight: 1.5 }}>
              {roomUrl}
            </div>
            <button
              onClick={() => copy(roomUrl, 'url')}
              style={{ flexShrink: 0, padding: '8px 12px', borderRadius: 8, border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: copied ? '#6ee7b7' : '#a1a1aa', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Room ID */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#3f3f46' }}>Room ID:</span>
            <code style={{ fontSize: 10, color: '#52525b', fontFamily: '"JetBrains Mono",monospace', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: 5 }}>
              {roomId.slice(0, 8)}…
            </code>
            <button
              onClick={() => copy(roomId, 'id')}
              style={{ background: 'none', border: 'none', color: copiedId ? '#6ee7b7' : '#3f3f46', fontSize: 10, cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
            >
              {copiedId ? '✓' : 'copy full'}
            </button>
          </div>
        </div>

        {/* Participants */}
        <div style={{ padding: '16px 14px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 9 }}>
            In this room ({allPeers.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allPeers.map(peer => (
              <div key={peer.sessionId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: peer.color + '20', border: `1.5px solid ${peer.color}55`, color: peer.color, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {peer.displayName.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 12, color: peer.isMe ? '#e4e4e7' : '#a1a1aa', flex: 1 }}>
                  {peer.displayName}{peer.isMe ? ' (you)' : ''}
                </span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }}/>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ margin: '16px 14px 0', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', letterSpacing: 0.5, marginBottom: 7 }}>HOW IT WORKS</div>
          {[
            'Share the link above with teammates',
            'Changes sync in real time across all sessions',
            'Everyone sees nodes, edges and diagram updates live',
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: i < 2 ? 5 : 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#f97316', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 0.5 }}>{i + 1}</div>
              <span style={{ fontSize: 11, color: '#52525b', lineHeight: 1.55 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Stop sharing */}
        <div style={{ padding: '12px 14px 14px', textAlign: 'center' }}>
          <button
            onClick={onStopSharing}
            style={{ background: 'none', border: 'none', color: '#3f3f46', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.15s', padding: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; }}
          >
            Stop sharing & remove link
          </button>
        </div>
      </div>
    </div>
  );
}

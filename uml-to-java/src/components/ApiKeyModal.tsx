import { useState } from 'react';

interface Props {
  currentKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ currentKey, onSave, onClose }: Props) {
  const [key, setKey] = useState(currentKey);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 24, width: 420, color: '#e2e8f0', fontSize: 13 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>OpenAI API Key</div>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 16 }}>
          Used for image analysis and AI diagram generation. Stored in your browser's localStorage.
        </div>

        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && key.trim() && (onSave(key.trim()), onClose())}
          placeholder="sk-..."
          autoFocus
          style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', padding: '8px 10px', fontSize: 13, outline: 'none', marginBottom: 10 }}
        />

        <div style={{ color: '#475569', fontSize: 11, marginBottom: 18 }}>
          Get your key at{' '}
          <span style={{ color: '#60a5fa' }}>platform.openai.com/api-keys</span>
          {' '}— image/AI features use gpt-4o-mini (low cost).
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {currentKey && (
            <button
              onClick={() => { onSave(''); onClose(); }}
              style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 4, color: '#f87171', padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}
            >
              Clear key
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: '#334155', border: 'none', borderRadius: 4, color: '#94a3b8', padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (key.trim()) { onSave(key.trim()); onClose(); } }}
            disabled={!key.trim()}
            style={{ background: key.trim() ? '#1d4ed8' : '#1e3a5f', border: 'none', borderRadius: 4, color: '#fff', padding: '6px 16px', cursor: key.trim() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 700 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

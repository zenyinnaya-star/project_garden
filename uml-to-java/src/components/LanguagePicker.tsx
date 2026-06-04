import { useEffect, useRef, useState } from 'react';
import type { DiagramType, TargetLang } from '../types';

/* ── Language registry ────────────────────────────────────────────── */
export interface LangMeta {
  id: TargetLang;
  label: string;
  short: string;
  color: string;
  bg: string;
  prism: string;
  ext: string;
}

const ALL_LANGS: LangMeta[] = [
  // OOP / scripting
  { id:'java',       label:'Java',       short:'Java', color:'#f97316', bg:'rgba(249,115,22,0.12)',  prism:'java',       ext:'java'  },
  { id:'python',     label:'Python',     short:'Py',   color:'#60a5fa', bg:'rgba(96,165,250,0.12)',  prism:'python',     ext:'py'    },
  { id:'cpp',        label:'C++',        short:'C++',  color:'#4ade80', bg:'rgba(74,222,128,0.12)',  prism:'cpp',        ext:'cpp'   },
  { id:'csharp',     label:'C#',         short:'C#',   color:'#a78bfa', bg:'rgba(167,139,250,0.12)', prism:'csharp',     ext:'cs'    },
  { id:'typescript', label:'TypeScript', short:'TS',   color:'#38bdf8', bg:'rgba(56,189,248,0.12)',  prism:'typescript', ext:'ts'    },
  { id:'javascript', label:'JavaScript', short:'JS',   color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  prism:'javascript', ext:'js'    },
  { id:'kotlin',     label:'Kotlin',     short:'KT',   color:'#fb923c', bg:'rgba(251,146,60,0.12)',  prism:'kotlin',     ext:'kt'    },
  { id:'go',         label:'Go',         short:'Go',   color:'#67e8f9', bg:'rgba(103,232,249,0.12)', prism:'go',         ext:'go'    },
  { id:'swift',      label:'Swift',      short:'SW',   color:'#f87171', bg:'rgba(248,113,113,0.12)', prism:'swift',      ext:'swift' },
  { id:'php',        label:'PHP',        short:'PHP',  color:'#c084fc', bg:'rgba(192,132,252,0.12)', prism:'php',        ext:'php'   },
  { id:'ruby',       label:'Ruby',       short:'RB',   color:'#f9a8d4', bg:'rgba(249,168,212,0.12)', prism:'ruby',       ext:'rb'    },
  // SQL
  { id:'oracle',     label:'Oracle SQL', short:'ORA',  color:'#f97316', bg:'rgba(249,115,22,0.12)',  prism:'sql',        ext:'sql'   },
  { id:'postgresql', label:'PostgreSQL', short:'PG',   color:'#60a5fa', bg:'rgba(96,165,250,0.12)',  prism:'sql',        ext:'sql'   },
  { id:'mysql',      label:'MySQL',      short:'MY',   color:'#4ade80', bg:'rgba(74,222,128,0.12)',  prism:'sql',        ext:'sql'   },
  { id:'sqlite',     label:'SQLite',     short:'SQ',   color:'#a78bfa', bg:'rgba(167,139,250,0.12)', prism:'sql',        ext:'sql'   },
  { id:'mssql',      label:'SQL Server', short:'MS',   color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  prism:'sql',        ext:'sql'   },
];

// eslint-disable-next-line react-refresh/only-export-components
export const LANGS_FOR: Record<DiagramType, TargetLang[]> = {
  class:     ['java','python','cpp','csharp','typescript','javascript','kotlin','go','swift','php','ruby'],
  flowchart: ['java','python','cpp','csharp','typescript','javascript','kotlin','go'],
  er:        ['oracle','postgresql','mysql','sqlite','mssql'],
  sequence:  ['java','python','typescript','javascript','csharp','kotlin','go','ruby'],
  activity:  ['java','python','cpp','csharp','typescript','javascript','kotlin','go'],
};

// eslint-disable-next-line react-refresh/only-export-components
export function getLangMeta(id: TargetLang): LangMeta {
  return ALL_LANGS.find(l => l.id === id) ?? ALL_LANGS[0];
}

/* ── Component ───────────────────────────────────────────────────── */
interface Props {
  diagramType: DiagramType;
  lang: TargetLang;
  onChange: (lang: TargetLang) => void;
}

export default function LanguagePicker({ diagramType, lang, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const available = LANGS_FOR[diagramType];
  const current = getLangMeta(lang);
  const isSQL = diagramType === 'er';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: open ? current.bg : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? current.color + '66' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 6, padding: '4px 10px 4px 8px',
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = current.bg; e.currentTarget.style.borderColor = current.color + '66'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}}
      >
        {/* Language dot */}
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: current.color, flexShrink: 0 }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: current.color, letterSpacing: 0.3 }}>{current.label}</span>
        {/* Chevron */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={current.color} strokeWidth="2.5" strokeLinecap="round"
          style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#080e18', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '8px 6px',
          zIndex: 9999, minWidth: 240,
          boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
          animation: 'lp-fadeInUp 0.15s ease both',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#3f3f46', letterSpacing: 1.5, textTransform: 'uppercase', padding: '2px 8px 6px', fontFamily: 'sans-serif' }}>
            {isSQL ? 'SQL Dialect' : 'Target Language'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {available.map(id => {
              const m = getLangMeta(id);
              const active = lang === id;
              return (
                <button key={id}
                  onClick={() => { onChange(id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: active ? m.bg : 'transparent',
                    border: `1px solid ${active ? m.color + '55' : 'transparent'}`,
                    borderRadius: 6, padding: '6px 8px',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                    width: '100%',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; }}}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: 11, color: active ? m.color : '#a1a1aa', fontWeight: active ? 700 : 500 }}>{m.label}</span>
                  {active && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="3" strokeLinecap="round" style={{ marginLeft: 'auto' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

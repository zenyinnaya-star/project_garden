import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramType } from '../types';
import { DatabaseIcon, CodeBracketsIcon } from './Icons';
import { generateDDL, type SqlDialect } from '../generators/sqlDialects';

interface Props {
  code: string;
  diagramType: DiagramType;
  nodes?: Node[];
  edges?: Edge[];
}

const LABELS: Record<DiagramType, { title: string; lang: string; badge: string; badgeColor: string; ext: string }> = {
  class:     { title: 'Java Output',  lang: 'java', badge: 'class',     badgeColor: '#1e3a5f', ext: 'java' },
  flowchart: { title: 'Java Output',  lang: 'java', badge: 'flowchart', badgeColor: '#1e3a5f', ext: 'java' },
  er:        { title: 'DDL Output',   lang: 'sql',  badge: 'sql',       badgeColor: '#2e1065', ext: 'sql'  },
};

const EMPTY_HINTS: Record<DiagramType, string> = {
  class:     'Build your class diagram, then click Generate Code.',
  flowchart: 'Build your flowchart, then click Generate Code.',
  er:        'Build your ER diagram, then click Generate Code.',
};

const SQL_DIALECTS: { id: SqlDialect; label: string; color: string; bg: string; border: string }[] = [
  { id: 'oracle',     label: 'Oracle',     color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)'  },
  { id: 'postgresql', label: 'PostgreSQL', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)'  },
  { id: 'mysql',      label: 'MySQL',      color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)'  },
  { id: 'sqlite',     label: 'SQLite',     color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
];

const JAVA_IDES = [
  {
    id: 'vscode',
    label: 'VS Code',
    hint: 'code MyClass.java',
    color: '#60a5fa',
    icon: (
      <svg width="13" height="13" viewBox="0 0 100 100" fill="none">
        <path d="M74.9 6.6L51.2 31.4 32.6 15.9 6.8 27.5v45l25.8 11.6 18.6-15.5 23.7 24.8L93.2 81V19L74.9 6.6zm0 57.4l-15-12.1 15-12.1v24.2zM18.7 62.9V37.1l14.7 12.9-14.7 12.9z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'intellij',
    label: 'IntelliJ',
    hint: 'idea MyClass.java',
    color: '#f472b6',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="3"/>
        <line x1="7" y1="17" x2="17" y2="17"/><line x1="7" y1="7" x2="10" y2="7"/>
        <path d="M7 12h5"/>
      </svg>
    ),
  },
  {
    id: 'eclipse',
    label: 'Eclipse',
    hint: 'eclipse -import',
    color: '#818cf8',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 12h8"/><path d="M12 8a4 4 0 0 1 0 8"/>
      </svg>
    ),
  },
];

const DB_TOOLS = [
  { id: 'dbeaver',   label: 'DBeaver',   color: '#f59e0b', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
  { id: 'datagrip',  label: 'DataGrip',  color: '#34d399', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
  { id: 'sqlplus',   label: 'SQL*Plus',  color: '#f97316', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> },
  { id: 'pgadmin',   label: 'pgAdmin',   color: '#60a5fa', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg> },
];

function isEmpty(code: string) {
  const t = code.trim();
  return t === '' || (t.startsWith('--') && t.split('\n').length < 4);
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function CodeOutput({ code, diagramType, nodes = [], edges = [] }: Props) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [dialect, setDialect] = useState<SqlDialect>('oracle');
  const [showIDEHint, setShowIDEHint] = useState<string | null>(null);

  /* live code — dialect switching regenerates for ER */
  const displayCode = diagramType === 'er' && nodes.length > 0
    ? generateDDL(nodes, edges, dialect)
    : code;

  const cfg = LABELS[diagramType];

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = displayCode;
      Prism.highlightElement(codeRef.current);
    }
  }, [displayCode, diagramType, dialect]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (diagramType === 'er') {
      downloadFile(displayCode, `schema_${dialect}.sql`);
    } else {
      // For class diagrams, split by "public class/interface/abstract" and save as zip...
      // For now, download all as a single file
      downloadFile(displayCode, `diagram_output.java`);
    }
  };

  const activeDialect = SQL_DIALECTS.find(d => d.id === dialect)!;

  return (
    <div style={{ width: 400, background: '#0a0f1a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', background: '#0f172a', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{cfg.title}</span>
            {diagramType === 'er' && (
              <span style={{ fontSize: 10, fontWeight: 700, background: activeDialect.bg, color: activeDialect.color, border: `1px solid ${activeDialect.border}`, padding: '2px 7px', borderRadius: 20, fontFamily: 'sans-serif' }}>
                {activeDialect.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {/* Download */}
            <button
              onClick={handleDownload}
              title={diagramType === 'er' ? `Download ${activeDialect.label} .sql` : 'Download .java'}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8', padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#273549'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {diagramType === 'er' ? `.sql` : `.java`}
            </button>
            {/* Copy */}
            <button
              onClick={handleCopy}
              style={{ background: copied ? '#166534' : '#1e293b', border: '1px solid #334155', borderRadius: 5, color: copied ? '#4ade80' : '#94a3b8', padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all 0.2s' }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialect switcher (ER only) ── */}
      {diagramType === 'er' && !isEmpty(displayCode) && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e293b', background: '#080d16', display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'sans-serif', marginRight: 4, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>DB:</span>
          {SQL_DIALECTS.map(d => (
            <button key={d.id} onClick={() => setDialect(d.id)} style={{
              background: dialect === d.id ? d.bg : 'transparent',
              border: `1px solid ${dialect === d.id ? d.border : '#1e293b'}`,
              borderRadius: 5, color: dialect === d.id ? d.color : '#475569',
              padding: '3px 9px', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'sans-serif',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (dialect !== d.id) { e.currentTarget.style.borderColor = d.border; e.currentTarget.style.color = d.color; } }}
              onMouseLeave={e => { if (dialect !== d.id) { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#475569'; } }}
            >{d.label}</button>
          ))}
          {/* DB tool download buttons */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {DB_TOOLS.filter(t => {
              if (dialect === 'oracle') return t.id === 'dbeaver' || t.id === 'datagrip' || t.id === 'sqlplus';
              if (dialect === 'postgresql') return t.id === 'dbeaver' || t.id === 'datagrip' || t.id === 'pgadmin';
              return t.id === 'dbeaver' || t.id === 'datagrip';
            }).map(tool => (
              <button key={tool.id}
                onClick={() => { downloadFile(displayCode, `schema_${dialect}.sql`); setShowIDEHint(tool.id); setTimeout(() => setShowIDEHint(null), 3000); }}
                title={`Download for ${tool.label}`}
                style={{ background: 'transparent', border: `1px solid #1e293b`, borderRadius: 5, color: '#475569', padding: '3px 7px', fontSize: 10, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color; e.currentTarget.style.color = tool.color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#475569'; }}
              >
                <span style={{ color: 'inherit' }}>{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── IDE buttons (Java) ── */}
      {(diagramType === 'class' || diagramType === 'flowchart') && !isEmpty(displayCode) && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e293b', background: '#080d16', display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'sans-serif', marginRight: 4, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>Open in:</span>
          {JAVA_IDES.map(ide => (
            <button key={ide.id}
              onClick={() => { downloadFile(displayCode, 'diagram_output.java'); setShowIDEHint(ide.id); setTimeout(() => setShowIDEHint(null), 3000); }}
              title={`Download and open with ${ide.label} — ${ide.hint}`}
              style={{ background: showIDEHint === ide.id ? `rgba(${ide.color},0.1)` : 'transparent', border: `1px solid ${showIDEHint === ide.id ? ide.color : '#1e293b'}`, borderRadius: 5, color: showIDEHint === ide.id ? ide.color : '#475569', padding: '3px 9px', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ide.color; e.currentTarget.style.color = ide.color; }}
              onMouseLeave={e => { if (showIDEHint !== ide.id) { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#475569'; } }}
            >
              <span style={{ color: 'inherit' }}>{ide.icon}</span>
              {showIDEHint === ide.id ? `Run: ${ide.hint}` : ide.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Code area ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {isEmpty(displayCode) ? (
          <div style={{ color: '#475569', fontSize: 12, lineHeight: 1.8, fontFamily: 'sans-serif' }}>
            <div style={{ color: '#334155', marginBottom: 12 }}>
              {diagramType === 'er' ? <DatabaseIcon size={28}/> : <CodeBracketsIcon size={28}/>}
            </div>
            {EMPTY_HINTS[diagramType]}
          </div>
        ) : (
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.7 }}>
            <code ref={codeRef} className={`language-${cfg.lang}`}/>
          </pre>
        )}
      </div>
    </div>
  );
}

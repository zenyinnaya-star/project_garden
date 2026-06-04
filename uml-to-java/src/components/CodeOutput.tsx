import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-sql';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramType, TargetLang } from '../types';
import { getLangMeta } from './LanguagePicker';

interface Props {
  code: string;
  diagramType: DiagramType;
  targetLang: TargetLang;
  nodes?: Node[];
  edges?: Edge[];
  onClose?: () => void;
}

function isEmpty(code: string) {
  const t = code.trim();
  return t === '' || t === '// Nothing to generate yet.' || (t.startsWith('--') && t.split('\n').length < 4);
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const TOOL_BUTTONS: Record<string, { label: string; color: string }[]> = {
  java:       [{ label: 'VS Code', color: '#60a5fa' }, { label: 'IntelliJ', color: '#f472b6' }, { label: 'Eclipse', color: '#818cf8' }],
  python:     [{ label: 'VS Code', color: '#60a5fa' }, { label: 'PyCharm', color: '#4ade80' }, { label: 'Jupyter', color: '#fbbf24' }],
  cpp:        [{ label: 'VS Code', color: '#60a5fa' }, { label: 'CLion', color: '#34d399' }, { label: 'Xcode', color: '#a78bfa' }],
  csharp:     [{ label: 'VS Code', color: '#60a5fa' }, { label: 'Rider', color: '#f472b6' }, { label: 'Visual Studio', color: '#a78bfa' }],
  typescript: [{ label: 'VS Code', color: '#60a5fa' }, { label: 'WebStorm', color: '#60a5fa' }],
  javascript: [{ label: 'VS Code', color: '#60a5fa' }, { label: 'WebStorm', color: '#60a5fa' }],
  kotlin:     [{ label: 'IntelliJ', color: '#f472b6' }, { label: 'Android Studio', color: '#4ade80' }],
  go:         [{ label: 'VS Code', color: '#67e8f9' }, { label: 'GoLand', color: '#38bdf8' }],
  swift:      [{ label: 'Xcode', color: '#f87171' }],
  php:        [{ label: 'VS Code', color: '#60a5fa' }, { label: 'PhpStorm', color: '#c084fc' }],
  ruby:       [{ label: 'VS Code', color: '#60a5fa' }, { label: 'RubyMine', color: '#f9a8d4' }],
  oracle:     [{ label: 'SQL*Plus', color: '#f97316' }, { label: 'DBeaver', color: '#fbbf24' }, { label: 'DataGrip', color: '#34d399' }],
  postgresql: [{ label: 'pgAdmin', color: '#60a5fa' }, { label: 'DBeaver', color: '#fbbf24' }, { label: 'DataGrip', color: '#34d399' }],
  mysql:      [{ label: 'MySQL Workbench', color: '#4ade80' }, { label: 'DBeaver', color: '#fbbf24' }],
  sqlite:     [{ label: 'DB Browser', color: '#a78bfa' }, { label: 'DBeaver', color: '#fbbf24' }],
  mssql:      [{ label: 'SSMS', color: '#fbbf24' }, { label: 'Azure Data Studio', color: '#60a5fa' }],
  // sequence / activity — same IDE tools as the chosen lang (falls through to targetLang lookup above)
};

export default function CodeOutput({ code, diagramType, targetLang, onClose }: Props) {
  const codeRef  = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [hintTool, setHintTool] = useState<string | null>(null);
  const [width, setWidth] = useState(440);
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startW   = useRef(440);

  const meta = getLangMeta(targetLang);
  const tools = TOOL_BUTTONS[targetLang] ?? [];

  /* Prism highlight */
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = code;
      try { Prism.highlightElement(codeRef.current); } catch { /* ignore unknown lang */ }
    }
  }, [code, targetLang]);

  /* Drag-to-resize */
  const onDragStart = (e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX.current - e.clientX;
      setWidth(Math.max(300, Math.min(900, startW.current + delta)));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleDownload = () => {
    downloadFile(code, `output.${meta.ext}`);
    setHintTool('download');
    setTimeout(() => setHintTool(null), 2000);
  };

  return (
    <div style={{ width, minWidth: 300, maxWidth: 900, display: 'flex', flexDirection: 'column', background: '#050a12', borderLeft: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative', transition: 'width 0.05s linear', fontFamily: 'sans-serif' }}>

      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, cursor: 'ew-resize', zIndex: 10, background: 'transparent', transition: 'background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      />

      {/* ── Header ── */}
      <div style={{ padding: '10px 14px 10px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#080e18', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Language dot + name */}
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0, boxShadow: `0 0 8px ${meta.color}` }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {meta.label} Output
        </span>
        <span style={{ fontSize: 10, color: '#3f3f46', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 6px' }}>
          .{meta.ext}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* Download */}
          <button onClick={handleDownload} title="Download file"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#71717a', padding: '4px 9px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e4e4e7'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            .{meta.ext}
          </button>

          {/* Copy */}
          <button onClick={handleCopy}
            style={{ background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 5, color: copied ? '#4ade80' : '#71717a', padding: '4px 11px', fontSize: 11, cursor: 'pointer', fontWeight: copied ? 700 : 400, transition: 'all 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>

          {/* Close */}
          {onClose && (
            <button onClick={onClose} title="Close panel"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: '#3f3f46', padding: '4px 7px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Tool strip ── */}
      {!isEmpty(code) && tools.length > 0 && (
        <div style={{ padding: '7px 14px 7px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#060c15', display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#3f3f46', marginRight: 4, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>
            {diagramType === 'er' ? 'DB Client:' : 'Open in:'}
          </span>
          {tools.map(t => {
            const active = hintTool === t.label;
            return (
              <button key={t.label}
                onClick={() => { handleDownload(); setHintTool(t.label); setTimeout(() => setHintTool(null), 2500); }}
                style={{ background: active ? t.color + '18' : 'transparent', border: `1px solid ${active ? t.color + '55' : 'rgba(255,255,255,0.07)'}`, borderRadius: 5, color: active ? t.color : '#52525b', padding: '3px 9px', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = t.color + '55'; e.currentTarget.style.color = t.color; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#52525b'; }}}>
                {active ? `Saved ✓` : t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Code area ── */}
      <div style={{ flex: 1, overflow: 'auto', background: '#000000' }}>
        {isEmpty(code) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40 }}>
            {/* Language orb */}
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: meta.bg, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 28px ${meta.color}22` }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: meta.color }}>{meta.short}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#a1a1aa', marginBottom: 8 }}>No code generated yet</div>
              <div style={{ fontSize: 12, color: '#3f3f46', lineHeight: 1.7, maxWidth: 260 }}>
                Build your {diagramType} diagram on the canvas, then click{' '}
                <span style={{ color: meta.color, fontWeight: 600 }}>Generate</span> to produce {meta.label} code.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['class','flowchart','er'] as const).map(t => (
                <span key={t} style={{ fontSize: 10, color: '#3f3f46', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 8px', textTransform: 'capitalize' }}>{t}</span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 18px', minHeight: '100%' }}>
            {/* Line numbers + code */}
            <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.75, fontFamily: '"JetBrains Mono","Fira Code",monospace' }}>
              <code ref={codeRef} className={`language-${meta.prism}`} style={{ background: 'transparent', fontSize: 'inherit', fontFamily: 'inherit' }}/>
            </pre>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      {!isEmpty(code) && (
        <div style={{ padding: '5px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#060c15', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}/>
          <span style={{ fontSize: 10, color: '#52525b' }}>
            {code.split('\n').length} lines · {code.length} chars
          </span>
          <span style={{ fontSize: 10, color: '#3f3f46', marginLeft: 'auto' }}>
            {meta.label} · UML→Code
          </span>
        </div>
      )}
    </div>
  );
}

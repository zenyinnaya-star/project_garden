import { useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramType } from '../types';
import { parseSqlToNodes } from '../parsers/sqlParser';
import { parseJavaToNodes } from '../parsers/javaParser';
import { generateDDL, type SqlDialect } from '../generators/sqlDialects';
import { generateClassCode } from '../generators/classGenerator';

interface Props {
  onImport: (type: DiagramType, nodes: Node[], edges: Edge[]) => void;
  onClose: () => void;
}

type Lang = 'java' | 'sql';

function detect(text: string): Lang {
  const t = text.trimStart().toLowerCase();
  if (t.includes('create table') || t.includes('create or replace')) return 'sql';
  if (t.includes('public class') || t.includes('public interface') || t.includes('import java')) return 'java';
  return 'java';
}

type ConvResult = { lang: Lang; nodeCount: number; nodes: Node[]; edges: Edge[] };

const SQL_DIALECTS: { id: SqlDialect; label: string; color: string }[] = [
  { id: 'oracle',     label: 'Oracle',     color: '#f97316' },
  { id: 'postgresql', label: 'PostgreSQL', color: '#60a5fa' },
  { id: 'mysql',      label: 'MySQL',      color: '#4ade80' },
  { id: 'sqlite',     label: 'SQLite',     color: '#a78bfa' },
];

const JAVA_IDES = [
  { id: 'vscode',    label: 'VS Code',  hint: 'code output.java',  color: '#60a5fa' },
  { id: 'intellij',  label: 'IntelliJ', hint: 'idea output.java',  color: '#f472b6' },
  { id: 'eclipse',   label: 'Eclipse',  hint: 'eclipse -import',   color: '#818cf8' },
];

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function CodeDropPanel({ onImport, onClose }: Props) {
  const [lang, setLang] = useState<Lang>('java');
  const [code, setCode] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ConvResult | null>(null);
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('oracle');
  const [ideHint, setIdeHint] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const convert = (text: string, forceLang?: Lang) => {
    setError(''); setResult(null);
    const l = forceLang ?? lang;
    try {
      if (l === 'java') {
        const { nodes, edges } = parseJavaToNodes(text);
        if (nodes.length === 0) throw new Error('No class or interface definitions found in the Java code.');
        setResult({ lang: 'java', nodeCount: nodes.length, nodes, edges });
      } else {
        const { nodes, edges } = parseSqlToNodes(text);
        if (nodes.length === 0) throw new Error('No CREATE TABLE statements found in the SQL/DDL.');
        setResult({ lang: 'sql', nodeCount: nodes.length, nodes, edges });
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? String(e));
    }
  };

  const applyResult = () => {
    if (!result) return;
    onImport(result.lang === 'java' ? 'class' : 'er', result.nodes, result.edges);
    onClose();
  };

  const handleFile = async (file: File) => {
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const text = await file.text();
    const forceLang: Lang = ext === 'sql' ? 'sql' : ext === 'java' ? 'java' : detect(text);
    setLang(forceLang);
    setCode(text);
    convert(text, forceLang);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { handleFile(file); return; }
    // plain text drop
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const l = detect(text);
      setLang(l);
      setCode(text);
      convert(text, l);
    }
  };

  const accent = '#dc2626';
  const accentLight = '#fee2e2';
  const accentMid = '#fca5a5';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: accent, padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Code → Diagram</div>
          <div style={{ color: '#fecaca', fontSize: 11, marginTop: 2 }}>
            Drop or paste Java / Oracle DDL to generate a diagram instantly
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 6, color: '#fff', padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>

        {/* Left — lang picker + code area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 14, overflow: 'hidden' }}>

          {/* Lang tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['java', 'sql'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); setError(''); }}
                style={{
                  padding: '7px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: lang === l ? accent : '#fff',
                  border: `2px solid ${lang === l ? accent : accentMid}`,
                  color: lang === l ? '#fff' : accent,
                  transition: 'all 0.15s',
                }}
              >
                {l === 'java' ? 'Java → Class Diagram' : 'Oracle DDL → ER Diagram'}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? accent : accentMid}`,
              borderRadius: 10,
              padding: '18px 24px',
              background: dragging ? accentLight : '#fff9f9',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 12 15 15"/>
              </svg>
            </div>
            <div style={{ color: accent, fontWeight: 600, fontSize: 13 }}>
              Drop a {lang === 'java' ? '.java' : '.sql'} file here
            </div>
            <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
              or <span style={{ color: accent, textDecoration: 'underline' }}>browse</span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={lang === 'java' ? '.java' : '.sql'}
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
            <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>OR PASTE CODE</span>
            <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
          </div>

          {/* Textarea */}
          <textarea
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            placeholder={lang === 'java'
              ? 'public class Order {\n  private Long id;\n  private Customer customer;\n  // ...\n}'
              : 'CREATE TABLE customers (\n  customer_id NUMBER(10) PRIMARY KEY,\n  name VARCHAR2(100),\n  -- ...\n);'
            }
            style={{
              flex: 1,
              resize: 'none',
              border: `1.5px solid ${accentMid}`,
              borderRadius: 8,
              padding: '12px 14px',
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.7,
              color: '#1e293b',
              background: '#fff',
              outline: 'none',
              minHeight: 160,
            }}
            onFocus={e => (e.target.style.borderColor = accent)}
            onBlur={e => (e.target.style.borderColor = accentMid)}
          />

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 6, padding: '9px 12px',
              color: accent, fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {error}
            </div>
          )}

          {/* Convert button */}
          {!result && (
            <button
              onClick={() => convert(code)}
              disabled={!code.trim()}
              style={{
                background: code.trim() ? accent : '#fca5a5',
                border: 'none', borderRadius: 8,
                color: '#fff', padding: '12px 0',
                fontSize: 14, fontWeight: 700, cursor: code.trim() ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Convert to {lang === 'java' ? 'Class Diagram' : 'ER Diagram'}
            </button>
          )}

          {/* ── Success result panel ── */}
          {result && (
            <div style={{ flexShrink: 0, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Success header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                    {result.lang === 'java' ? `Parsed ${result.nodeCount} class${result.nodeCount !== 1 ? 'es' : ''}` : `Parsed ${result.nodeCount} table${result.nodeCount !== 1 ? 's' : ''}`}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803d' }}>Ready to build your diagram</div>
                </div>
              </div>

              {/* SQL dialect selector */}
              {result.lang === 'sql' && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Target Database</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {SQL_DIALECTS.map(d => (
                      <button key={d.id} onClick={() => setSqlDialect(d.id)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        background: sqlDialect === d.id ? d.color : '#fff',
                        border: `1.5px solid ${sqlDialect === d.id ? d.color : '#e5e7eb'}`,
                        color: sqlDialect === d.id ? '#fff' : '#6b7280',
                        transition: 'all 0.15s',
                      }}>{d.label}</button>
                    ))}
                  </div>
                  <button
                    onClick={() => { downloadFile(generateDDL(result.nodes, result.edges, sqlDialect), `schema_${sqlDialect}.sql`); }}
                    style={{ marginTop: 8, width: '100%', padding: '7px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download {SQL_DIALECTS.find(d => d.id === sqlDialect)?.label} DDL
                  </button>
                </div>
              )}

              {/* Java IDE buttons */}
              {result.lang === 'java' && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Open in IDE</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {JAVA_IDES.map(ide => (
                      <button key={ide.id}
                        onClick={() => { downloadFile(generateClassCode(result.nodes, result.edges), 'diagram_output.java'); setIdeHint(ide.id); setTimeout(() => setIdeHint(null), 3000); }}
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: ideHint === ide.id ? ide.color : '#fff', border: `1.5px solid ${ideHint === ide.id ? ide.color : '#e5e7eb'}`, color: ideHint === ide.id ? '#fff' : '#6b7280', transition: 'all 0.15s' }}
                        onMouseEnter={e => { if (ideHint !== ide.id) { e.currentTarget.style.borderColor = ide.color; e.currentTarget.style.color = ide.color; } }}
                        onMouseLeave={e => { if (ideHint !== ide.id) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; } }}
                      >
                        {ideHint === ide.id ? `Run: ${ide.hint}` : ide.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setResult(null); setCode(''); }} style={{ flex: 1, padding: '8px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>
                  ← Try another
                </button>
                <button onClick={applyResult} style={{ flex: 2, padding: '8px', background: accent, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Open in Canvas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — cheat sheet */}
        <div style={{
          width: 240, background: '#fff9f9',
          borderLeft: `1px solid ${accentLight}`,
          padding: '24px 18px', overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
            {lang === 'java' ? 'Java Tips' : 'Oracle Tips'}
          </div>

          {lang === 'java' ? (
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.8 }}>
              {[
                ['Class', 'public class Foo { }'],
                ['Interface', 'public interface Bar { }'],
                ['Abstract', 'public abstract class Baz { }'],
                ['Extends', 'class A extends B { }'],
                ['Implements', 'class A implements B { }'],
                ['Field', 'private String name;'],
                ['Method', 'public void doIt() { }'],
              ].map(([label, ex]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ color: accent, fontWeight: 600, fontSize: 11 }}>{label}</div>
                  <code style={{ background: accentLight, color: '#7f1d1d', fontSize: 10, padding: '2px 5px', borderRadius: 3, display: 'block', marginTop: 2 }}>{ex}</code>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.8 }}>
              {[
                ['Table', 'CREATE TABLE name ( ... );'],
                ['Primary Key', 'col NUMBER PRIMARY KEY'],
                ['Foreign Key', 'REFERENCES other_table(col)'],
                ['VARCHAR', 'name VARCHAR2(100)'],
                ['Number', 'amount NUMBER(10,2)'],
                ['Date', 'created_at DATE'],
                ['Constraint', 'CONSTRAINT pk_name PRIMARY KEY(id)'],
              ].map(([label, ex]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ color: accent, fontWeight: 600, fontSize: 11 }}>{label}</div>
                  <code style={{ background: accentLight, color: '#7f1d1d', fontSize: 10, padding: '2px 5px', borderRadius: 3, display: 'block', marginTop: 2 }}>{ex}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

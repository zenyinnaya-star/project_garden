import { useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramType } from '../types';
import { parseSqlToNodes } from '../parsers/sqlParser';
import { parseJavaToNodes } from '../parsers/javaParser';
import {
  parsePythonToNodes,
  parseKotlinToNodes,
  parseCSharpToNodes,
  parseTypeScriptToNodes,
  parsePHPToNodes,
  parseRubyToNodes,
} from '../parsers/universalClassParser';
import { parseCodeToSequence } from '../parsers/codeToSequenceParser';
import { parseCodeToFlowchart, parseCodeToActivity } from '../parsers/codeToFlowParser';
import { generateDiagramSVG, downloadSVG, downloadPNG } from '../utils/diagramSvgExport';

/* ── Types ─────────────────────────────────────────────────────────────────── */
type OopLang = 'java' | 'kotlin' | 'python' | 'csharp' | 'typescript' | 'php' | 'ruby';
type SqlLang = 'oracle' | 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
type InputLang = OopLang | SqlLang;

interface ConvResult {
  nodes: Node[];
  edges: Edge[];
  diagramType: DiagramType;
  svgString: string;
  nodeCount: number;
}

/* ── Constants ─────────────────────────────────────────────────────────────── */
const OOP_LANGS: { id: OopLang; label: string; ext: string }[] = [
  { id: 'java',       label: 'Java',       ext: '.java' },
  { id: 'kotlin',     label: 'Kotlin',     ext: '.kt'   },
  { id: 'python',     label: 'Python',     ext: '.py'   },
  { id: 'csharp',     label: 'C#',         ext: '.cs'   },
  { id: 'typescript', label: 'TypeScript', ext: '.ts'   },
  { id: 'php',        label: 'PHP',        ext: '.php'  },
  { id: 'ruby',       label: 'Ruby',       ext: '.rb'   },
];

const SQL_LANGS: { id: SqlLang; label: string }[] = [
  { id: 'oracle',     label: 'Oracle'     },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mysql',      label: 'MySQL'      },
  { id: 'sqlite',     label: 'SQLite'     },
  { id: 'mssql',      label: 'MSSQL'      },
];

const OOP_DIAGRAM_TARGETS: { id: DiagramType; label: string; desc: string }[] = [
  { id: 'class',     label: 'Class',      desc: 'UML class diagram' },
  { id: 'sequence',  label: 'Sequence',   desc: 'Interaction flow'  },
  { id: 'flowchart', label: 'Flowchart',  desc: 'Control flow'      },
  { id: 'activity',  label: 'Activity',   desc: 'Activity diagram'  },
];

function isOopLang(lang: InputLang): lang is OopLang {
  return OOP_LANGS.some(l => l.id === lang);
}

/* ── Placeholder snippets ─────────────────────────────────────────────────── */
const PLACEHOLDERS: Record<InputLang, string> = {
  java:       'public class Order {\n  private Long id;\n  private Customer customer;\n  private List<OrderItem> items;\n\n  public void addItem(OrderItem item) {\n    this.items.add(item);\n  }\n}',
  kotlin:     'class Order(\n  val id: Long,\n  val customer: Customer,\n  val items: MutableList<OrderItem> = mutableListOf()\n) {\n  fun addItem(item: OrderItem) {\n    items.add(item)\n  }\n}',
  python:     'class Order:\n    def __init__(self, id: int, customer: Customer):\n        self.id = id\n        self.customer = customer\n        self.items: list[OrderItem] = []\n\n    def add_item(self, item: OrderItem) -> None:\n        self.items.append(item)',
  csharp:     'public class Order {\n    private long _id;\n    private Customer _customer;\n    private List<OrderItem> _items = new();\n\n    public void AddItem(OrderItem item) {\n        _items.Add(item);\n    }\n}',
  typescript: 'class Order {\n  private id: number;\n  private customer: Customer;\n  private items: OrderItem[] = [];\n\n  addItem(item: OrderItem): void {\n    this.items.push(item);\n  }\n}',
  php:        '<?php\nclass Order {\n    private int $id;\n    private Customer $customer;\n    private array $items = [];\n\n    public function addItem(OrderItem $item): void {\n        $this->items[] = $item;\n    }\n}',
  ruby:       'class Order\n  attr_reader :id, :customer, :items\n\n  def initialize(id, customer)\n    @id = id\n    @customer = customer\n    @items = []\n  end\n\n  def add_item(item)\n    @items << item\n  end\nend',
  oracle:     'CREATE TABLE customers (\n  customer_id  NUMBER(10)    PRIMARY KEY,\n  name         VARCHAR2(100) NOT NULL,\n  email        VARCHAR2(200) UNIQUE\n);\n\nCREATE TABLE orders (\n  order_id    NUMBER(10) PRIMARY KEY,\n  customer_id NUMBER(10) REFERENCES customers(customer_id),\n  total       NUMBER(12,2)\n);',
  postgresql: 'CREATE TABLE customers (\n  customer_id SERIAL PRIMARY KEY,\n  name        VARCHAR(100) NOT NULL,\n  email       VARCHAR(200) UNIQUE\n);\n\nCREATE TABLE orders (\n  order_id    SERIAL PRIMARY KEY,\n  customer_id INTEGER REFERENCES customers(customer_id),\n  total       NUMERIC(12,2)\n);',
  mysql:      'CREATE TABLE customers (\n  customer_id INT AUTO_INCREMENT PRIMARY KEY,\n  name        VARCHAR(100) NOT NULL,\n  email       VARCHAR(200) UNIQUE\n);\n\nCREATE TABLE orders (\n  order_id    INT AUTO_INCREMENT PRIMARY KEY,\n  customer_id INT,\n  total       DECIMAL(12,2),\n  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)\n);',
  sqlite:     'CREATE TABLE customers (\n  customer_id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name        TEXT NOT NULL,\n  email       TEXT UNIQUE\n);\n\nCREATE TABLE orders (\n  order_id    INTEGER PRIMARY KEY AUTOINCREMENT,\n  customer_id INTEGER REFERENCES customers(customer_id),\n  total       REAL\n);',
  mssql:      'CREATE TABLE customers (\n  customer_id INT IDENTITY(1,1) PRIMARY KEY,\n  name        NVARCHAR(100) NOT NULL,\n  email       NVARCHAR(200) UNIQUE\n);\n\nCREATE TABLE orders (\n  order_id    INT IDENTITY(1,1) PRIMARY KEY,\n  customer_id INT REFERENCES customers(customer_id),\n  total       DECIMAL(12,2)\n);',
};

/* ── Auto-detect language from code ──────────────────────────────────────────*/
function autoDetect(text: string): InputLang {
  const t = text.trimStart().toLowerCase();
  if (/create\s+table|create\s+or\s+replace/.test(t)) {
    if (/number\(|varchar2|rownum/.test(t)) return 'oracle';
    if (/serial\b|bigserial/.test(t)) return 'postgresql';
    if (/auto_increment|engine\s*=/.test(t)) return 'mysql';
    if (/autoincrement/.test(t)) return 'sqlite';
    if (/nvarchar|identity\s*\(/.test(t)) return 'mssql';
    return 'oracle';
  }
  if (/^\s*def\s+\w+|^\s*class\s+\w+\s*:/m.test(text)) return 'python';
  if (/fun\s+\w+|val\s+\w+|data\s+class/.test(t)) return 'kotlin';
  if (/namespace\s+\w+|public\s+\w+\s+class\s+\w+\s*\{/.test(t)) return 'csharp';
  if (/interface\s+\w+\s*{|:\s*(string|number|boolean)\b/.test(t)) return 'typescript';
  if (/<\?php|function\s+\w+\(/.test(t) && /\$this/.test(t)) return 'php';
  if (/def\s+initialize|attr_reader|\.each\s*do/.test(t)) return 'ruby';
  return 'java';
}

/* ── Props ─────────────────────────────────────────────────────────────────── */
interface Props {
  onImport: (type: DiagramType, nodes: Node[], edges: Edge[]) => void;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CodeDropPanel({ onImport, onClose }: Props) {
  const [inputLang, setInputLang] = useState<InputLang>('java');
  const [diagramTarget, setDiagramTarget] = useState<DiagramType>('class');
  const [code, setCode] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ConvResult | null>(null);
  const [converting, setConverting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Colours ── */
  const RED     = '#dc2626';
  const RED_DIM  = 'rgba(220,38,38,0.18)';
  const RED_GLOW = 'rgba(220,38,38,0.45)';
  const BG      = '#000000';
  const SURFACE  = '#0d0d0d';
  const CARD     = '#111116';
  const BORDER   = 'rgba(255,255,255,0.08)';
  const BORDER_H = 'rgba(255,255,255,0.18)';
  const TXT      = '#e2e8f0';
  const TXT_M    = '#71717a';
  const TXT_D    = '#3f3f46';

  /* ── Derived ── */
  const isSql = !isOopLang(inputLang);
  const effectiveTarget: DiagramType = isSql ? 'er' : diagramTarget;
  const currentLangInfo = isSql
    ? SQL_LANGS.find(l => l.id === inputLang)
    : OOP_LANGS.find(l => l.id === inputLang);
  const fileExt = isSql ? '.sql' : (OOP_LANGS.find(l => l.id === inputLang)?.ext ?? '.txt');

  /* ── Convert logic ───────────────────────────────────────────────────────── */
  const runConvert = (text: string, lang: InputLang, target: DiagramType) => {
    setError('');
    setResult(null);
    setConverting(true);

    try {
      let nodes: Node[] = [];
      let edges: Edge[] = [];
      let finalTarget: DiagramType = target;

      if (!isOopLang(lang)) {
        // SQL → ER
        const parsed = parseSqlToNodes(text);
        nodes = parsed.nodes; edges = parsed.edges;
        finalTarget = 'er';
        if (nodes.length === 0) throw new Error('No CREATE TABLE statements found.');
      } else if (target === 'sequence') {
        const parsed = parseCodeToSequence(text);
        nodes = parsed.nodes; edges = parsed.edges;
      } else if (target === 'flowchart') {
        const parsed = parseCodeToFlowchart(text);
        nodes = parsed.nodes; edges = parsed.edges;
      } else if (target === 'activity') {
        const parsed = parseCodeToActivity(text);
        nodes = parsed.nodes; edges = parsed.edges;
      } else {
        // Class diagram — use language-specific OOP parser
        const parsers: Record<OopLang, (c: string) => { nodes: Node[]; edges: Edge[] }> = {
          java:       parseJavaToNodes,
          kotlin:     parseKotlinToNodes,
          python:     parsePythonToNodes,
          csharp:     parseCSharpToNodes,
          typescript: parseTypeScriptToNodes,
          php:        parsePHPToNodes,
          ruby:       parseRubyToNodes,
        };
        const parsed = parsers[lang as OopLang](text);
        nodes = parsed.nodes; edges = parsed.edges;
        finalTarget = 'class';
        if (nodes.length === 0) throw new Error('No class definitions found.');
      }

      const svgString = generateDiagramSVG(nodes, edges, finalTarget);
      setResult({ nodes, edges, diagramType: finalTarget, svgString, nodeCount: nodes.length });
    } catch (e: unknown) {
      setError((e as Error).message ?? String(e));
    } finally {
      setConverting(false);
    }
  };

  /* ── File handler ────────────────────────────────────────────────────────── */
  const handleFile = async (file: File) => {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    const text = await file.text();
    const detected: InputLang =
      ext === 'sql' ? autoDetect(text) :
      ext === 'java' ? 'java' :
      ext === 'kt'   ? 'kotlin' :
      ext === 'py'   ? 'python' :
      ext === 'cs'   ? 'csharp' :
      ext === 'ts'   ? 'typescript' :
      ext === 'php'  ? 'php' :
      ext === 'rb'   ? 'ruby' :
      autoDetect(text);
    setInputLang(detected);
    setCode(text);
    const tgt: DiagramType = !isOopLang(detected) ? 'er' : diagramTarget;
    runConvert(text, detected, tgt);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { handleFile(file); return; }
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const detected = autoDetect(text);
      setInputLang(detected);
      setCode(text);
      const tgt: DiagramType = !isOopLang(detected) ? 'er' : diagramTarget;
      runConvert(text, detected, tgt);
    }
  };

  /* ── Shared button style helper ──────────────────────────────────────────── */
  const langBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 13px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    border: `1px solid ${active ? RED : BORDER}`,
    background: active ? RED_DIM : 'transparent',
    color: active ? RED : TXT_M,
    transition: 'all 0.15s',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
  });

  const targetBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '7px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    border: `1px solid ${active ? RED : BORDER}`,
    background: active ? RED_DIM : SURFACE,
    color: active ? RED : TXT_M,
    transition: 'all 0.15s',
    textAlign: 'center' as const,
  });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: BG,
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 52, flexShrink: 0,
        background: SURFACE,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Icon */}
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: RED_DIM, border: `1px solid ${RED}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div>
            <div style={{ color: TXT, fontWeight: 700, fontSize: 14, lineHeight: '1.2' }}>Code Import</div>
            <div style={{ color: TXT_M, fontSize: 11, lineHeight: '1.2' }}>
              {currentLangInfo?.label ?? inputLang} → {effectiveTarget.charAt(0).toUpperCase() + effectiveTarget.slice(1)} diagram
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: `1px solid ${BORDER}`,
            borderRadius: 7, color: TXT_M, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TXT; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TXT_M; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Close
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ════════ LEFT PANEL ════════ */}
        <div style={{
          width: 340, flexShrink: 0,
          background: SURFACE,
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── OOP Languages ── */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: TXT_D, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                OOP Languages
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {OOP_LANGS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setInputLang(l.id); setError(''); setResult(null); }}
                    style={langBtnStyle(inputLang === l.id)}
                    onMouseEnter={e => { if (inputLang !== l.id) { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TXT; } }}
                    onMouseLeave={e => { if (inputLang !== l.id) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TXT_M; } }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── SQL Dialects ── */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: TXT_D, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                SQL Dialects
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SQL_LANGS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setInputLang(l.id); setError(''); setResult(null); }}
                    style={langBtnStyle(inputLang === l.id)}
                    onMouseEnter={e => { if (inputLang !== l.id) { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TXT; } }}
                    onMouseLeave={e => { if (inputLang !== l.id) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TXT_M; } }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Diagram Target (OOP only) ── */}
            {!isSql && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: TXT_D, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Output Diagram
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {OOP_DIAGRAM_TARGETS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setDiagramTarget(t.id); setError(''); setResult(null); }}
                      title={t.desc}
                      style={targetBtnStyle(diagramTarget === t.id)}
                      onMouseEnter={e => { if (diagramTarget !== t.id) { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TXT; } }}
                      onMouseLeave={e => { if (diagramTarget !== t.id) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TXT_M; } }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Divider ── */}
            <div style={{ height: 1, background: BORDER }} />

            {/* ── Drop zone ── */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1.5px dashed ${dragging ? RED : TXT_D}`,
                borderRadius: 9,
                padding: '16px',
                background: dragging ? RED_DIM : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dragging ? RED : TXT_D} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 6px', display: 'block' }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 12 15 15"/>
              </svg>
              <div style={{ color: dragging ? RED : TXT_M, fontSize: 12, fontWeight: 600 }}>
                Drop a <span style={{ color: dragging ? RED : '#a1a1aa' }}>{fileExt}</span> file here
              </div>
              <div style={{ color: TXT_D, fontSize: 11, marginTop: 3 }}>
                or <span style={{ color: TXT_M, textDecoration: 'underline' }}>browse files</span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={fileExt}
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />

            {/* ── Paste code ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span style={{ color: TXT_D, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>or paste</span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            {/* ── Textarea ── */}
            <textarea
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); if (result) setResult(null); }}
              placeholder={PLACEHOLDERS[inputLang]}
              spellCheck={false}
              style={{
                resize: 'none',
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '12px 14px',
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                fontSize: 11.5,
                lineHeight: 1.75,
                color: TXT,
                background: CARD,
                outline: 'none',
                minHeight: 200,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = RED)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />

            {/* ── Error ── */}
            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.1)',
                border: `1px solid rgba(220,38,38,0.35)`,
                borderRadius: 7, padding: '10px 12px',
                color: '#fca5a5', fontSize: 12,
                display: 'flex', alignItems: 'flex-start', gap: 8,
                lineHeight: 1.5,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* ── Convert button ── */}
            <button
              onClick={() => runConvert(code, inputLang, effectiveTarget)}
              disabled={!code.trim() || converting}
              style={{
                background: code.trim() && !converting ? RED : 'rgba(220,38,38,0.3)',
                border: 'none', borderRadius: 8,
                color: code.trim() && !converting ? '#fff' : 'rgba(255,255,255,0.4)',
                padding: '12px 0',
                fontSize: 13, fontWeight: 700,
                cursor: code.trim() && !converting ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
                boxShadow: code.trim() && !converting ? `0 0 20px ${RED_GLOW}` : 'none',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (code.trim() && !converting) e.currentTarget.style.background = '#b91c1c'; }}
              onMouseLeave={e => { if (code.trim() && !converting) e.currentTarget.style.background = RED; }}
            >
              {converting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                  Convert to {effectiveTarget.charAt(0).toUpperCase() + effectiveTarget.slice(1)} Diagram
                </>
              )}
            </button>

          </div>{/* end scroll area */}
        </div>{/* end left panel */}

        {/* ════════ RIGHT PANEL — PREVIEW ════════ */}
        <div style={{
          flex: 1,
          background: BG,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Preview top bar */}
          <div style={{
            height: 44, flexShrink: 0,
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: result ? RED : TXT_D }} />
              <span style={{ color: result ? TXT : TXT_D, fontSize: 12, fontWeight: 600 }}>
                {result ? `Preview — ${result.nodeCount} node${result.nodeCount !== 1 ? 's' : ''}` : 'Preview'}
              </span>
            </div>
            {result && (
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Download SVG */}
                <button
                  onClick={() => downloadSVG(result.svgString, `diagram.svg`)}
                  style={{
                    background: 'transparent', border: `1px solid ${BORDER}`,
                    borderRadius: 6, color: TXT_M, padding: '5px 12px',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TXT; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TXT_M; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  SVG
                </button>

                {/* Download PNG */}
                <button
                  onClick={() => downloadPNG(result.svgString, `diagram.png`)}
                  style={{
                    background: 'transparent', border: `1px solid ${BORDER}`,
                    borderRadius: 6, color: TXT_M, padding: '5px 12px',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TXT; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TXT_M; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  PNG
                </button>

                {/* Open in Canvas */}
                <button
                  onClick={() => { onImport(result.diagramType, result.nodes, result.edges); onClose(); }}
                  style={{
                    background: RED, border: 'none',
                    borderRadius: 6, color: '#fff', padding: '5px 14px',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                    boxShadow: `0 0 14px ${RED_GLOW}`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#b91c1c'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = RED; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Open in Canvas
                </button>
              </div>
            )}
          </div>

          {/* Preview area */}
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            {!result && !converting && (
              /* Empty state */
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 14,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: CARD, border: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={TXT_D} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <path d="M17.5 14v3M17.5 17h3M17.5 17h-3"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: TXT_M, fontSize: 13, fontWeight: 600 }}>Diagram preview will appear here</div>
                  <div style={{ color: TXT_D, fontSize: 12, marginTop: 4 }}>
                    Paste or drop code, then click Convert
                  </div>
                </div>
                {/* Hint chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360, marginTop: 8 }}>
                  {(isSql
                    ? [{ label: 'Tables → Entity nodes', icon: '◈' }, { label: 'FK constraints → Relationships', icon: '→' }]
                    : effectiveTarget === 'class'
                      ? [{ label: 'Classes → UML nodes', icon: '◈' }, { label: 'Inheritance → Edges', icon: '→' }]
                      : effectiveTarget === 'sequence'
                        ? [{ label: 'Classes → Participants', icon: '◈' }, { label: 'Methods → Messages', icon: '→' }]
                        : [{ label: 'Methods → Flow nodes', icon: '◈' }, { label: 'if/for → Decisions', icon: '→' }]
                  ).map(chip => (
                    <div key={chip.label} style={{
                      background: CARD, border: `1px solid ${BORDER}`,
                      borderRadius: 100, padding: '4px 12px',
                      fontSize: 11, color: TXT_M,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ color: RED }}>{chip.icon}</span>
                      {chip.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {converting && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <div style={{
                  width: 44, height: 44,
                  border: `2px solid ${BORDER}`,
                  borderTop: `2px solid ${RED}`,
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                <div style={{ color: TXT_M, fontSize: 12 }}>Parsing…</div>
              </div>
            )}

            {result && (
              <div style={{ padding: 24, minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Success badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 8, padding: '8px 14px', alignSelf: 'flex-start',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ color: '#86efac', fontSize: 12, fontWeight: 600 }}>
                    {result.nodeCount} {result.diagramType === 'er' ? 'table' : 'class'}{result.nodeCount !== 1 ? 's' : ''} parsed successfully
                  </span>
                </div>

                {/* SVG Preview */}
                <div style={{
                  background: CARD, border: `1px solid ${BORDER}`,
                  borderRadius: 12, overflow: 'hidden',
                  flex: 1, minHeight: 320,
                }}>
                  {/* Terminal chrome */}
                  <div style={{
                    height: 36, background: SURFACE,
                    borderBottom: `1px solid ${BORDER}`,
                    display: 'flex', alignItems: 'center',
                    padding: '0 14px', gap: 7,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                    <span style={{ marginLeft: 8, color: TXT_D, fontSize: 11 }}>diagram.{result.diagramType}.svg</span>
                  </div>

                  {/* SVG embed */}
                  <div
                    style={{ padding: 20, overflow: 'auto', maxHeight: 480 }}
                    dangerouslySetInnerHTML={{ __html: result.svgString }}
                  />
                </div>

                {/* Bottom action bar */}
                <div style={{
                  display: 'flex', gap: 10, flexWrap: 'wrap',
                  padding: '14px 16px',
                  background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}`,
                  alignItems: 'center',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: TXT, fontSize: 12, fontWeight: 600 }}>Ready to use in the editor</div>
                    <div style={{ color: TXT_M, fontSize: 11, marginTop: 2 }}>Open in Canvas to start editing nodes and relationships</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => { setResult(null); setCode(''); setError(''); }}
                      style={{
                        background: 'transparent', border: `1px solid ${BORDER}`,
                        borderRadius: 7, color: TXT_M, padding: '8px 14px',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TXT; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TXT_M; }}
                    >
                      ← New Import
                    </button>
                    <button
                      onClick={() => { onImport(result.diagramType, result.nodes, result.edges); onClose(); }}
                      style={{
                        background: RED, border: 'none',
                        borderRadius: 7, color: '#fff', padding: '8px 18px',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: `0 0 18px ${RED_GLOW}`,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#b91c1c'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = RED; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      Open in Canvas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>{/* end right panel */}

      </div>{/* end body */}
    </div>
  );
}

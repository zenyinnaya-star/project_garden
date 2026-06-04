import { useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramType } from '../types';
import { parseSqlToNodes } from '../parsers/sqlParser';
import { parseJavaToNodes } from '../parsers/javaParser';
import { analyzeImageDiagram, generateDiagramFromText } from '../services/claudeApi';
import { XIcon, PaperclipIcon, SparkleIcon, FolderUploadIcon, DotIcon, SpinnerIcon, WarningIcon } from './Icons';

interface Props {
  onClose: () => void;
  onImport: (diagramType: DiagramType, nodes: Node[], edges: Edge[]) => void;
  apiKey: string;
  onNeedApiKey: () => void;
}

type Tab = 'upload' | 'describe';

const EXAMPLES: Record<DiagramType, string> = {
  class: 'A library system with Book, Member, Loan, and Author classes. Books have titles and ISBN. Members can borrow books.',
  er: 'An e-commerce database with Products, Orders, Customers, and OrderItems tables.',
  flowchart: 'User login: enter credentials → validate → if invalid show error and retry, if valid redirect to dashboard.',
  sequence: 'A user authentication flow: Browser sends login request to AuthService, which queries UserRepository and returns a JWT token.',
  activity: 'Order processing: receive order → validate payment → if payment fails notify customer, if valid pick items → ship → send confirmation.',
};

export default function ImportModal({ onClose, onImport, apiKey, onNeedApiKey }: Props) {
  const [tab, setTab] = useState<Tab>('upload');
  const [description, setDescription] = useState('');
  const [descType, setDescType] = useState<DiagramType>('class');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

      if (ext === 'sql') {
        const text = await file.text();
        const { nodes, edges } = parseSqlToNodes(text);
        if (nodes.length === 0) throw new Error('No CREATE TABLE statements found in the SQL file.');
        onImport('er', nodes, edges);
        onClose();

      } else if (ext === 'java') {
        const text = await file.text();
        const { nodes, edges } = parseJavaToNodes(text);
        if (nodes.length === 0) throw new Error('No class or interface definitions found.');
        onImport('class', nodes, edges);
        onClose();

      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        if (!apiKey) { onNeedApiKey(); setLoading(false); return; }
        const base64 = await toBase64(file);
        const mt = (file.type || 'image/png') as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
        const diagram = await analyzeImageDiagram(base64, mt, apiKey);
        onImport(diagram.diagramType, diagram.nodes, diagram.edges);
        onClose();

      } else {
        throw new Error('Unsupported file. Use .sql, .java, .png, .jpg, or .gif');
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? String(e));
    }
    setLoading(false);
  }

  async function handleDescribe() {
    if (!description.trim()) return;
    if (!apiKey) { onNeedApiKey(); return; }
    setError('');
    setLoading(true);
    try {
      const diagram = await generateDiagramFromText(description, descType, apiKey);
      onImport(diagram.diagramType, diagram.nodes, diagram.edges);
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? String(e));
    }
    setLoading(false);
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 24, width: 500, color: '#e2e8f0', fontSize: 13 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Import Diagram</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}><XIcon size={12} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 6, padding: 3, marginBottom: 18 }}>
          {(['upload', 'describe'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex: 1, background: tab === t ? '#1d4ed8' : 'transparent', border: 'none', borderRadius: 4, color: tab === t ? '#fff' : '#94a3b8', padding: '6px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {t === 'upload'
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><PaperclipIcon size={12} /> Upload File / Image</span>
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><SparkleIcon size={12} /> AI Generate</span>}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {tab === 'upload' && (
          <>
            <div
              style={{ border: `2px dashed ${dragging ? '#3b82f6' : '#334155'}`, borderRadius: 8, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(59,130,246,0.06)' : 'transparent', transition: 'all 0.15s' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <div style={{ marginBottom: 10, color: '#475569' }}><FolderUploadIcon size={32} /></div>
              <div style={{ color: '#94a3b8' }}>
                Drop a file here or <span style={{ color: '#60a5fa' }}>browse</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { ext: '.sql', label: 'SQL → Oracle ER', color: '#a78bfa' },
                  { ext: '.java', label: 'Java → Class diagram', color: '#60a5fa' },
                  { ext: 'image', label: 'PNG/JPG → AI analysis *', color: '#4ade80' },
                ].map(b => (
                  <span key={b.ext} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '3px 8px', fontSize: 11, color: b.color }}>
                    {b.label}
                  </span>
                ))}
              </div>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 10 }}>* Image analysis requires an Anthropic API key</div>
            </div>
            <input
              ref={fileRef} type="file" accept=".sql,.java,.png,.jpg,.jpeg,.gif,.webp"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
          </>
        )}

        {/* Describe tab */}
        {tab === 'describe' && (
          <>
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>Diagram type</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {(['class', 'er', 'flowchart'] as DiagramType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setDescType(t)}
                  style={{ flex: 1, background: descType === t ? '#1d4ed8' : '#0f172a', border: '1px solid #334155', borderRadius: 4, color: descType === t ? '#fff' : '#94a3b8', padding: '5px 0', fontSize: 11, cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Describe your diagram</div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={EXAMPLES[descType]}
              rows={4}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', padding: '8px 10px', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 14 }}>
              <span style={{ color: '#475569', fontSize: 11 }}>
                Uses GPT-4o mini — requires API key&nbsp;
                <button onClick={onNeedApiKey} style={{ background: 'none', border: 'none', color: apiKey ? '#4ade80' : '#f59e0b', cursor: 'pointer', fontSize: 11, padding: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><DotIcon size={7} />{apiKey ? 'key set' : 'set key'}</span>
                </button>
              </span>
            </div>

            <button
              onClick={handleDescribe}
              disabled={!description.trim() || loading}
              style={{ width: '100%', background: description.trim() && !loading ? '#1d4ed8' : '#1e3a5f', border: 'none', borderRadius: 6, color: '#fff', padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: description.trim() && !loading ? 'pointer' : 'not-allowed' }}
            >
              {loading
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><SpinnerIcon size={14} /> Generating diagram…</span>
                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><SparkleIcon size={14} /> Generate Diagram</span>}
            </button>
          </>
        )}

        {/* Loading overlay for upload */}
        {loading && tab === 'upload' && (
          <div style={{ textAlign: 'center', marginTop: 14, color: '#60a5fa', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><SpinnerIcon size={13} /> Analyzing file…</div>
        )}

        {error && (
          <div style={{ marginTop: 14, background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 6, padding: '9px 12px', color: '#fca5a5', fontSize: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WarningIcon size={13} /> {error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

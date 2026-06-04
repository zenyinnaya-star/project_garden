import { useState } from 'react';
import type { DiagramType } from '../types';

interface Props {
  diagramType: DiagramType;
  onAddNode: (nodeType: string, data: object) => void;
  onSwitchDiagram: (type: DiagramType) => void;
}

/* ── mini node previews ─────────────────────────────────────────── */
function ClassPreview() {
  return (
    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(249,115,22,0.25)', userSelect: 'none', minWidth: 115 }}>
      <div style={{ background: 'rgba(249,115,22,0.08)', padding: '5px 9px', fontWeight: 700, color: '#f97316', display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        MyClass
      </div>
      <div style={{ background: '#080e18', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 9px', color: '#71717a' }}>
        <span style={{ color: '#3f3f46' }}>- </span><span style={{ color: '#e4e4e7' }}>id</span><span style={{ color: '#3f3f46' }}>: </span><span style={{ color: '#a78bfa' }}>Long</span>
      </div>
      <div style={{ background: '#080e18', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 9px', color: '#71717a' }}>
        <span style={{ color: '#3f3f46' }}>- </span><span style={{ color: '#e4e4e7' }}>name</span><span style={{ color: '#3f3f46' }}>: </span><span style={{ color: '#a78bfa' }}>String</span>
      </div>
      <div style={{ background: '#080e18', borderTop: '1px dashed rgba(255,255,255,0.06)', padding: '4px 9px', color: '#71717a' }}>
        <span style={{ color: '#3f3f46' }}>+ </span><span style={{ color: '#fb923c' }}>getId</span><span style={{ color: '#3f3f46' }}>(): </span><span style={{ color: '#a78bfa' }}>Long</span>
      </div>
    </div>
  );
}

function FlowPreview() {
  const dot = { width: 1, height: 12, background: 'rgba(255,255,255,0.1)', margin: '0 auto' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, userSelect: 'none', minWidth: 90 }}>
      <div style={{ background: '#052e16', border: '1px solid #4ade8066', borderRadius: 20, padding: '4px 14px', fontSize: 9, fontWeight: 700, color: '#4ade80' }}>Start</div>
      <div style={dot}/>
      <div style={{ background: '#080e18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 10px', fontSize: 9, color: '#a1a1aa' }}>Process</div>
      <div style={dot}/>
      <div style={{ position: 'relative', width: 40, height: 28 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 26, height: 26, background: '#0a0800', border: '1px solid rgba(249,115,22,0.5)', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ transform: 'rotate(-45deg)', fontSize: 7, color: '#fb923c', fontWeight: 700 }}>?</span>
          </div>
        </div>
      </div>
      <div style={dot}/>
      <div style={{ background: '#3b0a0a', border: '1px solid #f8717166', borderRadius: 20, padding: '4px 14px', fontSize: 9, fontWeight: 700, color: '#f87171' }}>End</div>
    </div>
  );
}

function ErPreview() {
  return (
    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(167,139,250,0.25)', userSelect: 'none', minWidth: 115 }}>
      <div style={{ background: 'rgba(167,139,250,0.08)', padding: '5px 9px', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        Entity
      </div>
      <div style={{ background: '#080e18', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 9px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#fbbf24', fontSize: 8, fontWeight: 700 }}>PK</span>
        <span style={{ color: '#e4e4e7' }}>id</span>
        <span style={{ color: '#a78bfa', marginLeft: 'auto' }}>INT</span>
      </div>
      <div style={{ background: '#080e18', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 9px', color: '#71717a', display: 'flex' }}>
        <span style={{ color: '#e4e4e7' }}>name</span>
        <span style={{ color: '#a78bfa', marginLeft: 'auto' }}>VARCHAR2</span>
      </div>
      <div style={{ background: '#080e18', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 9px', color: '#71717a', display: 'flex' }}>
        <span style={{ color: '#e4e4e7' }}>created</span>
        <span style={{ color: '#a78bfa', marginLeft: 'auto' }}>DATE</span>
      </div>
    </div>
  );
}

/* ── floating ambient dots ──────────────────────────────────────── */
const DOTS = [
  { x: '8%',  y: '20%', size: 3,  delay: '0s',   dur: '7s',   opacity: 0.3  },
  { x: '85%', y: '15%', size: 4,  delay: '1.5s', dur: '9s',   opacity: 0.2  },
  { x: '60%', y: '70%', size: 3,  delay: '0.8s', dur: '8s',   opacity: 0.18 },
  { x: '20%', y: '75%', size: 5,  delay: '2.2s', dur: '11s',  opacity: 0.15 },
  { x: '75%', y: '45%', size: 2,  delay: '0.4s', dur: '6s',   opacity: 0.25 },
  { x: '40%', y: '12%', size: 3,  delay: '3s',   dur: '10s',  opacity: 0.17 },
  { x: '92%', y: '60%', size: 4,  delay: '1.1s', dur: '8.5s', opacity: 0.2  },
  { x: '14%', y: '48%', size: 2,  delay: '2.6s', dur: '7.5s', opacity: 0.22 },
];

/* ── sequence / activity mini previews ──────────────────────────── */
function SeqPreview() {
  const lineCol = '#4ade8055';
  const hdrStyle = (color: string): React.CSSProperties => ({
    background: '#080e18', border: `1px solid ${color}55`, borderRadius: 5,
    padding: '3px 8px', fontSize: 8.5, fontWeight: 700, color, textAlign: 'center',
    userSelect: 'none',
  });
  const stem: React.CSSProperties = { width: 1, flex: 1, backgroundImage: `repeating-linear-gradient(to bottom, ${lineCol} 0, ${lineCol} 5px, transparent 5px, transparent 10px)`, margin: '0 auto' };
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', justifyContent: 'center', userSelect: 'none' }}>
      {[{ label: ':User', color: '#4ade80' }, { label: ':System', color: '#60a5fa' }].map(({ label, color }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 54, gap: 0 }}>
          <div style={hdrStyle(color)}>{label}</div>
          <div style={{ ...stem, height: 52 }} />
        </div>
      ))}
      {/* Arrow between them */}
    </div>
  );
}

function ActivityPreview() {
  const dot: React.CSSProperties = { width: 1, height: 10, background: 'rgba(255,255,255,0.1)', margin: '0 auto' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, userSelect: 'none', minWidth: 90 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#f97316', boxShadow: '0 0 8px rgba(249,115,22,0.5)' }}/>
      <div style={dot}/>
      <div style={{ background: '#060f1f', border: '1px solid #60a5fa55', borderRadius: 20, padding: '3px 12px', fontSize: 8.5, color: '#60a5fa', fontWeight: 600 }}>Action</div>
      <div style={dot}/>
      <div style={{ position: 'relative', width: 40, height: 26 }}>
        <svg width={40} height={26} style={{ position: 'absolute' }}>
          <polygon points="20,2 38,13 20,24 2,13" fill="#0d0a00" stroke="#fbbf2488" strokeWidth={1.2}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fbbf24', fontWeight: 700 }}>?</div>
      </div>
      <div style={dot}/>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'transparent', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f87171' }}/>
      </div>
    </div>
  );
}

/* ── template card data ─────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: 'class' as DiagramType,
    label: 'Class Diagram',
    sublabel: 'Java · OOP · Interfaces',
    color: '#f97316',
    darkBg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.2)',
    hoverBorder: 'rgba(249,115,22,0.55)',
    glow: 'rgba(249,115,22,0.18)',
    nodeType: 'classNode',
    data: { label: 'MyClass', type: 'class', fields: [{ name: 'id', type: 'Long', visibility: 'private' }, { name: 'name', type: 'String', visibility: 'private' }], methods: [{ name: 'getId', returnType: 'Long', params: '', visibility: 'public' }] },
    Preview: ClassPreview,
  },
  {
    id: 'flowchart' as DiagramType,
    label: 'Flowchart',
    sublabel: 'Logic · Control flow · Java',
    color: '#4ade80',
    darkBg: 'rgba(74,222,128,0.05)',
    border: 'rgba(74,222,128,0.18)',
    hoverBorder: 'rgba(74,222,128,0.5)',
    glow: 'rgba(74,222,128,0.15)',
    nodeType: 'flowNode',
    data: { label: 'Start', type: 'start' },
    Preview: FlowPreview,
  },
  {
    id: 'er' as DiagramType,
    label: 'ER Diagram',
    sublabel: 'Oracle DDL · Tables · Keys',
    color: '#c084fc',
    darkBg: 'rgba(192,132,252,0.05)',
    border: 'rgba(192,132,252,0.18)',
    hoverBorder: 'rgba(192,132,252,0.5)',
    glow: 'rgba(192,132,252,0.15)',
    nodeType: 'erNode',
    data: { label: 'Entity', attributes: [{ name: 'id', type: 'INT', isPrimary: true }, { name: 'name', type: 'VARCHAR2' }] },
    Preview: ErPreview,
  },
  {
    id: 'sequence' as DiagramType,
    label: 'Sequence',
    sublabel: 'Interactions · Messages · Lifelines',
    color: '#4ade80',
    darkBg: 'rgba(74,222,128,0.05)',
    border: 'rgba(74,222,128,0.18)',
    hoverBorder: 'rgba(74,222,128,0.5)',
    glow: 'rgba(74,222,128,0.14)',
    nodeType: 'sequenceNode',
    data: { label: 'User', type: 'actor' },
    Preview: SeqPreview,
  },
  {
    id: 'activity' as DiagramType,
    label: 'Activity',
    sublabel: 'Workflows · Decisions · Parallel',
    color: '#60a5fa',
    darkBg: 'rgba(96,165,250,0.05)',
    border: 'rgba(96,165,250,0.18)',
    hoverBorder: 'rgba(96,165,250,0.5)',
    glow: 'rgba(96,165,250,0.14)',
    nodeType: 'activityNode',
    data: { label: 'Start', type: 'initial' },
    Preview: ActivityPreview,
  },
];

export default function EmptyCanvas({ diagramType, onAddNode, onSwitchDiagram }: Props) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [pressedCard, setPressedCard] = useState<string | null>(null);

  const handleTemplate = (tpl: typeof TEMPLATES[0]) => {
    if (diagramType !== tpl.id) onSwitchDiagram(tpl.id);
    onAddNode(tpl.nodeType, tpl.data);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* Ambient drifting dots */}
      {DOTS.map((d, i) => (
        <div key={i} style={{
          position: 'absolute', left: d.x, top: d.y,
          width: d.size, height: d.size, borderRadius: '50%',
          background: '#f97316', opacity: d.opacity,
          animation: `dotDrift ${d.dur} ease-in-out ${d.delay} infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Subtle orange radial glow behind centre */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 560, height: 320, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(249,115,22,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* ── Interactive centre ── */}
      <div style={{ pointerEvents: 'auto', textAlign: 'center', maxWidth: 700, padding: '0 24px' }}>

        {/* Icon with pulse ring */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulseRing 2.5s ease-in-out infinite',
            color: '#f97316',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: -0.3 }}>
          Begin your diagram
        </h3>
        <p style={{ margin: '0 0 28px', fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>
          Pick a template below, drag elements from the left palette,<br/>or double-click anywhere on the canvas to add a node.
        </p>

        {/* Template cards */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {TEMPLATES.map((tpl, idx) => {
            const isHovered = hoveredCard === tpl.id;
            const isActive  = diagramType === tpl.id;
            const isPressed = pressedCard === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => handleTemplate(tpl)}
                onMouseEnter={() => setHoveredCard(tpl.id)}
                onMouseLeave={() => { setHoveredCard(null); setPressedCard(null); }}
                onMouseDown={() => setPressedCard(tpl.id)}
                onMouseUp={() => setPressedCard(null)}
                style={{
                  background: isHovered ? tpl.darkBg : 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${isActive ? tpl.hoverBorder : isHovered ? tpl.hoverBorder : tpl.border}`,
                  borderRadius: 14,
                  padding: '18px 16px 16px',
                  cursor: 'pointer',
                  width: 162,
                  animation: `cardEntrance 0.5s ease ${idx * 80}ms both`,
                  transform: isPressed
                    ? 'translateY(1px) scale(0.98)'
                    : isHovered
                      ? 'translateY(-4px) scale(1.02)'
                      : 'none',
                  transition: 'transform 0.18s ease, border-color 0.18s, background 0.18s, box-shadow 0.18s',
                  boxShadow: isHovered
                    ? `0 8px 28px ${tpl.glow}, 0 0 0 1px ${tpl.hoverBorder}`
                    : isActive
                      ? `0 0 0 1px ${tpl.hoverBorder}`
                      : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Active indicator stripe */}
                {isActive && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${tpl.color},transparent)` }}/>
                )}

                {/* Mini preview */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, minHeight: 80, alignItems: 'center' }}>
                  <tpl.Preview/>
                </div>

                {/* Label */}
                <div style={{ fontSize: 12, fontWeight: 700, color: isHovered ? '#ffffff' : '#a1a1aa', marginBottom: 4, transition: 'color 0.15s' }}>
                  {tpl.label}
                </div>
                <div style={{ fontSize: 10, color: isHovered ? tpl.color : '#3f3f46', marginBottom: 12, transition: 'color 0.15s' }}>
                  {tpl.sublabel}
                </div>

                {/* Add button */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: isHovered ? tpl.color : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isHovered ? tpl.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 7, padding: '6px 0',
                  fontSize: 11, fontWeight: 700,
                  color: isHovered ? '#fff' : '#52525b',
                  transition: 'all 0.18s',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {isActive ? 'Add node' : 'Start here'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom hints */}
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
          {[
            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: 'Drag from palette' },
            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, label: 'Double-click canvas' },
            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, label: 'AI import available' },
          ].map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#3f3f46', fontSize: 11 }}>
              <span style={{ color: '#52525b' }}>{h.icon}</span>
              {h.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

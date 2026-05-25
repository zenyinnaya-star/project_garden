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
    <div style={{ fontFamily: 'monospace', fontSize: 9, borderRadius: 6, overflow: 'hidden', border: '1px solid #1e3a5f', userSelect: 'none', minWidth: 110 }}>
      <div style={{ background: '#1a3040', padding: '5px 9px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        MyClass
      </div>
      <div style={{ background: '#0d1f30', borderTop: '1px solid #1e3a5f', padding: '4px 9px', color: '#94a3b8' }}>
        <span style={{ color: '#f87171' }}>-</span> id: Long
      </div>
      <div style={{ background: '#0d1f30', borderTop: '1px solid #1e3a5f', padding: '4px 9px', color: '#94a3b8' }}>
        <span style={{ color: '#f87171' }}>-</span> name: String
      </div>
      <div style={{ background: '#0d1f30', borderTop: '1px dashed #1e3a5f', padding: '4px 9px', color: '#94a3b8' }}>
        <span style={{ color: '#4ade80' }}>+</span> getId(): Long
      </div>
    </div>
  );
}

function FlowPreview() {
  const dot = { width: 1, height: 14, background: '#334155', margin: '0 auto' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, userSelect: 'none', minWidth: 90 }}>
      <div style={{ background: '#14532d', border: '1px solid #166534', borderRadius: 20, padding: '4px 14px', fontSize: 9, fontWeight: 700, color: '#4ade80' }}>Start</div>
      <div style={dot}/>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 4, padding: '4px 10px', fontSize: 9, color: '#94a3b8' }}>Process</div>
      <div style={dot}/>
      {/* Diamond */}
      <div style={{ position: 'relative', width: 40, height: 28 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, background: '#1c1917', border: '1px solid #57534e', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ transform: 'rotate(-45deg)', fontSize: 7, color: '#a8a29e', fontWeight: 700 }}>?</span>
          </div>
        </div>
      </div>
      <div style={dot}/>
      <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: 20, padding: '4px 14px', fontSize: 9, fontWeight: 700, color: '#fca5a5' }}>End</div>
    </div>
  );
}

function ErPreview() {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 9, borderRadius: 6, overflow: 'hidden', border: '1px solid #2e1065', userSelect: 'none', minWidth: 110 }}>
      <div style={{ background: '#1e0a40', padding: '5px 9px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        Entity
      </div>
      <div style={{ background: '#0d0720', borderTop: '1px solid #2e1065', padding: '4px 9px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="2"/><path d="m21 3-6.5 6.5M16 2l6 6-1.5 1.5"/></svg>
        id: INT
      </div>
      <div style={{ background: '#0d0720', borderTop: '1px solid #2e1065', padding: '4px 9px', color: '#94a3b8' }}>name: VARCHAR2</div>
      <div style={{ background: '#0d0720', borderTop: '1px solid #2e1065', padding: '4px 9px', color: '#94a3b8' }}>created: DATE</div>
    </div>
  );
}

/* ── floating ambient dots ──────────────────────────────────────── */
const DOTS = [
  { x: '8%',  y: '20%', size: 3,  delay: '0s',   dur: '7s',  opacity: 0.25 },
  { x: '85%', y: '15%', size: 4,  delay: '1.5s', dur: '9s',  opacity: 0.2  },
  { x: '60%', y: '70%', size: 3,  delay: '0.8s', dur: '8s',  opacity: 0.18 },
  { x: '20%', y: '75%', size: 5,  delay: '2.2s', dur: '11s', opacity: 0.15 },
  { x: '75%', y: '45%', size: 2,  delay: '0.4s', dur: '6s',  opacity: 0.22 },
  { x: '40%', y: '12%', size: 3,  delay: '3s',   dur: '10s', opacity: 0.17 },
  { x: '92%', y: '60%', size: 4,  delay: '1.1s', dur: '8.5s',opacity: 0.2  },
  { x: '14%', y: '48%', size: 2,  delay: '2.6s', dur: '7.5s',opacity: 0.2  },
];

/* ── template card data ─────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: 'class' as DiagramType,
    label: 'Class Diagram',
    sublabel: 'Java · OOP · Interfaces',
    color: '#3b82f6',
    darkBg: 'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.18)',
    hoverBorder: 'rgba(59,130,246,0.55)',
    glow: 'rgba(59,130,246,0.2)',
    nodeType: 'classNode',
    data: { label: 'MyClass', type: 'class', fields: [{ name: 'id', type: 'Long', visibility: 'private' }, { name: 'name', type: 'String', visibility: 'private' }], methods: [{ name: 'getId', returnType: 'Long', params: '', visibility: 'public' }] },
    Preview: ClassPreview,
  },
  {
    id: 'flowchart' as DiagramType,
    label: 'Flowchart',
    sublabel: 'Logic · Control flow · Java',
    color: '#10b981',
    darkBg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.18)',
    hoverBorder: 'rgba(16,185,129,0.55)',
    glow: 'rgba(16,185,129,0.2)',
    nodeType: 'flowNode',
    data: { label: 'Start', type: 'start' },
    Preview: FlowPreview,
  },
  {
    id: 'er' as DiagramType,
    label: 'ER Diagram',
    sublabel: 'Oracle DDL · Tables · Keys',
    color: '#8b5cf6',
    darkBg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.18)',
    hoverBorder: 'rgba(139,92,246,0.55)',
    glow: 'rgba(139,92,246,0.2)',
    nodeType: 'erNode',
    data: { label: 'Entity', attributes: [{ name: 'id', type: 'INT', isPrimary: true }, { name: 'name', type: 'VARCHAR2' }] },
    Preview: ErPreview,
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
          background: '#6366f1', opacity: d.opacity,
          animation: `dotDrift ${d.dur} ease-in-out ${d.delay} infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Subtle radial glow behind centre */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 500, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* ── Interactive centre ── */}
      <div style={{ pointerEvents: 'auto', textAlign: 'center', maxWidth: 700, padding: '0 24px' }}>

        {/* Icon with pulse ring */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulseRing 2.5s ease-in-out infinite',
            color: '#818cf8',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#e2e8f0', letterSpacing: -0.3 }}>
          Begin your diagram
        </h3>
        <p style={{ margin: '0 0 28px', fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
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
                  background: isHovered ? tpl.darkBg : 'rgba(255,255,255,0.025)',
                  border: `1.5px solid ${isActive ? tpl.hoverBorder : isHovered ? tpl.hoverBorder : tpl.border}`,
                  borderRadius: 14,
                  padding: '18px 16px 16px',
                  cursor: 'pointer',
                  width: 160,
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
                <div style={{ fontSize: 12, fontWeight: 700, color: isHovered ? '#f1f5f9' : '#cbd5e1', marginBottom: 4, transition: 'color 0.15s' }}>
                  {tpl.label}
                </div>
                <div style={{ fontSize: 10, color: isHovered ? tpl.color : '#475569', marginBottom: 12, transition: 'color 0.15s' }}>
                  {tpl.sublabel}
                </div>

                {/* Add button */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: isHovered ? tpl.color : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isHovered ? tpl.color : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 7, padding: '6px 0',
                  fontSize: 11, fontWeight: 700,
                  color: isHovered ? '#fff' : '#64748b',
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
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#334155', fontSize: 11 }}>
              <span style={{ color: '#475569' }}>{h.icon}</span>
              {h.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

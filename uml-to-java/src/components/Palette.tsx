import type { DiagramType } from '../types';

interface PaletteProps {
  diagramType: DiagramType;
  onDragStart: (event: React.DragEvent, nodeType: string, data: object) => void;
  onAdd: (nodeType: string, data: object) => void;
  switchMode?: boolean;
}

const palettes: Record<DiagramType, { nodeType: string; label: string; color: string; data: object }[]> = {
  class: [
    {
      nodeType: 'classNode', label: 'Class', color: '#1a3040',
      data: { label: 'MyClass', type: 'class', fields: [{ name: 'id', type: 'int', visibility: 'private' }], methods: [{ name: 'getId', returnType: 'int', params: '', visibility: 'public' }] },
    },
    {
      nodeType: 'classNode', label: 'Interface', color: '#1e3a5f',
      data: { label: 'MyInterface', type: 'interface', fields: [], methods: [{ name: 'doSomething', returnType: 'void', params: '', visibility: 'public' }] },
    },
    {
      nodeType: 'classNode', label: 'Abstract', color: '#2d1b4e',
      data: { label: 'AbstractBase', type: 'abstract', fields: [{ name: 'name', type: 'String', visibility: 'protected' }], methods: [{ name: 'process', returnType: 'void', params: '', visibility: 'public', isAbstract: true }] },
    },
  ],
  flowchart: [
    { nodeType: 'flowNode', label: 'Start', color: '#166534', data: { label: 'Start', type: 'start' } },
    { nodeType: 'flowNode', label: 'Process', color: '#1e293b', data: { label: 'Process', type: 'process' } },
    { nodeType: 'flowNode', label: 'Decision', color: '#1c1917', data: { label: 'Condition?', type: 'decision' } },
    { nodeType: 'flowNode', label: 'Input / Output', color: '#172554', data: { label: 'Input/Output', type: 'io' } },
    { nodeType: 'flowNode', label: 'End', color: '#7f1d1d', data: { label: 'End', type: 'end' } },
  ],
  er: [
    {
      nodeType: 'erNode', label: 'Entity', color: '#2e1065',
      data: {
        label: 'Entity', attributes: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR' },
        ],
      },
    },
  ],
};

export default function Palette({ diagramType, onDragStart, onAdd, switchMode }: PaletteProps) {
  const items = palettes[diagramType];

  const bg        = switchMode ? '#fff'     : '#0f172a';
  const borderR   = switchMode ? '#fecaca'  : '#1e293b';
  const labelClr  = switchMode ? '#dc2626'  : '#64748b';
  const hintClr   = switchMode ? '#9ca3af'  : '#475569';
  const itemBorder = switchMode ? '#fca5a5' : '#334155';
  const itemHover  = switchMode ? '#dc2626' : '#3b82f6';
  const itemText   = switchMode ? '#1e293b' : '#e2e8f0';
  const plusClr    = switchMode ? '#dc2626' : '#475569';

  return (
    <div style={{
      width: 180,
      background: bg,
      borderRight: `1px solid ${borderR}`,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      overflowY: 'auto',
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      <div style={{ color: labelClr, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, transition: 'color 0.2s' }}>
        Elements
      </div>

      {items.map((item, i) => (
        <div
          key={i}
          draggable
          onDragStart={e => onDragStart(e, item.nodeType, item.data)}
          onClick={() => onAdd(item.nodeType, item.data)}
          style={{
            background: switchMode ? '#fff9f9' : item.color,
            border: `1px solid ${itemBorder}`,
            borderRadius: 6,
            padding: '8px 12px',
            cursor: 'pointer',
            color: itemText,
            fontSize: 12,
            fontWeight: 500,
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'border-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = itemHover;
            (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = itemBorder;
            (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
          }}
        >
          <span>{item.label}</span>
          <span style={{ color: plusClr, fontSize: 14, lineHeight: 1 }}>+</span>
        </div>
      ))}

      <div style={{ marginTop: 16, color: hintClr, fontSize: 11, lineHeight: 1.6, transition: 'color 0.2s' }}>
        Click to add · Drag to place · Double-click canvas to add
      </div>
    </div>
  );
}

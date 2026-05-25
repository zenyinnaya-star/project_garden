import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { SequenceNodeData } from '../types';
import { PersonIcon, CubeIcon, BoundaryIcon, GearIcon } from '../components/Icons';

const typeColors: Record<string, string> = {
  actor: '#4ade80',
  object: '#60a5fa',
  boundary: '#f59e0b',
  controller: '#c084fc',
};

const typeIcons: Record<string, React.ReactNode> = {
  actor: <PersonIcon size={18} />,
  object: <CubeIcon size={18} />,
  boundary: <BoundaryIcon size={18} />,
  controller: <GearIcon size={18} />,
};

export default function SequenceNode({ data, selected }: NodeProps) {
  const d = data as unknown as SequenceNodeData;
  const color = typeColors[d.type] || '#60a5fa';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <div style={{
        background: '#1e293b',
        border: `2px solid ${selected ? '#3b82f6' : color + '66'}`,
        borderRadius: 6,
        padding: '8px 16px',
        minWidth: 100,
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#e2e8f0',
        boxShadow: selected ? `0 0 0 1px #3b82f6` : `0 0 12px ${color}22`,
      }}>
        <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center', color: color }}>{typeIcons[d.type]}</div>
        <div style={{ color, fontWeight: 600, fontSize: 13 }}>{d.label}</div>
        <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{d.type}</div>
      </div>

      {/* Lifeline */}
      <div style={{
        width: 2,
        height: 60,
        background: `repeating-linear-gradient(to bottom, ${color}66 0px, ${color}66 6px, transparent 6px, transparent 12px)`,
      }} />
    </div>
  );
}

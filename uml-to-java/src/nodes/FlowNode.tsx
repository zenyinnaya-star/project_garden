import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../types';

export default function FlowNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowNodeData;
  const selBorder = '#f97316';

  if (d.type === 'start' || d.type === 'end') {
    const bg    = d.type === 'start' ? '#052e16' : '#3b0a0a';
    const color = d.type === 'start' ? '#4ade80' : '#f87171';
    const glow  = d.type === 'start' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)';
    return (
      <div style={{
        background: bg,
        border: `1.5px solid ${selected ? selBorder : color}`,
        borderRadius: 50,
        width: 80,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontWeight: 700,
        fontSize: 13,
        fontFamily: '"JetBrains Mono",monospace',
        boxShadow: selected
          ? `0 0 0 1px ${selBorder}, 0 0 16px rgba(249,115,22,0.25)`
          : `0 0 14px ${glow}`,
      }}>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
        {d.label}
      </div>
    );
  }

  if (d.type === 'decision') {
    return (
      <div style={{ position: 'relative', width: 120, height: 80 }}>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} id="yes" />
        <Handle type="source" position={Position.Right} id="no" />
        <svg width={120} height={80} style={{ position: 'absolute', top: 0, left: 0 }}>
          <polygon
            points="60,4 116,40 60,76 4,40"
            fill="#0a0800"
            stroke={selected ? selBorder : '#f97316'}
            strokeWidth={1.5}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fb923c', fontWeight: 600, fontSize: 11,
          fontFamily: '"JetBrains Mono",monospace',
          textAlign: 'center', padding: '0 14px',
        }}>
          {d.label}
        </div>
      </div>
    );
  }

  if (d.type === 'io') {
    return (
      <div style={{ position: 'relative', width: 140, height: 54 }}>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
        <svg width={140} height={54} style={{ position: 'absolute', top: 0, left: 0 }}>
          <polygon
            points="14,2 138,2 126,52 2,52"
            fill="#080e18"
            stroke={selected ? selBorder : '#60a5fa'}
            strokeWidth={1.5}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#60a5fa', fontSize: 12,
          fontFamily: '"JetBrains Mono",monospace',
        }}>
          {d.label}
        </div>
      </div>
    );
  }

  // process (default)
  return (
    <div style={{
      background: '#080e18',
      border: `1.5px solid ${selected ? selBorder : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 6,
      padding: '10px 18px',
      minWidth: 130,
      textAlign: 'center',
      fontFamily: '"JetBrains Mono",monospace',
      fontSize: 12,
      color: '#e4e4e7',
      boxShadow: selected
        ? '0 0 0 1px #f97316, 0 0 16px rgba(249,115,22,0.2)'
        : '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      {d.label}
    </div>
  );
}

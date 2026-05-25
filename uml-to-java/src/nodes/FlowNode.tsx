import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../types';

export default function FlowNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowNodeData;
  const border = selected ? '#3b82f6' : '#334155';

  if (d.type === 'start' || d.type === 'end') {
    const bg = d.type === 'start' ? '#166534' : '#7f1d1d';
    const color = d.type === 'start' ? '#4ade80' : '#f87171';
    return (
      <div style={{
        background: bg,
        border: `2px solid ${selected ? '#3b82f6' : color}`,
        borderRadius: 50,
        width: 80,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontWeight: 700,
        fontSize: 13,
        fontFamily: 'monospace',
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
            fill="#1c1917"
            stroke={selected ? '#3b82f6' : '#f59e0b'}
            strokeWidth={2}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fbbf24', fontWeight: 600, fontSize: 11, fontFamily: 'monospace',
          textAlign: 'center', padding: '0 12px',
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
            fill="#1e293b"
            stroke={selected ? '#3b82f6' : '#7dd3fc'}
            strokeWidth={2}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7dd3fc', fontSize: 12, fontFamily: 'monospace',
        }}>
          {d.label}
        </div>
      </div>
    );
  }

  // process
  return (
    <div style={{
      background: '#1e293b',
      border: `2px solid ${border}`,
      borderRadius: 4,
      padding: '10px 18px',
      minWidth: 130,
      textAlign: 'center',
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#e2e8f0',
    }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      {d.label}
    </div>
  );
}

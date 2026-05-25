import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ErNodeData } from '../types';

export default function ErNode({ data, selected }: NodeProps) {
  const d = data as unknown as ErNodeData;

  return (
    <div style={{
      background: '#1e293b',
      border: `2px solid ${selected ? '#3b82f6' : '#a78bfa'}`,
      borderRadius: 6,
      minWidth: 180,
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#e2e8f0',
      boxShadow: selected ? '0 0 0 1px #3b82f6' : '0 0 12px #a78bfa22',
    }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <div style={{
        background: '#2e1065',
        padding: '6px 10px',
        borderBottom: '1px solid #4c1d95',
        textAlign: 'center',
        borderRadius: '4px 4px 0 0',
      }}>
        <div style={{ fontWeight: 700, color: '#c4b5fd', fontSize: 13 }}>{d.label}</div>
      </div>

      <div style={{ padding: '4px 0' }}>
        {d.attributes.map((attr, i) => (
          <div key={i} style={{
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: i < d.attributes.length - 1 ? '1px solid #1e1b4b' : 'none',
          }}>
            {attr.isPrimary && (
              <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700 }}>PK</span>
            )}
            {attr.isForeign && (
              <span style={{ color: '#6ee7b7', fontSize: 10, fontWeight: 700 }}>FK</span>
            )}
            {!attr.isPrimary && !attr.isForeign && (
              <span style={{ color: '#475569', fontSize: 10 }}>  </span>
            )}
            <span style={{ color: '#e2e8f0' }}>{attr.name}</span>
            <span style={{ color: '#64748b', marginLeft: 'auto' }}>{attr.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

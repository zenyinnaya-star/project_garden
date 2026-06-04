import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ErNodeData } from '../types';

export default function ErNode({ data, selected }: NodeProps) {
  const d = data as unknown as ErNodeData;

  return (
    <div style={{
      background: '#080e18',
      border: `1.5px solid ${selected ? '#f97316' : 'rgba(249,115,22,0.25)'}`,
      borderRadius: 8,
      minWidth: 188,
      fontFamily: '"JetBrains Mono",monospace',
      fontSize: 12,
      color: '#e4e4e7',
      boxShadow: selected
        ? '0 0 0 1px #f97316, 0 0 20px rgba(249,115,22,0.25)'
        : '0 0 18px rgba(249,115,22,0.08), 0 4px 24px rgba(0,0,0,0.6)',
    }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      {/* Header */}
      <div style={{
        background: 'rgba(249,115,22,0.08)',
        padding: '7px 11px',
        borderBottom: '1px solid rgba(249,115,22,0.2)',
        textAlign: 'center',
        borderRadius: '6px 6px 0 0',
      }}>
        <div style={{ fontWeight: 700, color: '#f97316', fontSize: 13, letterSpacing: 0.3 }}>
          {d.label}
        </div>
      </div>

      {/* Attributes */}
      <div style={{ padding: '4px 0' }}>
        {d.attributes.map((attr, i) => (
          <div key={i} style={{
            padding: '3px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: i < d.attributes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            {attr.isPrimary && (
              <span style={{ color: '#fbbf24', fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>PK</span>
            )}
            {attr.isForeign && (
              <span style={{ color: '#6ee7b7', fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>FK</span>
            )}
            {!attr.isPrimary && !attr.isForeign && (
              <span style={{ width: 16 }} />
            )}
            <span style={{ color: '#e4e4e7' }}>{attr.name}</span>
            <span style={{ color: '#a78bfa', marginLeft: 'auto' }}>{attr.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

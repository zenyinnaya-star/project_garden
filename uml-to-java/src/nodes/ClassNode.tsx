import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ClassNodeData } from '../types';

const visIcon = { public: '+', private: '-', protected: '#' };

export default function ClassNode({ data, selected }: NodeProps) {
  const d = data as unknown as ClassNodeData;
  const isInterface = d.type === 'interface';
  const isAbstract = d.type === 'abstract';

  return (
    <div
      style={{
        background: '#1e293b',
        border: `2px solid ${selected ? '#3b82f6' : '#334155'}`,
        borderRadius: 6,
        minWidth: 180,
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#e2e8f0',
        boxShadow: selected ? '0 0 0 1px #3b82f6' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      {/* Header */}
      <div style={{
        background: isInterface ? '#1e3a5f' : isAbstract ? '#2d1b4e' : '#1a3040',
        padding: '6px 10px',
        borderBottom: '1px solid #334155',
        textAlign: 'center',
        borderRadius: '4px 4px 0 0',
      }}>
        {(isInterface || isAbstract) && (
          <div style={{ color: '#94a3b8', fontSize: 10, fontStyle: 'italic' }}>
            «{isInterface ? 'interface' : 'abstract'}»
          </div>
        )}
        <div style={{ fontWeight: 700, color: isInterface ? '#60a5fa' : isAbstract ? '#c084fc' : '#f1f5f9', fontSize: 13 }}>
          {d.label}
        </div>
      </div>

      {/* Fields */}
      {d.fields.length > 0 && (
        <div style={{ padding: '4px 10px', borderBottom: '1px solid #334155' }}>
          {d.fields.map((f, i) => (
            <div key={i} style={{ padding: '2px 0', color: '#94a3b8' }}>
              <span style={{ color: '#64748b' }}>{visIcon[f.visibility]} </span>
              <span style={{ color: '#e2e8f0' }}>{f.name}</span>
              <span style={{ color: '#64748b' }}>: </span>
              <span style={{ color: '#7dd3fc' }}>{f.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Methods */}
      {d.methods.length > 0 && (
        <div style={{ padding: '4px 10px' }}>
          {d.methods.map((m, i) => (
            <div key={i} style={{ padding: '2px 0', color: '#94a3b8', fontStyle: m.isAbstract ? 'italic' : 'normal' }}>
              <span style={{ color: '#64748b' }}>{visIcon[m.visibility]} </span>
              <span style={{ color: '#fbbf24' }}>{m.name}</span>
              <span style={{ color: '#64748b' }}>({m.params}): </span>
              <span style={{ color: '#7dd3fc' }}>{m.returnType}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

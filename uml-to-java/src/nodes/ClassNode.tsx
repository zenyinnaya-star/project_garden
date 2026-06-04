import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ClassNodeData } from '../types';

const visIcon = { public: '+', private: '-', protected: '#' };

export default function ClassNode({ data, selected }: NodeProps) {
  const d = data as unknown as ClassNodeData;
  const isInterface = d.type === 'interface';
  const isAbstract  = d.type === 'abstract';

  const headerBg =
    isInterface ? 'rgba(59,130,246,0.07)'
    : isAbstract ? 'rgba(168,85,247,0.07)'
    : 'rgba(249,115,22,0.07)';

  const headerBorder =
    isInterface ? 'rgba(59,130,246,0.18)'
    : isAbstract ? 'rgba(168,85,247,0.18)'
    : 'rgba(249,115,22,0.18)';

  const labelColor =
    isInterface ? '#60a5fa'
    : isAbstract ? '#c084fc'
    : '#f97316';

  return (
    <div style={{
      background: '#080e18',
      border: `1.5px solid ${selected ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 8,
      minWidth: 188,
      fontFamily: '"JetBrains Mono",monospace',
      fontSize: 12,
      color: '#e4e4e7',
      boxShadow: selected
        ? '0 0 0 1px #f97316, 0 0 20px rgba(249,115,22,0.25)'
        : '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      {/* Header */}
      <div style={{
        background: headerBg,
        padding: '7px 11px',
        borderBottom: `1px solid ${headerBorder}`,
        textAlign: 'center',
        borderRadius: '6px 6px 0 0',
      }}>
        {(isInterface || isAbstract) && (
          <div style={{ color: labelColor, fontSize: 9, fontStyle: 'italic', opacity: 0.7, marginBottom: 1 }}>
            «{isInterface ? 'interface' : 'abstract'}»
          </div>
        )}
        <div style={{ fontWeight: 700, color: labelColor, fontSize: 13, letterSpacing: 0.3 }}>
          {d.label}
        </div>
      </div>

      {/* Fields */}
      {d.fields.length > 0 && (
        <div style={{ padding: '5px 11px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {d.fields.map((f, i) => (
            <div key={i} style={{ padding: '2px 0', lineHeight: 1.5 }}>
              <span style={{ color: '#3f3f46' }}>{visIcon[f.visibility]} </span>
              <span style={{ color: '#e4e4e7' }}>{f.name}</span>
              <span style={{ color: '#3f3f46' }}>: </span>
              <span style={{ color: '#a78bfa' }}>{f.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Methods */}
      {d.methods.length > 0 && (
        <div style={{ padding: '5px 11px' }}>
          {d.methods.map((m, i) => (
            <div key={i} style={{ padding: '2px 0', lineHeight: 1.5, fontStyle: m.isAbstract ? 'italic' : 'normal' }}>
              <span style={{ color: '#3f3f46' }}>{visIcon[m.visibility]} </span>
              <span style={{ color: '#fb923c' }}>{m.name}</span>
              <span style={{ color: '#3f3f46' }}>({m.params}): </span>
              <span style={{ color: '#a78bfa' }}>{m.returnType}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

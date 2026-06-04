import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ActivityNodeData } from '../types';

const SEL = '#f97316';

/* ── Shared handle style ─────────────────────────────────────────── */
function hStyle(color: string): React.CSSProperties {
  return { background: color, border: '1.5px solid #000', width: 9, height: 9 };
}

export default function ActivityNode({ data, selected }: NodeProps) {
  const d = data as unknown as ActivityNodeData;
  const type = d.type ?? 'action';

  /* ── Initial node ──────────────────────────────────────────────── */
  if (type === 'initial') {
    return (
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: '#f97316',
        border: `2.5px solid ${selected ? SEL : '#ea580c'}`,
        boxShadow: selected
          ? `0 0 0 2px ${SEL}55, 0 0 18px rgba(249,115,22,0.45)`
          : '0 0 12px rgba(249,115,22,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Handle type="source" position={Position.Bottom} style={hStyle('#f97316')} />
      </div>
    );
  }

  /* ── Final node ────────────────────────────────────────────────── */
  if (type === 'final') {
    return (
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'transparent',
        border: `2.5px solid ${selected ? SEL : '#f87171'}`,
        boxShadow: selected
          ? `0 0 0 2px ${SEL}55, 0 0 16px rgba(248,113,113,0.35)`
          : '0 0 10px rgba(248,113,113,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: selected ? SEL : '#f87171',
          boxShadow: `0 0 8px ${selected ? SEL : '#f87171'}66`,
        }} />
        <Handle type="target" position={Position.Top} style={hStyle('#f87171')} />
      </div>
    );
  }

  /* ── Fork / Join ──────────────────────────────────────────────── */
  if (type === 'fork' || type === 'join') {
    const color = '#a78bfa';
    return (
      <div style={{
        width: 220, height: 12, borderRadius: 3,
        background: selected ? color : '#7c3aed',
        border: `1px solid ${selected ? SEL : color}`,
        boxShadow: selected
          ? `0 0 0 1px ${SEL}66, 0 0 14px ${color}55`
          : `0 0 10px ${color}33`,
        position: 'relative',
      }}>
        {type === 'fork' ? (
          <>
            <Handle type="target" position={Position.Top}  id="in"   style={{ ...hStyle(color), left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="b0"  style={{ ...hStyle(color), left: '25%' }} />
            <Handle type="source" position={Position.Bottom} id="b1"  style={{ ...hStyle(color), left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="b2"  style={{ ...hStyle(color), left: '75%' }} />
          </>
        ) : (
          <>
            <Handle type="target" position={Position.Top}  id="t0"   style={{ ...hStyle(color), left: '25%' }} />
            <Handle type="target" position={Position.Top}  id="t1"   style={{ ...hStyle(color), left: '50%' }} />
            <Handle type="target" position={Position.Top}  id="t2"   style={{ ...hStyle(color), left: '75%' }} />
            <Handle type="source" position={Position.Bottom} id="out" style={{ ...hStyle(color), left: '50%' }} />
          </>
        )}
        {/* Label inside bar */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 800, color: '#fff', letterSpacing: 0.8,
          textTransform: 'uppercase', userSelect: 'none',
        }}>
          {type.toUpperCase()}
        </div>
      </div>
    );
  }

  /* ── Decision / Merge diamond ──────────────────────────────────── */
  if (type === 'decision' || type === 'merge') {
    const color = type === 'decision' ? '#fbbf24' : '#4ade80';
    const W = 110, H = 72;
    return (
      <div style={{ position: 'relative', width: W, height: H }}>
        <Handle type="target"  position={Position.Top}    style={hStyle(color)} />
        <Handle type="source"  position={Position.Bottom} id="yes" style={hStyle(color)} />
        <Handle type="source"  position={Position.Right}  id="no"  style={hStyle(color)} />
        <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
          <polygon
            points={`${W/2},4 ${W-4},${H/2} ${W/2},${H-4} 4,${H/2}`}
            fill={type === 'decision' ? '#0d0a00' : '#001a0a'}
            stroke={selected ? SEL : color}
            strokeWidth={1.5}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontWeight: 600, fontSize: 10,
          fontFamily: '"JetBrains Mono",monospace',
          textAlign: 'center', padding: '0 16px',
          userSelect: 'none',
        }}>
          {d.label || (type === 'decision' ? 'Condition?' : 'Merge')}
        </div>
      </div>
    );
  }

  /* ── Action (default rounded rect) ────────────────────────────── */
  const color = '#60a5fa';
  return (
    <div style={{
      background: '#060f1f',
      border: `1.5px solid ${selected ? SEL : color + '66'}`,
      borderRadius: 24,
      padding: '10px 20px',
      minWidth: 150,
      maxWidth: 220,
      textAlign: 'center',
      fontFamily: '"JetBrains Mono",monospace',
      fontSize: 12,
      fontWeight: 600,
      color: selected ? '#e4e4e7' : color,
      boxShadow: selected
        ? `0 0 0 1px ${SEL}66, 0 0 16px rgba(249,115,22,0.2)`
        : `0 4px 20px rgba(0,0,0,0.5), 0 0 8px ${color}14`,
      userSelect: 'none',
    }}>
      <Handle type="target" position={Position.Top}    style={hStyle(color)} />
      <Handle type="source" position={Position.Bottom} style={hStyle(color)} />
      {d.label || 'Action'}
    </div>
  );
}

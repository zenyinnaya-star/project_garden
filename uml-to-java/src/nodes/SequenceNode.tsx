import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { SequenceNodeData } from '../types';
import { PersonIcon, CubeIcon, BoundaryIcon, GearIcon } from '../components/Icons';

/* ── role meta ────────────────────────────────────────────────────── */
const ROLE_META: Record<string, { color: string; badge: string }> = {
  actor:      { color: '#4ade80', badge: '«actor»' },
  object:     { color: '#60a5fa', badge: '«object»' },
  boundary:   { color: '#f59e0b', badge: '«boundary»' },
  controller: { color: '#c084fc', badge: '«control»' },
};

function RoleIcon({ type, color }: { type: string; color: string }) {
  const s = { color, flexShrink: 0 } as React.CSSProperties;
  if (type === 'actor')      return <PersonIcon   size={15} style={s} />;
  if (type === 'boundary')   return <BoundaryIcon size={15} style={s} />;
  if (type === 'controller') return <GearIcon     size={15} style={s} />;
  return <CubeIcon size={15} style={s} />;
}

/* ── dimensions ────────────────────────────────────────────────────── */
const W        = 132;
const H        = 390;
const HEADER_H = 68;
/* Evenly-spaced handle rows in the stem zone */
const HANDLE_ROWS = 6;

function stemHandlePx(i: number) {
  const stemH = H - HEADER_H - 12;
  return HEADER_H + 10 + (stemH * (i + 0.5)) / HANDLE_ROWS;
}

const hBase: React.CSSProperties = {
  width: 10, height: 10, borderRadius: 3,
  border: '1.5px solid #000',
  opacity: 0.8,
  cursor: 'crosshair',
  zIndex: 10,
};

export default function SequenceNode({ data, selected }: NodeProps) {
  const d     = data as unknown as SequenceNodeData;
  const meta  = ROLE_META[d.type] ?? ROLE_META.object;
  const color = meta.color;

  return (
    <div style={{ width: W, height: H, position: 'relative', userSelect: 'none' }}>

      {/* ── Header box ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H,
        background: '#080e18',
        border: `1.5px solid ${selected ? color : color + '55'}`,
        borderRadius: 8,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        boxShadow: selected
          ? `0 0 0 1px ${color}66, 0 0 18px ${color}33`
          : `0 0 10px ${color}14`,
        zIndex: 2,
      }}>
        <RoleIcon type={d.type} color={color} />
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7', maxWidth: W - 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.label || 'Participant'}
        </div>
        <div style={{ fontSize: 8.5, color, fontWeight: 700, letterSpacing: 0.4 }}>
          {meta.badge}
        </div>
      </div>

      {/* ── Dashed lifeline stem ── */}
      <div style={{
        position: 'absolute',
        top: HEADER_H + 2,
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 1.5,
        backgroundImage: `repeating-linear-gradient(to bottom, ${color}55 0px, ${color}55 6px, transparent 6px, transparent 13px)`,
        zIndex: 1,
      }} />

      {/* ── Bottom cap ── */}
      <div style={{
        position: 'absolute', bottom: 4, left: '50%',
        transform: 'translateX(-50%)',
        width: 10, height: 10, borderRadius: '50%',
        background: color + '44', border: `1.5px solid ${color}88`,
        zIndex: 2,
      }} />

      {/* ── Per-row handles (left=target, right=source) ── */}
      {Array.from({ length: HANDLE_ROWS }, (_, i) => {
        const top = stemHandlePx(i);
        return (
          <span key={i}>
            <Handle
              type="source"
              position={Position.Right}
              id={`r-${i}`}
              style={{ ...hBase, top, right: -6, background: color }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id={`l-${i}`}
              style={{ ...hBase, top, left: -6, background: color }}
            />
          </span>
        );
      })}

      {/* ── Top/bottom handles for vertical flow ── */}
      <Handle type="target" position={Position.Top}    id="top"
        style={{ background: color, border: '1.5px solid #000', width: 9, height: 9 }} />
      <Handle type="source" position={Position.Bottom} id="bottom"
        style={{ background: color, border: '1.5px solid #000', width: 9, height: 9 }} />
    </div>
  );
}

/**
 * Converts an array of nodes + edges (from any diagram type) into a
 * standalone SVG string that can be previewed inline or downloaded.
 */
import type { Node, Edge } from '@xyflow/react';
import type { DiagramType } from '../types';

const DARK_BG    = '#05090f';
const BORDER     = 'rgba(255,255,255,0.12)';
const TEXT_MAIN  = '#e2e8f0';
const TEXT_MUTED = '#64748b';
const EDGE_CLR   = '#3f3f46';
const ACCENT     = '#dc2626'; // red for code import theme

/* ── Geometry helpers ────────────────────────────────────────────────────── */
function bounds(nodes: Node[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    const w = nodeWidth(n);
    const h = nodeHeight(n);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  });
  return { minX, minY, maxX, maxY };
}

function nodeWidth(n: Node): number {
  switch (n.type) {
    case 'classNode':    return 200;
    case 'erNode':       return 200;
    case 'sequenceNode': return 100;
    case 'flowNode':     return 160;
    case 'activityNode': return 160;
    default: return 140;
  }
}

function nodeHeight(n: Node): number {
  if (n.type === 'classNode') {
    const fields  = (n.data.fields  as unknown[])?.length ?? 0;
    const methods = (n.data.methods as unknown[])?.length ?? 0;
    return 34 + fields * 18 + methods * 18 + 10;
  }
  if (n.type === 'erNode') {
    const attrs = (n.data.attributes as unknown[])?.length ?? 0;
    return 34 + attrs * 18 + 10;
  }
  return 46;
}

function nodeCenterX(n: Node): number { return n.position.x + nodeWidth(n) / 2; }
function nodeCenterY(n: Node): number { return n.position.y + nodeHeight(n) / 2; }

function escape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Node renderers ──────────────────────────────────────────────────────── */
function renderClassNode(n: Node): string {
  const x = n.position.x, y = n.position.y, w = nodeWidth(n);
  const label   = escape(n.data.label as string);
  const kind    = (n.data.type as string) ?? 'class';
  const fields  = (n.data.fields  as { name: string; type: string; visibility: string }[]) ?? [];
  const methods = (n.data.methods as { name: string; returnType: string; params: string; visibility: string }[]) ?? [];

  const headerH = 34;
  const fieldsH = fields.length * 18;
  const methodsH = methods.length * 18;
  const totalH = headerH + fieldsH + methodsH + 14;

  const accentClr = kind === 'interface' ? '#60a5fa' : kind === 'abstract' ? '#c084fc' : ACCENT;

  let svg = `
  <rect x="${x}" y="${y}" width="${w}" height="${totalH}" rx="8" ry="8"
        fill="#0a1120" stroke="${accentClr}55" stroke-width="1"/>
  <rect x="${x}" y="${y}" width="${w}" height="${headerH}" rx="8" ry="8"
        fill="${accentClr}22"/>
  <rect x="${x}" y="${y + 8}" width="${w}" height="${headerH - 8}"
        fill="${accentClr}22"/>
  <text x="${x + w / 2}" y="${y + 14}" text-anchor="middle"
        font-size="9" fill="${accentClr}" font-family="monospace" font-weight="700">
    «${kind}»
  </text>
  <text x="${x + w / 2}" y="${y + 26}" text-anchor="middle"
        font-size="11" fill="${TEXT_MAIN}" font-family="monospace" font-weight="700">
    ${label}
  </text>`;

  if (fields.length > 0) {
    svg += `<line x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" stroke="${BORDER}" stroke-width="1"/>`;
    fields.forEach((f, i) => {
      const visIcon = f.visibility === 'private' ? '−' : f.visibility === 'protected' ? '#' : '+';
      svg += `<text x="${x + 10}" y="${y + headerH + 14 + i * 18}"
                    font-size="10" fill="${TEXT_MUTED}" font-family="monospace">
        ${escape(visIcon)} ${escape(f.name)}: ${escape(f.type)}
      </text>`;
    });
  }

  if (methods.length > 0) {
    const mY = y + headerH + fieldsH;
    svg += `<line x1="${x}" y1="${mY}" x2="${x + w}" y2="${mY}" stroke="${BORDER}" stroke-width="1"/>`;
    methods.forEach((m, i) => {
      const visIcon = m.visibility === 'private' ? '−' : m.visibility === 'protected' ? '#' : '+';
      svg += `<text x="${x + 10}" y="${mY + 14 + i * 18}"
                    font-size="10" fill="#94a3b8" font-family="monospace">
        ${escape(visIcon)} ${escape(m.name)}()
      </text>`;
    });
  }

  return svg;
}

function renderErNode(n: Node): string {
  const x = n.position.x, y = n.position.y, w = nodeWidth(n);
  const label = escape(n.data.label as string);
  const attrs = (n.data.attributes as { name: string; type: string; isPrimary?: boolean }[]) ?? [];
  const headerH = 34;
  const totalH = headerH + attrs.length * 18 + 14;

  let svg = `
  <rect x="${x}" y="${y}" width="${w}" height="${totalH}" rx="6" ry="6"
        fill="#0a1120" stroke="#a78bfa55" stroke-width="1"/>
  <rect x="${x}" y="${y}" width="${w}" height="${headerH}" rx="6" ry="6" fill="#a78bfa22"/>
  <rect x="${x}" y="${y + 8}" width="${w}" height="${headerH - 8}" fill="#a78bfa22"/>
  <text x="${x + w / 2}" y="${y + 14}" text-anchor="middle"
        font-size="9" fill="#a78bfa" font-family="monospace" font-weight="700">«table»</text>
  <text x="${x + w / 2}" y="${y + 26}" text-anchor="middle"
        font-size="11" fill="${TEXT_MAIN}" font-family="monospace" font-weight="700">
    ${label}
  </text>`;

  attrs.forEach((a, i) => {
    const pk = a.isPrimary ? ' 🔑' : '';
    svg += `<text x="${x + 10}" y="${y + headerH + 14 + i * 18}"
                  font-size="10" fill="${a.isPrimary ? '#fbbf24' : TEXT_MUTED}" font-family="monospace">
      ${escape(a.name)}: ${escape(a.type)}${pk}
    </text>`;
  });
  return svg;
}

function renderSequenceNode(n: Node): string {
  const x = n.position.x, y = n.position.y;
  const label = escape(n.data.label as string);
  const boxW = 100, boxH = 32;
  return `
  <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="5"
        fill="#0a1120" stroke="${ACCENT}55" stroke-width="1.5"/>
  <text x="${x + boxW / 2}" y="${y + boxH / 2 + 4}" text-anchor="middle"
        font-size="11" fill="${TEXT_MAIN}" font-family="monospace" font-weight="700">
    ${label}
  </text>
  <line x1="${x + boxW / 2}" y1="${y + boxH}" x2="${x + boxW / 2}" y2="${y + boxH + 120}"
        stroke="${BORDER}" stroke-width="1" stroke-dasharray="4,4"/>`;
}

function renderFlowNode(n: Node): string {
  const x = n.position.x, y = n.position.y;
  const label = escape(n.data.label as string);
  const kind = n.data.type as string;
  const w = nodeWidth(n), h = 46;

  if (kind === 'start' || kind === 'end') {
    return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"
          fill="${kind === 'start' ? '#16a34a' : ACCENT}44"
          stroke="${kind === 'start' ? '#4ade80' : '#f87171'}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle"
          font-size="11" fill="${kind === 'start' ? '#4ade80' : '#f87171'}" font-family="monospace">
      ${label}
    </text>`;
  }
  if (kind === 'decision') {
    const cx = x + w / 2, cy = y + h / 2;
    return `
    <polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}"
             fill="#fbbf2415" stroke="#fbbf24" stroke-width="1.5"/>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle"
          font-size="10" fill="#fbbf24" font-family="monospace">
      ${label.length > 22 ? label.slice(0, 22) + '…' : label}
    </text>`;
  }
  if (kind === 'io') {
    return `
    <parallelogram>
    <rect x="${x + 8}" y="${y}" width="${w - 16}" height="${h}" rx="4"
          fill="#60a5fa12" stroke="#60a5fa" stroke-width="1" stroke-dasharray="5,3"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle"
          font-size="10" fill="#60a5fa" font-family="monospace">
      ${label.length > 24 ? label.slice(0, 24) + '…' : label}
    </text>
    </parallelogram>`;
  }
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"
        fill="#0a1120" stroke="${BORDER}" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle"
        font-size="10" fill="${TEXT_MAIN}" font-family="monospace">
    ${label.length > 24 ? label.slice(0, 24) + '…' : label}
  </text>`;
}

function renderActivityNode(n: Node): string {
  const x = n.position.x, y = n.position.y;
  const label = escape(n.data.label as string);
  const kind = n.data.type as string;
  const w = nodeWidth(n), h = 44;

  if (kind === 'initial') {
    return `
    <circle cx="${x + w / 2}" cy="${y + 22}" r="16" fill="#16a34a" stroke="none"/>
    <circle cx="${x + w / 2}" cy="${y + 22}" r="11" fill="#4ade80" stroke="none"/>`;
  }
  if (kind === 'final') {
    return `
    <circle cx="${x + w / 2}" cy="${y + 22}" r="16" fill="${ACCENT}22" stroke="${ACCENT}" stroke-width="2"/>
    <circle cx="${x + w / 2}" cy="${y + 22}" r="9"  fill="${ACCENT}"/>`;
  }
  if (kind === 'decision' || kind === 'merge') {
    const cx = x + w / 2, cy = y + h / 2;
    return `
    <polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}"
             fill="#fbbf2415" stroke="#fbbf24" stroke-width="1.5"/>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle"
          font-size="10" fill="#fbbf24" font-family="monospace">
      ${label.length > 20 ? label.slice(0, 20) + '…' : label}
    </text>`;
  }
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22"
        fill="#0a1120" stroke="${BORDER}" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle"
        font-size="10" fill="${TEXT_MAIN}" font-family="monospace">
    ${label.length > 24 ? label.slice(0, 24) + '…' : label}
  </text>`;
}

/* ── Edge renderer ───────────────────────────────────────────────────────── */
function renderEdges(edges: Edge[], nodeMap: Record<string, Node>): string {
  return edges.map(e => {
    const src = nodeMap[e.source];
    const tgt = nodeMap[e.target];
    if (!src || !tgt || e.source === e.target) return '';

    const x1 = nodeCenterX(src), y1 = nodeCenterY(src) + nodeHeight(src) / 2;
    const x2 = nodeCenterX(tgt), y2 = nodeCenterY(tgt) - nodeHeight(tgt) / 2;
    const clr = (e.style?.stroke as string) ?? EDGE_CLR;
    const lbl = escape(String(e.label ?? e.data?.label ?? ''));
    const dash = (e.style?.strokeDasharray as string) ? `stroke-dasharray="${e.style.strokeDasharray}"` : '';

    return `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
          stroke="${clr}" stroke-width="1.5" ${dash}
          marker-end="url(#arrow)"/>
    ${lbl ? `<text x="${(x1 + x2) / 2 + 4}" y="${(y1 + y2) / 2}"
                   font-size="9" fill="${clr}" font-family="monospace">${lbl}</text>` : ''}`;
  }).join('');
}

/* ── Public API ──────────────────────────────────────────────────────────── */
export function generateDiagramSVG(
  nodes: Node[],
  edges: Edge[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  diagramType: DiagramType,
): string {
  if (nodes.length === 0) return '';

  const PAD = 40;
  const { minX, minY, maxX, maxY } = bounds(nodes);
  const vw = maxX - minX + PAD * 2;
  const vh = maxY - minY + PAD * 2;

  // Shift all nodes so the diagram starts at (PAD, PAD)
  const shifted = nodes.map(n => ({
    ...n,
    position: {
      x: n.position.x - minX + PAD,
      y: n.position.y - minY + PAD,
    },
  }));
  const nodeMap: Record<string, Node> = {};
  shifted.forEach(n => (nodeMap[n.id] = n));

  const nodesSvg = shifted.map(n => {
    switch (n.type) {
      case 'classNode':    return renderClassNode(n);
      case 'erNode':       return renderErNode(n);
      case 'sequenceNode': return renderSequenceNode(n);
      case 'flowNode':     return renderFlowNode(n);
      case 'activityNode': return renderActivityNode(n);
      default:             return '';
    }
  }).join('');

  const edgesSvg = renderEdges(edges, nodeMap);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="${EDGE_CLR}"/>
    </marker>
  </defs>
  <rect width="${vw}" height="${vh}" fill="${DARK_BG}"/>
  <!-- Edges -->
  ${edgesSvg}
  <!-- Nodes -->
  ${nodesSvg}
</svg>`;
}

export function downloadSVG(svg: string, filename = 'diagram.svg') {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function downloadPNG(svg: string, filename = 'diagram.png') {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth  * 2; // 2× for retina
    canvas.height = img.naturalHeight * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(b => {
      if (!b) return;
      const purl = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = purl; a.download = filename; a.click();
      URL.revokeObjectURL(purl);
    }, 'image/png');
  };
  img.src = url;
}

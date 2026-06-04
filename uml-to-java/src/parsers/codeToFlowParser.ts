/**
 * Converts the body of the most prominent method in a code snippet into a
 * Flowchart or Activity diagram.
 *
 * Heuristic:
 *   1. Extract the first public/main method body.
 *   2. Walk its statements, turning control-flow keywords into diagram nodes:
 *        if / else if / else → decision nodes
 *        for / while / do    → loop back edges
 *        return / throw      → terminal nodes
 *        other statements    → process nodes (up to 8 to keep it readable)
 *   3. Wire them sequentially with appropriate edges.
 */
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

type FlowNodeType    = 'start' | 'end' | 'process' | 'decision' | 'io';
type ActivityNodeType = 'initial' | 'final' | 'action' | 'decision' | 'fork' | 'join' | 'merge';

let _fid = 1;
const uid = () => `flow_${_fid++}`;

interface Stmt {
  kind: 'process' | 'decision' | 'return' | 'loop' | 'io';
  label: string;
}

/* ── Extract statements from a method body ───────────────────────────────── */
function extractStatements(body: string): Stmt[] {
  const stmts: Stmt[] = [];
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (stmts.length >= 10) break;

    // Skip braces, annotations, access modifiers
    if (/^[{}]$/.test(line) || line.startsWith('@') || line.startsWith('//') || line.startsWith('*')) continue;

    if (/^if\s*\(/.test(line)) {
      const cond = line.match(/if\s*\(([^)]*)\)/)?.[1] ?? 'condition';
      stmts.push({ kind: 'decision', label: cond.length > 40 ? cond.slice(0, 40) + '…' : cond });
    } else if (/^else\s+if\s*\(/.test(line)) {
      const cond = line.match(/else\s+if\s*\(([^)]*)\)/)?.[1] ?? 'else condition';
      stmts.push({ kind: 'decision', label: cond.length > 40 ? cond.slice(0, 40) + '…' : cond });
    } else if (/^for\s*\(|^while\s*\(|^do\s*\{/.test(line)) {
      const cond = line.match(/(?:for|while)\s*\(([^)]*)\)/)?.[1] ?? 'loop condition';
      stmts.push({ kind: 'loop', label: cond.length > 40 ? cond.slice(0, 40) + '…' : cond });
    } else if (/^return\s/.test(line)) {
      const val = line.replace(/^return\s+/, '').replace(/;$/, '');
      stmts.push({ kind: 'return', label: val.length > 40 ? val.slice(0, 40) + '…' : val });
    } else if (/^(System\.out|console\.log|print|printf|logger\.|log\.)/.test(line)) {
      const msg = line.replace(/^[^"]*"?([^"]*)"?.*/, '$1').replace(/;$/, '');
      stmts.push({ kind: 'io', label: msg.length > 40 ? msg.slice(0, 40) + '…' : (line.length > 40 ? line.slice(0, 40) + '…' : line) });
    } else if (line.length > 3 && !line.startsWith('}') && !line.startsWith('{')) {
      const label = line.replace(/;$/, '').trim();
      stmts.push({ kind: 'process', label: label.length > 48 ? label.slice(0, 48) + '…' : label });
    }
  }

  return stmts;
}

/* ── Find the best method to visualize ──────────────────────────────────────── */
function extractMethodBody(code: string): { name: string; body: string } | null {
  // Try main first
  const mainRe = /(?:public\s+static\s+void\s+main|def\s+main|static\s+func\s+main)\s*\([^)]*\)\s*(?:throws\s+\w+\s*)?\{/;
  const mainM = mainRe.exec(code);
  if (mainM) {
    const start = mainM.index + mainM[0].length;
    const body = extractBlock(code, start - 1);
    if (body) return { name: 'main', body };
  }

  // Otherwise, find the first public method with a body of decent length
  const methodRe = /(?:public|def\s+|func\s+|fun\s+).*?(?:void|String|int|bool|List|Any|Unit|Object)\s+(\w+)\s*\([^)]*\)[^{]*\{/g;
  let m: RegExpExecArray | null;
  while ((m = methodRe.exec(code)) !== null) {
    const start = m.index + m[0].length - 1;
    const body = extractBlock(code, start);
    if (body && body.length > 20) return { name: m[1], body };
  }

  // Last resort: grab everything between first { and last }
  const fi = code.indexOf('{');
  const li = code.lastIndexOf('}');
  if (fi !== -1 && li !== -1 && li > fi) {
    return { name: 'method', body: code.slice(fi + 1, li) };
  }

  return null;
}

function extractBlock(src: string, startIdx: number): string | null {
  let depth = 0, started = false, start = startIdx;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === '{') {
      if (!started) { started = true; start = i + 1; }
      depth++;
    } else if (src[i] === '}') {
      depth--;
      if (depth === 0 && started) return src.slice(start, i);
    }
  }
  return null;
}

/* ── Build flowchart nodes/edges ─────────────────────────────────────────── */
export function parseCodeToFlowchart(code: string): { nodes: Node[]; edges: Edge[] } {
  const method = extractMethodBody(code);
  const stmts = method ? extractStatements(method.body) : [];

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const X = 320, STEP = 110;

  // Start node
  const startId = uid();
  nodes.push({ id: startId, type: 'flowNode', position: { x: X, y: 40 },
    data: { label: method ? `${method.name}()` : 'start', type: 'start' as FlowNodeType } });

  let prevId = startId;
  let y = 40 + STEP;
  let lastDecisionId: string | null = null;

  if (stmts.length === 0) {
    // Dummy flow
    const pId = uid();
    nodes.push({ id: pId, type: 'flowNode', position: { x: X, y },
      data: { label: 'Process steps', type: 'process' as FlowNodeType } });
    edges.push({ id: `e_${prevId}_${pId}`, source: prevId, target: pId,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
      style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });
    prevId = pId; y += STEP;
  }

  stmts.forEach((stmt, si) => {
    const nid = uid();

    if (stmt.kind === 'decision' || stmt.kind === 'loop') {
      nodes.push({ id: nid, type: 'flowNode', position: { x: X, y },
        data: { label: stmt.label, type: 'decision' as FlowNodeType } });
      edges.push({ id: `e_${prevId}_${nid}`, source: prevId, target: nid,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
        style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });

      // YES branch continues downward
      edges.push({ id: `e_yes_${nid}`, source: nid, target: nid, label: 'Yes',
        type: 'default',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4ade80' },
        style: { stroke: '#4ade80', strokeWidth: 1.5 }, data: { relationship: 'association', label: 'Yes' } });

      lastDecisionId = nid;
      prevId = nid;

    } else if (stmt.kind === 'return') {
      const endId = uid();
      nodes.push({ id: endId, type: 'flowNode', position: { x: X, y },
        data: { label: `return ${stmt.label}`, type: 'end' as FlowNodeType } });
      edges.push({ id: `e_${prevId}_${endId}`, source: prevId, target: endId,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
        style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });
      prevId = endId;
      y += STEP;
      return;

    } else if (stmt.kind === 'io') {
      nodes.push({ id: nid, type: 'flowNode', position: { x: X, y },
        data: { label: stmt.label, type: 'io' as FlowNodeType } });
      edges.push({ id: `e_${prevId}_${nid}`, source: prevId, target: nid,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
        style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });
      prevId = nid;

    } else {
      nodes.push({ id: nid, type: 'flowNode', position: { x: X, y },
        data: { label: stmt.label, type: 'process' as FlowNodeType } });
      edges.push({ id: `e_${prevId}_${nid}`, source: prevId, target: nid,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
        style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });
      prevId = nid;
    }
    y += STEP;

    // NO branch from decision — link to next process
    if (lastDecisionId && stmt.kind !== 'decision' && stmt.kind !== 'loop' && si > 0) {
      const prevStmt = stmts[si - 1];
      if (prevStmt?.kind === 'decision' || prevStmt?.kind === 'loop') {
        edges.push({ id: `e_no_${lastDecisionId}_${nid}`, source: lastDecisionId, target: nid,
          label: 'No',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f87171' },
          style: { stroke: '#f87171', strokeWidth: 1.5 }, data: { relationship: 'association', label: 'No' } });
        lastDecisionId = null;
      }
    }
  });

  // Final end node (if last node isn't already an end)
  const lastNode = nodes[nodes.length - 1];
  if (lastNode && lastNode.data.type !== 'end') {
    const endId = uid();
    nodes.push({ id: endId, type: 'flowNode', position: { x: X, y },
      data: { label: 'end', type: 'end' as FlowNodeType } });
    edges.push({ id: `e_${prevId}_${endId}`, source: prevId, target: endId,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
      style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });
  }

  if (nodes.length === 0) throw new Error('Could not extract any control flow from the code.');
  return { nodes, edges };
}

/* ── Build activity diagram nodes/edges ─────────────────────────────────── */
export function parseCodeToActivity(code: string): { nodes: Node[]; edges: Edge[] } {
  const method = extractMethodBody(code);
  const stmts = method ? extractStatements(method.body) : [];

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const X = 300, STEP = 120;

  const initId = uid();
  nodes.push({ id: initId, type: 'activityNode', position: { x: X, y: 40 },
    data: { label: method ? `«start» ${method.name}` : 'initial', type: 'initial' as ActivityNodeType } });

  let prevId = initId;
  let y = 40 + STEP;

  const effectiveStmts = stmts.length > 0 ? stmts : [
    { kind: 'process' as const, label: 'Validate input' },
    { kind: 'decision' as const, label: 'Input valid?' },
    { kind: 'process' as const, label: 'Execute operation' },
    { kind: 'process' as const, label: 'Return result' },
  ];

  effectiveStmts.forEach((stmt, si) => {
    const nid = uid();
    let type: ActivityNodeType = 'action';

    if (stmt.kind === 'decision' || stmt.kind === 'loop') {
      type = 'decision';
    } else if (stmt.kind === 'return') {
      type = 'final';
    }

    nodes.push({ id: nid, type: 'activityNode', position: { x: X, y },
      data: { label: stmt.label, type } });
    edges.push({ id: `e_${prevId}_${nid}`, source: prevId, target: nid,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
      style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });

    if (stmt.kind === 'decision' || stmt.kind === 'loop') {
      // YES branch — peek ahead
      if (si + 1 < effectiveStmts.length) {
        edges.push({ id: `e_yes_${nid}`, source: nid, target: nid,
          label: '[ yes ]',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#4ade80' },
          style: { stroke: '#4ade80', strokeWidth: 1.5, strokeDasharray: '5,3' }, data: { relationship: 'association', label: '[ yes ]' } });
      }
    }

    prevId = nid;
    y += STEP;
  });

  // Final node
  const lastNode = nodes[nodes.length - 1];
  if (lastNode && lastNode.data.type !== 'final') {
    const finalId = uid();
    nodes.push({ id: finalId, type: 'activityNode', position: { x: X, y },
      data: { label: 'final', type: 'final' as ActivityNodeType } });
    edges.push({ id: `e_${prevId}_${finalId}`, source: prevId, target: finalId,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
      style: { stroke: '#3f3f46', strokeWidth: 1.5 }, data: { relationship: 'association', label: '' } });
  }

  return { nodes, edges };
}

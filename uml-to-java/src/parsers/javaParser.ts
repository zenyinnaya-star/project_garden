import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

type Visibility = 'public' | 'private' | 'protected';

function vis(mods: string): Visibility {
  if (mods.includes('private')) return 'private';
  if (mods.includes('protected')) return 'protected';
  return 'public';
}

function stripComments(src: string): string {
  return src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

// Returns the body of the first { ... } block after startIdx, plus the end index
function extractBlock(src: string, startIdx: number): { body: string; end: number } {
  let depth = 0;
  let started = false;
  let start = startIdx;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === '{') {
      if (!started) { started = true; start = i + 1; }
      depth++;
    } else if (src[i] === '}') {
      depth--;
      if (depth === 0 && started) return { body: src.slice(start, i), end: i + 1 };
    }
  }
  return { body: '', end: src.length };
}

export function parseJavaToNodes(java: string): { nodes: Node[]; edges: Edge[] } {
  const src = stripComments(java);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Match class/interface/abstract class declarations
  const classRe = /((?:public|private|protected|)\s*(?:abstract\s+|)(?:class|interface|enum))\s+(\w+)(?:\s+extends\s+([\w<>,\s]+?))?(?:\s+implements\s+([\w<>,\s]+?))?\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = classRe.exec(src)) !== null) {
    const decl = m[1].toLowerCase();
    const className = m[2];
    const superClass = m[3]?.split('<')[0].trim();
    const impls = m[4]?.split(',').map(s => s.split('<')[0].trim()).filter(Boolean) ?? [];

    const classType = decl.includes('interface') ? 'interface'
      : decl.includes('abstract') ? 'abstract'
      : 'class';

    const { body, end } = extractBlock(src, m.index + m[0].length - 1);
    classRe.lastIndex = end; // skip past this class body

    // Parse fields: visibility? type name ;
    const fields: { name: string; type: string; visibility: Visibility }[] = [];
    const fieldRe = /^\s*((?:(?:public|private|protected|static|final|volatile|transient)\s+)*)(\w+(?:<[^;]*?>)?(?:\[\])?)\s+(\w+)\s*(?:=\s*[^;]+)?;/gm;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRe.exec(body)) !== null) {
      const mods = fm[1].trim();
      const type = fm[2];
      const name = fm[3];
      const skip = ['return', 'throw', 'new', 'if', 'while', 'for', 'switch', 'case', 'this', 'super', 'import', 'package'];
      if (skip.includes(name) || skip.includes(type)) continue;
      if (/^[A-Z]/.test(name)) continue; // likely a class reference, not a field name
      fields.push({ name, type, visibility: vis(mods) });
    }

    // Parse methods: visibility? returnType name(params) { or ;
    const methods: { name: string; returnType: string; params: string; visibility: Visibility; isAbstract?: boolean }[] = [];
    const methodRe = /^\s*((?:(?:public|private|protected|static|abstract|final|synchronized|native|default)\s+)*)(\w+(?:<[^(]*?>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*([{;])/gm;
    let mm: RegExpExecArray | null;
    while ((mm = methodRe.exec(body)) !== null) {
      const mods = mm[1].trim();
      const returnType = mm[2];
      const name = mm[3];
      const params = mm[4].trim();
      const ending = mm[5];
      const skip2 = ['if', 'for', 'while', 'switch', 'catch', 'try', 'else'];
      if (skip2.includes(name)) continue;
      methods.push({
        name,
        returnType,
        params,
        visibility: vis(mods),
        isAbstract: mods.includes('abstract') || ending === ';',
      });
    }

    const idx = nodes.length;
    const id = `java_${idx}`;
    nodes.push({
      id,
      type: 'classNode',
      position: { x: (idx % 3) * 310 + 60, y: Math.floor(idx / 3) * 290 + 60 },
      data: { label: className, type: classType, fields, methods },
    });

    // Deferred edges (target may not exist yet — collect and resolve after)
    if (superClass) {
      edges.push({ id: `ext_${idx}`, source: id, target: `__${superClass}`, data: { relationship: 'extends' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#c084fc' }, style: { stroke: '#c084fc', strokeWidth: 1.5 } });
    }
    for (const iface of impls) {
      edges.push({ id: `impl_${idx}_${iface}`, source: id, target: `__${iface}`, data: { relationship: 'implements' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' }, style: { stroke: '#60a5fa', strokeWidth: 1.5, strokeDasharray: '5,5' } });
    }
  }

  // Resolve placeholder targets
  const nameToId = new Map(nodes.map(n => [(n.data as { label: string }).label, n.id]));
  const resolvedEdges = edges
    .map(e => {
      if (!e.target.startsWith('__')) return e;
      const realId = nameToId.get(e.target.slice(2));
      return realId ? { ...e, target: realId } : null;
    })
    .filter((e): e is Edge => e !== null);

  return { nodes, edges: resolvedEdges };
}

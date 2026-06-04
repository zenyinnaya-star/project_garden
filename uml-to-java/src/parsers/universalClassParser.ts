/**
 * Universal OOP class parser — handles Python, Kotlin, C#, TypeScript, PHP, Ruby.
 * Produces the same `classNode` nodes/edges as javaParser.ts so the rest of the
 * app can consume them identically.
 */
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

type Vis = 'public' | 'private' | 'protected';
interface PField  { name: string; type: string; visibility: Vis }
interface PMethod { name: string; returnType: string; params: string; visibility: Vis }
interface PClass  {
  name: string;
  kind: 'class' | 'interface' | 'abstract';
  parent?: string;
  interfaces: string[];
  fields: PField[];
  methods: PMethod[];
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */
let _id = 1;
const uid = () => `node_${_id++}`;

function buildNodesEdges(classes: PClass[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nameToId: Record<string, string> = {};

  classes.forEach((c, i) => {
    const id = uid();
    nameToId[c.name] = id;
    nodes.push({
      id,
      type: 'classNode',
      position: { x: (i % 4) * 260 + 60, y: Math.floor(i / 4) * 300 + 60 },
      data: {
        label:   c.name,
        type:    c.kind,
        fields:  c.fields,
        methods: c.methods,
      },
    });
  });

  classes.forEach(c => {
    const src = nameToId[c.name];
    if (!src) return;

    if (c.parent && nameToId[c.parent]) {
      edges.push({
        id: `e_ext_${src}`,
        source: src, target: nameToId[c.parent],
        markerEnd: { type: MarkerType.ArrowClosed, color: '#c084fc' },
        style: { stroke: '#c084fc', strokeWidth: 1.5 },
        data: { relationship: 'extends', label: '' },
      });
    }
    c.interfaces.forEach(iface => {
      if (nameToId[iface]) {
        edges.push({
          id: `e_impl_${src}_${iface}`,
          source: src, target: nameToId[iface],
          markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
          style: { stroke: '#60a5fa', strokeWidth: 1.5, strokeDasharray: '6,3' },
          data: { relationship: 'implements', label: '' },
        });
      }
    });
  });

  return { nodes, edges };
}

/* ─── Python ───────────────────────────────────────────────────────────────── */
export function parsePythonToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  const classes: PClass[] = [];

  // Split into class blocks
  const classHeaderRe = /^class\s+(\w+)(?:\(([^)]*)\))?:/gm;
  const headers: { name: string; parents: string[]; bodyStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = classHeaderRe.exec(code)) !== null) {
    const parents = m[2] ? m[2].split(',').map(s => s.trim()).filter(s => s && s !== 'object') : [];
    headers.push({ name: m[1], parents, bodyStart: m.index + m[0].length });
  }

  headers.forEach((h, hi) => {
    const bodyEnd = hi + 1 < headers.length ? headers[hi + 1].bodyStart - 20 : code.length;
    const body = code.slice(h.bodyStart, bodyEnd);

    const fields: PField[] = [];
    const methods: PMethod[] = [];
    const isAbstract = body.includes('@abstractmethod') || h.name.toLowerCase().startsWith('abstract');
    const isInterface = false; // Python has no interface keyword

    // Methods: def name(self, ...) -> ret:
    const methodRe = /^\s{4}def\s+(\w+)\s*\(self(?:,\s*([^)]*))?\)(?:\s*->\s*([^\s:]+))?\s*:/gm;
    let mm: RegExpExecArray | null;
    while ((mm = methodRe.exec(body)) !== null) {
      const name = mm[1];
      const params = (mm[2] || '').trim();
      const ret = (mm[3] || 'None').trim();
      const vis: Vis = name.startsWith('__') && name !== '__init__' ? 'private' : name.startsWith('_') ? 'protected' : 'public';
      if (name === '__init__') {
        // Extract constructor params as fields
        const cparams = params.split(',').map(p => p.trim()).filter(Boolean);
        cparams.forEach(cp => {
          const [pname, ptype] = cp.split(':').map(s => s.trim());
          if (pname && !fields.find(f => f.name === pname)) {
            fields.push({ name: pname, type: (ptype || 'Any').split('=')[0].trim(), visibility: 'public' });
          }
        });
      } else {
        methods.push({ name, returnType: ret, params, visibility: vis });
      }
    }

    // self.field = ... in __init__
    const initRe = /def\s+__init__[\s\S]*?(?=\n\s{4}def|\n\s*class\s|$)/;
    const initBody = body.match(initRe)?.[0] ?? '';
    const selfRe = /self\.(\w+)\s*(?::\s*(\S+))?\s*=/g;
    let sf: RegExpExecArray | null;
    while ((sf = selfRe.exec(initBody)) !== null) {
      const fname = sf[1];
      const ftype = sf[2] || 'Any';
      if (!fields.find(f => f.name === fname)) {
        fields.push({ name: fname, type: ftype, visibility: fname.startsWith('_') ? 'private' : 'public' });
      }
    }

    const parent = h.parents[0];
    const ifaces = h.parents.slice(1);
    classes.push({ name: h.name, kind: isAbstract ? 'abstract' : isInterface ? 'interface' : 'class', parent, interfaces: ifaces, fields, methods });
  });

  if (classes.length === 0) throw new Error('No class definitions found in the Python code.');
  return buildNodesEdges(classes);
}

/* ─── Kotlin ───────────────────────────────────────────────────────────────── */
export function parseKotlinToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  const classes: PClass[] = [];
  const stripped = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  const classRe = /(data\s+class|abstract\s+class|sealed\s+class|interface|class|object)\s+(\w+)(?:\s*\(([^)]*)\))?(?:\s*:\s*([^{]+))?\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(stripped)) !== null) {
    const keyword = m[1].trim();
    const name = m[2];
    const ctorParams = m[3] || '';
    const supers = m[4] ? m[4].split(',').map(s => s.replace(/\([^)]*\)/, '').trim()) : [];

    // Extract class body
    let depth = 1, i = classRe.lastIndex;
    const bodyStart = i;
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}') depth--;
      i++;
    }
    const body = stripped.slice(bodyStart, i - 1);

    const fields: PField[] = [];
    const methods: PMethod[] = [];

    // Constructor params → fields
    ctorParams.split(',').forEach(cp => {
      const fpRe = /(?:private\s+|protected\s+|public\s+)?(?:val|var)\s+(\w+)\s*:\s*([^,=)]+)/;
      const fp = cp.match(fpRe);
      if (fp) {
        const vis: Vis = cp.includes('private') ? 'private' : cp.includes('protected') ? 'protected' : 'public';
        fields.push({ name: fp[1], type: fp[2].trim(), visibility: vis });
      }
    });

    // Body fields: val/var name: Type
    const fieldRe = /(?:private\s+|protected\s+|public\s+)?(?:val|var)\s+(\w+)\s*:\s*([^=\n{]+)/g;
    let ff: RegExpExecArray | null;
    while ((ff = fieldRe.exec(body)) !== null) {
      if (!fields.find(f => f.name === ff![1])) {
        const vis: Vis = body.slice(0, ff.index).match(/private\s*$/) ? 'private' : body.slice(0, ff.index).match(/protected\s*$/) ? 'protected' : 'public';
        fields.push({ name: ff[1], type: ff[2].trim(), visibility: vis });
      }
    }

    // Methods: fun name(params): ReturnType
    const funRe = /(?:(private|protected|public|override)\s+)?fun\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\s{=]+))?/g;
    let fm: RegExpExecArray | null;
    while ((fm = funRe.exec(body)) !== null) {
      const vis: Vis = fm[1] === 'private' ? 'private' : fm[1] === 'protected' ? 'protected' : 'public';
      methods.push({ name: fm[2], returnType: (fm[4] || 'Unit').trim(), params: fm[3].trim(), visibility: vis });
    }

    const isInterface = keyword === 'interface';
    const isAbstract = keyword.includes('abstract');
    const parent = !isInterface ? supers[0] : undefined;
    const ifaces = isInterface ? [] : supers.slice(1);

    classes.push({ name, kind: isInterface ? 'interface' : isAbstract ? 'abstract' : 'class', parent, interfaces: ifaces, fields, methods });
  }

  if (classes.length === 0) throw new Error('No class definitions found in the Kotlin code.');
  return buildNodesEdges(classes);
}

/* ─── C# ───────────────────────────────────────────────────────────────────── */
export function parseCSharpToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  const classes: PClass[] = [];
  const stripped = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  const classRe = /(?:public\s+|private\s+|protected\s+|internal\s+)?(?:(abstract|sealed|static)\s+)?(class|interface|struct)\s+(\w+)(?:\s*:\s*([^{]+))?\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(stripped)) !== null) {
    const modifier = m[1] || '';
    const keyword = m[2];
    const name = m[3];
    const supers = m[4] ? m[4].split(',').map(s => s.trim()) : [];

    let depth = 1, i = classRe.lastIndex;
    const bodyStart = i;
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}') depth--;
      i++;
    }
    const body = stripped.slice(bodyStart, i - 1);

    const fields: PField[] = [];
    const methods: PMethod[] = [];

    // Fields: private/public/protected Type _name;
    const fieldRe = /(?:(private|public|protected|internal)\s+)?(?:readonly\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*(?:;|=\s*[^;]+;)/g;
    let ff: RegExpExecArray | null;
    while ((ff = fieldRe.exec(body)) !== null) {
      const vis: Vis = ff[1] === 'public' ? 'public' : ff[1] === 'protected' ? 'protected' : 'private';
      // Skip if looks like a method (contains parentheses)
      if (!body.slice(ff.index, ff.index + ff[0].length + 20).includes('(')) {
        fields.push({ name: ff[3], type: ff[2], visibility: vis });
      }
    }

    // Methods: visibility ReturnType Name(params)
    const methodRe = /(?:(private|public|protected|internal|static|virtual|override|abstract)\s+)+(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)/g;
    let mm: RegExpExecArray | null;
    while ((mm = methodRe.exec(body)) !== null) {
      const mods = mm[0].toLowerCase();
      const vis: Vis = mods.includes('private') ? 'private' : mods.includes('protected') ? 'protected' : 'public';
      methods.push({ name: mm[3], returnType: mm[2], params: mm[4].trim(), visibility: vis });
    }

    const isInterface = keyword === 'interface';
    const isAbstract = modifier === 'abstract';
    const parent = !isInterface ? supers.find(s => !s.startsWith('I') || s.length <= 2) : undefined;
    const ifaces = !isInterface ? supers.filter(s => s !== parent) : [];

    classes.push({ name, kind: isInterface ? 'interface' : isAbstract ? 'abstract' : 'class', parent, interfaces: ifaces, fields, methods });
  }

  if (classes.length === 0) throw new Error('No class definitions found in the C# code.');
  return buildNodesEdges(classes);
}

/* ─── TypeScript ───────────────────────────────────────────────────────────── */
export function parseTypeScriptToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  const classes: PClass[] = [];
  const stripped = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  const classRe = /(?:export\s+)?(?:abstract\s+)?(class|interface)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(stripped)) !== null) {
    const keyword = m[1];
    const name = m[2];
    const parent = m[3]?.trim();
    const ifaces = m[4] ? m[4].split(',').map(s => s.trim()).filter(Boolean) : [];
    const isAbstract = stripped.slice(Math.max(0, m.index - 10), m.index).includes('abstract');
    const isInterface = keyword === 'interface';

    let depth = 1, i = classRe.lastIndex;
    const bodyStart = i;
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}') depth--;
      i++;
    }
    const body = stripped.slice(bodyStart, i - 1);

    const fields: PField[] = [];
    const methods: PMethod[] = [];

    // Field: [private|public|protected|readonly] name[?]: Type
    const fieldRe = /(?:(private|public|protected|readonly)\s+)?(\w+)\s*[?!]?\s*:\s*([^;=\n({}]+)\s*;/g;
    let ff: RegExpExecArray | null;
    while ((ff = fieldRe.exec(body)) !== null) {
      const vis: Vis = ff[1] === 'private' ? 'private' : ff[1] === 'protected' ? 'protected' : 'public';
      fields.push({ name: ff[2], type: ff[3].trim(), visibility: vis });
    }

    // Methods: [vis] name(params): ReturnType
    const methodRe = /(?:(private|public|protected|static|async|abstract)\s+)*(\w+)\s*\(([^)]*)\)\s*(?::\s*([^\s{;]+))?\s*\{/g;
    let mm: RegExpExecArray | null;
    while ((mm = methodRe.exec(body)) !== null) {
      const mods = mm[0].toLowerCase();
      const vis: Vis = mods.includes('private') ? 'private' : mods.includes('protected') ? 'protected' : 'public';
      methods.push({ name: mm[2], returnType: (mm[4] || 'void').trim(), params: mm[3].trim(), visibility: vis });
    }

    classes.push({ name, kind: isInterface ? 'interface' : isAbstract ? 'abstract' : 'class', parent, interfaces: ifaces, fields, methods });
  }

  if (classes.length === 0) throw new Error('No class definitions found in the TypeScript code.');
  return buildNodesEdges(classes);
}

/* ─── PHP ───────────────────────────────────────────────────────────────────── */
export function parsePHPToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  const classes: PClass[] = [];
  const stripped = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/#[^\n]*/g, '');

  const classRe = /(?:(abstract|final)\s+)?(class|interface|trait)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(stripped)) !== null) {
    const name = m[3];
    const parent = m[4]?.trim();
    const ifaces = m[5] ? m[5].split(',').map(s => s.trim()) : [];
    const isAbstract = m[1] === 'abstract';
    const isInterface = m[2] === 'interface';

    let depth = 1, i = classRe.lastIndex;
    const bodyStart = i;
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}') depth--;
      i++;
    }
    const body = stripped.slice(bodyStart, i - 1);

    const fields: PField[] = [];
    const methods: PMethod[] = [];

    // Properties: [public|private|protected] $name [= value];
    const propRe = /(public|private|protected)\s+(?:static\s+)?\$(\w+)/g;
    let pp: RegExpExecArray | null;
    while ((pp = propRe.exec(body)) !== null) {
      const vis: Vis = pp[1] as Vis;
      if (!body.slice(pp.index, pp.index + pp[0].length + 40).includes('function')) {
        fields.push({ name: '$' + pp[2], type: 'mixed', visibility: vis });
      }
    }

    // Methods: function name(params)
    const methodRe = /(public|private|protected)?\s+(?:static\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let mm: RegExpExecArray | null;
    while ((mm = methodRe.exec(body)) !== null) {
      const vis: Vis = (mm[1] as Vis) || 'public';
      methods.push({ name: mm[2], returnType: 'mixed', params: mm[3].trim(), visibility: vis });
    }

    classes.push({ name, kind: isInterface ? 'interface' : isAbstract ? 'abstract' : 'class', parent, interfaces: ifaces, fields, methods });
  }

  if (classes.length === 0) throw new Error('No class definitions found in the PHP code.');
  return buildNodesEdges(classes);
}

/* ─── Ruby ───────────────────────────────────────────────────────────────────── */
export function parseRubyToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  const classes: PClass[] = [];
  const stripped = code.replace(/#[^\n]*/g, '');

  const classRe = /^class\s+(\w+)(?:\s*<\s*(\w+))?/gm;
  let m: RegExpExecArray | null;
  while ((m = classRe.exec(stripped)) !== null) {
    const name = m[1];
    const parent = m[2];

    const start = m.index + m[0].length;
    // Find matching `end`
    let depth = 1, i = start;
    while (i < stripped.length && depth > 0) {
      if (/^class\s|^module\s|^def\s/.test(stripped.slice(i).trimStart().slice(0, 10))) {
        if (/^class\s|^module\s/.test(stripped.slice(i).trimStart().slice(0, 10))) depth++;
      }
      if (/^\s*end\b/.test(stripped.slice(i))) depth--;
      i = stripped.indexOf('\n', i) + 1;
      if (i === 0) break;
    }
    const body = stripped.slice(start, i);

    const fields: PField[] = [];
    const methods: PMethod[] = [];

    // attr_accessor/attr_reader/attr_writer
    const attrRe = /attr_(?:accessor|reader|writer)\s+([^#\n]+)/g;
    let aa: RegExpExecArray | null;
    while ((aa = attrRe.exec(body)) !== null) {
      aa[1].split(',').forEach(a => {
        const fname = a.trim().replace(/^:/, '');
        if (fname) fields.push({ name: fname, type: 'Object', visibility: 'public' });
      });
    }

    // Methods: def name / def self.name
    const defRe = /def\s+(?:self\.)?(\w+)\s*(?:\(([^)]*)\))?/g;
    let dd: RegExpExecArray | null;
    while ((dd = defRe.exec(body)) !== null) {
      const mname = dd[1];
      const vis: Vis = mname.startsWith('_') ? 'private' : 'public';
      methods.push({ name: mname, returnType: 'Object', params: dd[2] || '', visibility: vis });
    }

    classes.push({ name, kind: 'class', parent, interfaces: [], fields, methods });
  }

  if (classes.length === 0) throw new Error('No class definitions found in the Ruby code.');
  return buildNodesEdges(classes);
}

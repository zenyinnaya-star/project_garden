/**
 * Converts OOP source code into a Sequence diagram.
 * Strategy: each top-level class = 1 participant.
 *           For each method, look for calls to OTHER parsed classes inside the body.
 *           That produces "ClassA → ClassB: methodCall()" messages.
 *           If no inter-class calls are found, generate a simple request/response stub.
 */
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { parseJavaToNodes } from './javaParser';

interface ClassInfo { id: string; name: string; methods: string[] }

let _seq = 1;
const uid = () => `seq_${_seq++}`;

/* Extract class names + their public methods from already-parsed classNodes */
function extractClassInfo(nodes: Node[]): ClassInfo[] {
  return nodes.map(n => ({
    id: uid(),
    name: n.data.label as string,
    methods: ((n.data.methods ?? []) as { name: string; visibility: string }[])
      .filter(m => m.visibility === 'public')
      .map(m => m.name),
  }));
}

/* Build sequence-style edges between classes based on heuristic:
   - if ClassA's method list contains something that looks like ClassB's method → A calls B
   - otherwise A calls B alphabetically for demo purposes */
function buildSequenceEdges(classes: ClassInfo[], originalNodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  if (classes.length < 2) {
    // Single class → self-call loop for each method
    const cls = classes[0];
    cls.methods.slice(0, 4).forEach(method => {
      edges.push({
        id: `e_self_${cls.id}_${method}`,
        source: cls.id, target: cls.id,
        label: `${method}()`,
        style: { stroke: '#60a5fa', strokeWidth: 1.5 },
        data: { relationship: 'association', label: `${method}()` },
      });
    });
    return edges;
  }

  // Try to detect inter-class calls using original node field types
  const classNameSet = new Set(classes.map(c => c.name));
  classes.forEach(src => {
    const srcOriginal = originalNodes.find(n => (n.data.label as string) === src.name);
    if (!srcOriginal) return;

    // Fields whose type is another class → dependency
    const fieldTypes: string[] = ((srcOriginal.data.fields ?? []) as { type: string }[])
      .map(f => {
        // Strip generics: List<Order> → Order
        return f.type.replace(/.*<(.+)>.*/, '$1').replace(/\[\]/, '').trim();
      })
      .filter(t => classNameSet.has(t));

    const targets = [...new Set(fieldTypes)];
    if (targets.length > 0) {
      // Add a message for each public method of src to each dependent class
      src.methods.slice(0, 3).forEach((method, mi) => {
        const tgt = classes.find(c => c.name === targets[mi % targets.length]);
        if (tgt) {
          edges.push({
            id: `e_seq_${src.id}_${tgt.id}_${method}`,
            source: src.id, target: tgt.id,
            label: `${method}()`,
            style: { stroke: '#60a5fa', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
            data: { relationship: 'association', label: `${method}()` },
          });
          // Return response
          if (tgt.methods.length > 0) {
            edges.push({
              id: `e_ret_${tgt.id}_${src.id}_${method}`,
              source: tgt.id, target: src.id,
              label: `return ${tgt.methods[0]}Result`,
              style: { stroke: '#4ade80', strokeWidth: 1, strokeDasharray: '5,3' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#4ade80' },
              data: { relationship: 'association', label: '' },
            });
          }
        }
      });
    } else {
      // Fallback: just link sequentially
      const idx = classes.indexOf(src);
      if (idx < classes.length - 1) {
        const tgt = classes[idx + 1];
        edges.push({
          id: `e_seq_${src.id}_${tgt.id}`,
          source: src.id, target: tgt.id,
          label: src.methods[0] ? `${src.methods[0]}()` : 'request()',
          style: { stroke: '#60a5fa', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
          data: { relationship: 'association', label: '' },
        });
      }
    }
  });

  return edges;
}

export function parseCodeToSequence(code: string): { nodes: Node[]; edges: Edge[] } {
  // Reuse Java parser to get class structure, then reformat as sequenceNodes
  const { nodes: classNodes } = parseJavaToNodes(code);
  if (classNodes.length === 0) throw new Error('No class definitions found.');

  const classes = extractClassInfo(classNodes);
  const SPACING = 220;

  const nodes: Node[] = classes.map((c, i) => ({
    id: c.id,
    type: 'sequenceNode',
    position: { x: 80 + i * SPACING, y: 60 },
    data: { label: c.name, type: 'object' as const },
  }));

  const edges = buildSequenceEdges(classes, classNodes);
  return { nodes, edges };
}

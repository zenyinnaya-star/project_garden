import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '../types';

function sanitize(label: string) {
  return label.replace(/[^a-zA-Z0-9_ ]/g, '').trim().replace(/\s+(.)/g, (_, c) => c.toUpperCase());
}

function buildMethod(nodeId: string, nodes: Node[], edges: Edge[], visited: Set<string>, indent: number): string[] {
  if (visited.has(nodeId)) return [`${' '.repeat(indent)}// (loop back)`];
  visited.add(nodeId);

  const node = nodes.find(n => n.id === nodeId);
  if (!node) return [];

  const d = node.data as unknown as FlowNodeData;
  const lines: string[] = [];
  const pad = ' '.repeat(indent);

  if (d.type === 'end') {
    lines.push(`${pad}return;`);
    return lines;
  }

  if (d.type === 'process') {
    lines.push(`${pad}${sanitize(d.label)}();`);
  } else if (d.type === 'io') {
    if (d.label.toLowerCase().includes('input') || d.label.toLowerCase().includes('read')) {
      lines.push(`${pad}Scanner scanner = new Scanner(System.in);`);
      lines.push(`${pad}String input = scanner.nextLine(); // ${d.label}`);
    } else {
      lines.push(`${pad}System.out.println(${JSON.stringify(d.label)});`);
    }
  } else if (d.type === 'decision') {
    const outEdges = edges.filter(e => e.source === nodeId);
    const yesEdge = outEdges.find(e => (e.label as string)?.toLowerCase() === 'yes' || e.sourceHandle === 'yes');
    const noEdge = outEdges.find(e => (e.label as string)?.toLowerCase() === 'no' || e.sourceHandle === 'no' || e !== yesEdge);

    lines.push(`${pad}if (/* ${d.label} */) {`);
    if (yesEdge) {
      lines.push(...buildMethod(yesEdge.target, nodes, edges, new Set(visited), indent + 4));
    }
    if (noEdge) {
      lines.push(`${pad}} else {`);
      lines.push(...buildMethod(noEdge.target, nodes, edges, new Set(visited), indent + 4));
    }
    lines.push(`${pad}}`);
    return lines;
  }

  // Follow next edge
  const nextEdges = edges.filter(e => e.source === nodeId);
  for (const edge of nextEdges) {
    lines.push(...buildMethod(edge.target, nodes, edges, visited, indent));
  }

  return lines;
}

export function generateFlowCode(nodes: Node[], edges: Edge[]): string {
  const flowNodes = nodes.filter(n => n.type === 'flowNode');
  if (flowNodes.length === 0) return '// No flowchart nodes defined yet.';

  const startNode = flowNodes.find(n => (n.data as unknown as FlowNodeData).type === 'start');
  const processNodes = flowNodes.filter(n => (n.data as unknown as FlowNodeData).type === 'process');

  const lines: string[] = [];
  lines.push('// Generated from Flowchart Diagram');
  lines.push('');
  lines.push('public class FlowProcess {');
  lines.push('');
  lines.push('    public static void main(String[] args) {');

  if (startNode) {
    lines.push(...buildMethod(startNode.id, nodes, edges, new Set(), 8));
  } else {
    lines.push('        // Connect a Start node to begin');
  }

  lines.push('    }');
  lines.push('');

  // Generate stub methods for each process node
  for (const node of processNodes) {
    const d = node.data as unknown as FlowNodeData;
    const name = sanitize(d.label) || 'process';
    lines.push(`    private static void ${name}() {`);
    lines.push(`        // TODO: implement ${d.label}`);
    lines.push('    }');
    lines.push('');
  }

  lines.push('}');
  return lines.join('\n');
}

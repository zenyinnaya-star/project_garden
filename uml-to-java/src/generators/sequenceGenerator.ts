import type { Node, Edge } from '@xyflow/react';
import type { SequenceNodeData } from '../types';

export function generateSequenceCode(nodes: Node[], edges: Edge[]): string {
  const participants = nodes.filter(n => n.type === 'sequenceNode');
  const lines: string[] = [];

  if (participants.length === 0) return '// No sequence participants defined yet.';

  lines.push('// Generated from Sequence Diagram');
  lines.push('');

  // Generate a class per participant
  for (const node of participants) {
    const d = node.data as unknown as SequenceNodeData;
    const className = d.label.replace(/\s+/g, '');
    const keyword = d.type === 'actor' ? 'class' : 'class';

    lines.push(`public ${keyword} ${className} {`);

    // Generate methods from outgoing edges
    const outEdges = edges.filter(e => e.source === node.id);
    for (const edge of outEdges) {
      const targetNode = participants.find(p => p.id === edge.target);
      if (!targetNode) continue;
      const targetData = targetNode.data as unknown as SequenceNodeData;
      const methodLabel = (edge.label as string) || 'call';
      const methodName = methodLabel.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[0-9]/, '_');
      const targetClass = targetData.label.replace(/\s+/g, '');

      lines.push(`    public void ${methodName}(${targetClass} target) {`);
      lines.push(`        // Message to ${targetData.label}`);
      lines.push(`        target.handle${methodName.charAt(0).toUpperCase() + methodName.slice(1)}(this);`);
      lines.push('    }');
    }

    // Generate handler methods from incoming edges
    const inEdges = edges.filter(e => e.target === node.id);
    for (const edge of inEdges) {
      const sourceNode = participants.find(p => p.id === edge.source);
      if (!sourceNode) continue;
      const sourceData = sourceNode.data as unknown as SequenceNodeData;
      const methodLabel = (edge.label as string) || 'call';
      const methodName = methodLabel.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[0-9]/, '_');
      const sourceClass = sourceData.label.replace(/\s+/g, '');

      lines.push(`    public void handle${methodName.charAt(0).toUpperCase() + methodName.slice(1)}(${sourceClass} sender) {`);
      lines.push(`        // Handle message from ${sourceData.label}`);
      lines.push('    }');
    }

    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

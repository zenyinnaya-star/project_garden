import type { Node, Edge } from '@xyflow/react';
import type { ClassNodeData } from '../types';

const visMap = { public: 'public', private: 'private', protected: 'protected' };

export function generateClassCode(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const lines: string[] = [];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;

    // Determine superclass and interfaces from edges
    const superEdges = edges.filter(e => e.source === node.id && e.data?.relationship === 'extends');
    const implEdges = edges.filter(e => e.source === node.id && e.data?.relationship === 'implements');

    const superClass = superEdges
      .map(e => classes.find(c => c.id === e.target))
      .filter(Boolean)
      .map(c => (c!.data as unknown as ClassNodeData).label)[0];

    const interfaces = implEdges
      .map(e => classes.find(c => c.id === e.target))
      .filter(Boolean)
      .map(c => (c!.data as unknown as ClassNodeData).label);

    const keyword = d.type === 'interface' ? 'interface' : d.type === 'abstract' ? 'abstract class' : 'class';

    let declaration = `public ${keyword} ${d.label}`;
    if (superClass) declaration += ` extends ${superClass}`;
    if (interfaces.length) declaration += ` implements ${interfaces.join(', ')}`;

    lines.push(declaration + ' {');

    // Fields
    if (d.fields.length > 0) {
      for (const f of d.fields) {
        lines.push(`    ${visMap[f.visibility]} ${f.type} ${f.name};`);
      }
      lines.push('');
    }

    // Constructor
    if (d.type !== 'interface') {
      const ctorParams = d.fields
        .filter(f => f.visibility === 'private')
        .map(f => `${f.type} ${f.name}`)
        .join(', ');
      lines.push(`    public ${d.label}(${ctorParams}) {`);
      for (const f of d.fields.filter(f => f.visibility === 'private')) {
        lines.push(`        this.${f.name} = ${f.name};`);
      }
      lines.push('    }');
      lines.push('');
    }

    // Methods
    for (const m of d.methods) {
      const abstractMod = m.isAbstract && d.type === 'abstract' ? 'abstract ' : '';
      const sig = `    ${visMap[m.visibility]} ${abstractMod}${m.returnType} ${m.name}(${m.params})`;
      if (d.type === 'interface' || m.isAbstract) {
        lines.push(sig + ';');
      } else {
        lines.push(sig + ' {');
        if (m.returnType !== 'void') {
          const defaults: Record<string, string> = {
            'int': 'return 0;', 'long': 'return 0L;', 'double': 'return 0.0;',
            'boolean': 'return false;', 'String': 'return "";',
          };
          lines.push(`        ${defaults[m.returnType] || `return null;`}`);
        }
        lines.push('    }');
      }
    }

    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

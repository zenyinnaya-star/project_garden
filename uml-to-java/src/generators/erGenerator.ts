import type { Node, Edge } from '@xyflow/react';
import type { ErNodeData } from '../types';

const javaTypeMap: Record<string, string> = {
  'INT': 'Integer',
  'BIGINT': 'Long',
  'VARCHAR': 'String',
  'TEXT': 'String',
  'BOOLEAN': 'Boolean',
  'FLOAT': 'Float',
  'DOUBLE': 'Double',
  'DATE': 'LocalDate',
  'DATETIME': 'LocalDateTime',
  'TIMESTAMP': 'LocalDateTime',
  'DECIMAL': 'BigDecimal',
};

function toJavaType(sqlType: string): string {
  const upper = sqlType.toUpperCase().split('(')[0];
  return javaTypeMap[upper] || 'String';
}

function toCamelCase(name: string): string {
  return name.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toPascalCase(name: string): string {
  const camel = toCamelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function generateErCode(nodes: Node[], edges: Edge[]): string {
  const entities = nodes.filter(n => n.type === 'erNode');
  if (entities.length === 0) return '// No ER entities defined yet.';

  const lines: string[] = [];
  lines.push('// Generated from ER Diagram — JPA Entities');
  lines.push('import javax.persistence.*;');
  lines.push('import java.math.BigDecimal;');
  lines.push('import java.time.LocalDate;');
  lines.push('import java.time.LocalDateTime;');
  lines.push('import java.util.List;');
  lines.push('');

  for (const node of entities) {
    const d = node.data as unknown as ErNodeData;
    const className = toPascalCase(d.label);

    // Find relationship edges
    const outEdges = edges.filter(e => e.source === node.id);

    lines.push('@Entity');
    lines.push(`@Table(name = "${d.label.toLowerCase()}")`);
    lines.push(`public class ${className} {`);
    lines.push('');

    // Fields
    for (const attr of d.attributes) {
      if (attr.isPrimary) {
        lines.push('    @Id');
        lines.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)');
      }
      if (attr.isForeign) {
        lines.push('    @ManyToOne');
        lines.push(`    @JoinColumn(name = "${attr.name}")`);
      }
      const javaType = toJavaType(attr.type);
      const fieldName = toCamelCase(attr.name);
      lines.push(`    private ${javaType} ${fieldName};`);
      lines.push('');
    }

    // Relationship fields from edges
    for (const edge of outEdges) {
      const target = entities.find(e => e.id === edge.target);
      if (!target) continue;
      const targetData = target.data as unknown as ErNodeData;
      const targetClass = toPascalCase(targetData.label);
      const rel = (edge.data?.relationship as string) || 'ManyToOne';

      if (rel === 'OneToMany') {
        lines.push(`    @OneToMany(mappedBy = "${toCamelCase(d.label)}")`);
        lines.push(`    private List<${targetClass}> ${toCamelCase(targetData.label)}List;`);
      } else if (rel === 'ManyToMany') {
        lines.push(`    @ManyToMany`);
        lines.push(`    @JoinTable(name = "${d.label.toLowerCase()}_${targetData.label.toLowerCase()}")`);
        lines.push(`    private List<${targetClass}> ${toCamelCase(targetData.label)}List;`);
      } else {
        lines.push(`    @ManyToOne`);
        lines.push(`    @JoinColumn(name = "${toCamelCase(targetData.label)}_id")`);
        lines.push(`    private ${targetClass} ${toCamelCase(targetData.label)};`);
      }
      lines.push('');
    }

    // Getters and setters
    for (const attr of d.attributes) {
      const javaType = toJavaType(attr.type);
      const fieldName = toCamelCase(attr.name);
      const capField = toPascalCase(attr.name);
      lines.push(`    public ${javaType} get${capField}() { return ${fieldName}; }`);
      lines.push(`    public void set${capField}(${javaType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`);
    }

    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

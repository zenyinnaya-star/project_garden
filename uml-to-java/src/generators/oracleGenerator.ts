import type { Node, Edge } from '@xyflow/react';
import type { ErNodeData } from '../types';

const ORACLE_TYPE_MAP: Record<string, string> = {
  INT: 'NUMBER(10)',
  INTEGER: 'NUMBER(10)',
  BIGINT: 'NUMBER(19)',
  SMALLINT: 'NUMBER(5)',
  TINYINT: 'NUMBER(3)',
  SERIAL: 'NUMBER(10)',
  BIGSERIAL: 'NUMBER(19)',
  VARCHAR: 'VARCHAR2(255)',
  VARCHAR2: 'VARCHAR2(255)',
  CHAR: 'CHAR(10)',
  TEXT: 'CLOB',
  LONGTEXT: 'CLOB',
  MEDIUMTEXT: 'CLOB',
  BOOLEAN: 'NUMBER(1)',
  BOOL: 'NUMBER(1)',
  FLOAT: 'BINARY_FLOAT',
  DOUBLE: 'BINARY_DOUBLE',
  DECIMAL: 'NUMBER(18,2)',
  NUMERIC: 'NUMBER(18,2)',
  MONEY: 'NUMBER(18,2)',
  DATE: 'DATE',
  DATETIME: 'TIMESTAMP',
  TIMESTAMP: 'TIMESTAMP',
  TIME: 'TIMESTAMP',
  BLOB: 'BLOB',
  CLOB: 'CLOB',
  JSON: 'CLOB',
  UUID: 'VARCHAR2(36)',
  BYTEA: 'BLOB',
};

function toOracleType(sqlType: string): string {
  const base = sqlType.toUpperCase().split('(')[0].trim();
  if (sqlType.includes('(')) {
    const size = sqlType.slice(sqlType.indexOf('('));
    if (base === 'VARCHAR' || base === 'VARCHAR2') return `VARCHAR2${size}`;
    if (base === 'CHAR') return `CHAR${size}`;
    if (base === 'NUMBER' || base === 'DECIMAL' || base === 'NUMERIC') return `NUMBER${size}`;
  }
  return ORACLE_TYPE_MAP[base] ?? 'VARCHAR2(255)';
}

function pad(s: string, n: number) {
  return s + ' '.repeat(Math.max(0, n - s.length));
}

export function generateOracleDDL(nodes: Node[], edges: Edge[]): string {
  const entities = nodes.filter(n => n.type === 'erNode');
  if (entities.length === 0) {
    return '-- No ER entities defined yet.\n-- Drag Entity blocks onto the canvas to begin.';
  }

  const entityMap = new Map(
    entities.map(n => [n.id, n.data as unknown as ErNodeData])
  );

  const lines: string[] = [
    '-- ============================================================',
    '-- Oracle DDL  —  Generated from ER Diagram',
    '-- Compatible with Oracle Database 12c+',
    `-- Generated: ${new Date().toISOString().slice(0, 10)}`,
    '-- ============================================================',
    '',
    '/* Uncomment to drop existing tables (reverse dependency order):',
  ];

  for (const node of [...entities].reverse()) {
    const d = entityMap.get(node.id)!;
    lines.push(`   DROP TABLE ${d.label.toUpperCase()} CASCADE CONSTRAINTS PURGE;`);
  }
  lines.push('*/');
  lines.push('');

  for (const node of entities) {
    const d = entityMap.get(node.id)!;
    const tbl = d.label.toUpperCase();
    const outEdges = edges.filter(e => e.source === node.id);

    lines.push(`CREATE TABLE ${tbl}`);
    lines.push('(');

    const colDefs: string[] = [];

    for (const attr of d.attributes) {
      const col = pad(attr.name.toUpperCase(), 24);
      const typ = pad(toOracleType(attr.type), 26);
      if (attr.isPrimary) {
        colDefs.push(`  ${col}${typ}GENERATED ALWAYS AS IDENTITY`);
      } else {
        colDefs.push(`  ${col}${typ}`.trimEnd());
      }
    }

    // FK columns from edges not already listed
    for (const edge of outEdges) {
      const td = entityMap.get(edge.target);
      if (!td) continue;
      const fkCol = `${td.label.toUpperCase()}_ID`;
      if (!d.attributes.find(a => a.name.toUpperCase() === fkCol)) {
        colDefs.push(`  ${pad(fkCol, 24)}NUMBER(10)`);
      }
    }

    // PK constraint
    const pkCols = d.attributes.filter(a => a.isPrimary).map(a => a.name.toUpperCase());
    if (pkCols.length > 0) {
      colDefs.push(`  CONSTRAINT ${pad('PK_' + tbl, 32)}PRIMARY KEY (${pkCols.join(', ')})`);
    }

    // FK constraints
    for (const edge of outEdges) {
      const td = entityMap.get(edge.target);
      if (!td) continue;
      const refTbl = td.label.toUpperCase();
      const fkCol = `${refTbl}_ID`;
      const refPk = (td.attributes ?? []).find(a => a.isPrimary)?.name.toUpperCase() ?? 'ID';
      const rel = (edge.data?.relationship as string) ?? 'ManyToOne';
      const onDelete = rel === 'composition' ? '\n    ON DELETE CASCADE' : '';
      colDefs.push(
        `  CONSTRAINT ${pad('FK_' + tbl + '_' + refTbl, 32)}` +
        `FOREIGN KEY (${fkCol})\n    REFERENCES ${refTbl}(${refPk})${onDelete}`
      );
    }

    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');

    // Table & column comments
    lines.push(`COMMENT ON TABLE ${tbl} IS '${d.label}';`);
    for (const attr of d.attributes) {
      const tag = attr.isPrimary ? ' [PK]' : attr.isForeign ? ' [FK]' : '';
      lines.push(`COMMENT ON COLUMN ${tbl}.${attr.name.toUpperCase()} IS '${attr.name}${tag}';`);
    }
    lines.push('');
  }

  // FK indexes
  const idxLines: string[] = [];
  for (const node of entities) {
    const d = entityMap.get(node.id)!;
    const tbl = d.label.toUpperCase();
    for (const edge of edges.filter(e => e.source === node.id)) {
      const td = entityMap.get(edge.target);
      if (!td) continue;
      const refTbl = td.label.toUpperCase();
      idxLines.push(`CREATE INDEX IDX_${tbl}_${refTbl}_ID ON ${tbl}(${refTbl}_ID);`);
    }
  }
  if (idxLines.length > 0) {
    lines.push('-- Indexes on foreign-key columns');
    lines.push(...idxLines);
    lines.push('');
  }

  lines.push('COMMIT;');
  return lines.join('\n');
}

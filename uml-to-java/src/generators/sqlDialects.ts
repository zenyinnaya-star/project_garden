import type { Node, Edge } from '@xyflow/react';
import type { ErNodeData } from '../types';

export type SqlDialect = 'oracle' | 'postgresql' | 'mysql' | 'sqlite';

/* ── type maps per dialect ─────────────────────────────────────── */
type TMap = Record<string, string>;

const ORACLE: TMap = {
  INT:'NUMBER(10)', INTEGER:'NUMBER(10)', BIGINT:'NUMBER(19)', SMALLINT:'NUMBER(5)',
  TINYINT:'NUMBER(3)', SERIAL:'NUMBER(10)', BIGSERIAL:'NUMBER(19)',
  VARCHAR:'VARCHAR2(255)', VARCHAR2:'VARCHAR2(255)', CHAR:'CHAR(10)',
  TEXT:'CLOB', LONGTEXT:'CLOB', MEDIUMTEXT:'CLOB', BOOLEAN:'NUMBER(1)',
  BOOL:'NUMBER(1)', FLOAT:'BINARY_FLOAT', DOUBLE:'BINARY_DOUBLE',
  DECIMAL:'NUMBER(18,2)', NUMERIC:'NUMBER(18,2)', MONEY:'NUMBER(18,2)',
  DATE:'DATE', DATETIME:'TIMESTAMP', TIMESTAMP:'TIMESTAMP', TIME:'TIMESTAMP',
  BLOB:'BLOB', CLOB:'CLOB', JSON:'CLOB', UUID:'VARCHAR2(36)', BYTEA:'BLOB',
  NUMBER:'NUMBER',
};
const PG: TMap = {
  INT:'INTEGER', INTEGER:'INTEGER', BIGINT:'BIGINT', SMALLINT:'SMALLINT',
  TINYINT:'SMALLINT', SERIAL:'INTEGER', BIGSERIAL:'BIGINT',
  VARCHAR:'VARCHAR(255)', VARCHAR2:'VARCHAR(255)', CHAR:'CHAR(10)',
  TEXT:'TEXT', LONGTEXT:'TEXT', MEDIUMTEXT:'TEXT', BOOLEAN:'BOOLEAN',
  BOOL:'BOOLEAN', FLOAT:'REAL', DOUBLE:'DOUBLE PRECISION',
  DECIMAL:'NUMERIC(18,2)', NUMERIC:'NUMERIC(18,2)', MONEY:'NUMERIC(18,2)',
  DATE:'DATE', DATETIME:'TIMESTAMP', TIMESTAMP:'TIMESTAMP', TIME:'TIME',
  BLOB:'BYTEA', CLOB:'TEXT', JSON:'JSONB', UUID:'UUID', BYTEA:'BYTEA',
  NUMBER:'NUMERIC',
};
const MYSQL: TMap = {
  INT:'INT', INTEGER:'INT', BIGINT:'BIGINT', SMALLINT:'SMALLINT',
  TINYINT:'TINYINT', SERIAL:'INT', BIGSERIAL:'BIGINT',
  VARCHAR:'VARCHAR(255)', VARCHAR2:'VARCHAR(255)', CHAR:'CHAR(10)',
  TEXT:'TEXT', LONGTEXT:'LONGTEXT', MEDIUMTEXT:'MEDIUMTEXT', BOOLEAN:'TINYINT(1)',
  BOOL:'TINYINT(1)', FLOAT:'FLOAT', DOUBLE:'DOUBLE',
  DECIMAL:'DECIMAL(18,2)', NUMERIC:'DECIMAL(18,2)', MONEY:'DECIMAL(18,2)',
  DATE:'DATE', DATETIME:'DATETIME', TIMESTAMP:'TIMESTAMP', TIME:'TIME',
  BLOB:'LONGBLOB', CLOB:'LONGTEXT', JSON:'JSON', UUID:'VARCHAR(36)', BYTEA:'LONGBLOB',
  NUMBER:'DECIMAL',
};
const SQLITE: TMap = {
  INT:'INTEGER', INTEGER:'INTEGER', BIGINT:'INTEGER', SMALLINT:'INTEGER',
  TINYINT:'INTEGER', SERIAL:'INTEGER', BIGSERIAL:'INTEGER',
  VARCHAR:'TEXT', VARCHAR2:'TEXT', CHAR:'TEXT',
  TEXT:'TEXT', LONGTEXT:'TEXT', MEDIUMTEXT:'TEXT', BOOLEAN:'INTEGER',
  BOOL:'INTEGER', FLOAT:'REAL', DOUBLE:'REAL',
  DECIMAL:'REAL', NUMERIC:'REAL', MONEY:'REAL',
  DATE:'TEXT', DATETIME:'TEXT', TIMESTAMP:'TEXT', TIME:'TEXT',
  BLOB:'BLOB', CLOB:'TEXT', JSON:'TEXT', UUID:'TEXT', BYTEA:'BLOB',
  NUMBER:'NUMERIC',
};

const MAPS: Record<SqlDialect, TMap> = { oracle: ORACLE, postgresql: PG, mysql: MYSQL, sqlite: SQLITE };

function mapType(raw: string, dialect: SqlDialect): string {
  const base = raw.toUpperCase().split('(')[0].trim();
  const hasSz = raw.includes('(');
  const sz = hasSz ? raw.slice(raw.indexOf('(')) : '';
  const map = MAPS[dialect];

  if (hasSz) {
    if (base === 'VARCHAR' || base === 'VARCHAR2') {
      return dialect === 'oracle' ? `VARCHAR2${sz}` : dialect === 'sqlite' ? 'TEXT' : `VARCHAR${sz}`;
    }
    if (base === 'CHAR') return `CHAR${sz}`;
    if (['NUMBER','DECIMAL','NUMERIC'].includes(base)) {
      return dialect === 'oracle' ? `NUMBER${sz}` : dialect === 'sqlite' ? 'REAL' : `DECIMAL${sz}`;
    }
  }
  return map[base] ?? (dialect === 'oracle' ? 'VARCHAR2(255)' : dialect === 'sqlite' ? 'TEXT' : 'VARCHAR(255)');
}

function pad(s: string, n: number) { return s + ' '.repeat(Math.max(0, n - s.length)); }

function q(name: string, dialect: SqlDialect): string {
  if (dialect === 'mysql') return `\`${name}\``;
  if (dialect === 'sqlite') return `"${name}"`;
  return name.toUpperCase();
}

function identity(col: string, dialect: SqlDialect): string {
  switch (dialect) {
    case 'oracle':     return `${col}GENERATED ALWAYS AS IDENTITY`;
    case 'postgresql': return `${col}GENERATED ALWAYS AS IDENTITY`;
    case 'mysql':      return `${col}AUTO_INCREMENT`;
    case 'sqlite':     return `${col}AUTOINCREMENT`;
  }
}

/* ── main generator ────────────────────────────────────────────── */
export function generateDDL(nodes: Node[], edges: Edge[], dialect: SqlDialect): string {
  const entities = nodes.filter(n => n.type === 'erNode');
  if (entities.length === 0) {
    return `-- No ER entities defined yet.\n-- Drag Entity blocks onto the canvas to begin.`;
  }

  const entityMap = new Map(entities.map(n => [n.id, n.data as unknown as ErNodeData]));
  const now = new Date().toISOString().slice(0, 10);

  const dialectLabels: Record<SqlDialect, string> = {
    oracle: 'Oracle Database 12c+',
    postgresql: 'PostgreSQL 13+',
    mysql: 'MySQL 8.0+ / MariaDB 10.5+',
    sqlite: 'SQLite 3.x',
  };

  const lines: string[] = [
    `-- ============================================================`,
    `-- ${dialectLabels[dialect]}  —  Generated from ER Diagram`,
    `-- Generated: ${now}`,
    `-- ============================================================`,
    '',
  ];

  /* DROP stubs (Oracle / PG / MySQL) */
  if (dialect !== 'sqlite') {
    lines.push('/* Drop existing tables (uncomment if needed):');
    for (const node of [...entities].reverse()) {
      const d = entityMap.get(node.id)!;
      const tbl = q(d.label, dialect);
      if (dialect === 'oracle')     lines.push(`   DROP TABLE ${tbl} CASCADE CONSTRAINTS PURGE;`);
      else if (dialect === 'postgresql') lines.push(`   DROP TABLE IF EXISTS ${tbl} CASCADE;`);
      else                           lines.push(`   DROP TABLE IF EXISTS ${tbl};`);
    }
    lines.push('*/');
    lines.push('');
  }

  for (const node of entities) {
    const d = entityMap.get(node.id)!;
    const tbl = q(d.label, dialect);
    const tblUpper = d.label.toUpperCase();
    const outEdges = edges.filter(e => e.source === node.id);

    lines.push(`CREATE TABLE ${tbl}`);
    lines.push('(');

    const colDefs: string[] = [];

    for (const attr of d.attributes) {
      const colName = q(attr.name, dialect);
      const colPadded = pad(colName, 26);
      const typRaw = mapType(attr.type, dialect);

      if (attr.isPrimary) {
        if (dialect === 'sqlite') {
          // SQLite: INTEGER PRIMARY KEY AUTOINCREMENT on same line
          colDefs.push(`  ${colPadded}INTEGER     PRIMARY KEY AUTOINCREMENT`);
        } else {
          const typPadded = pad(typRaw, 24);
          colDefs.push(`  ${identity(colPadded + typPadded, dialect)}`);
        }
      } else {
        colDefs.push(`  ${colPadded}${typRaw}`);
      }
    }

    /* FK columns */
    for (const edge of outEdges) {
      const td = entityMap.get(edge.target);
      if (!td) continue;
      const fkColName = `${td.label.toUpperCase()}_ID`;
      if (!d.attributes.find(a => a.name.toUpperCase() === fkColName)) {
        const fkType = dialect === 'oracle' ? 'NUMBER(10)' : dialect === 'sqlite' ? 'INTEGER' : 'INT';
        colDefs.push(`  ${pad(q(fkColName, dialect), 26)}${fkType}`);
      }
    }

    /* PK constraint (not for SQLite — handled inline above) */
    if (dialect !== 'sqlite') {
      const pkCols = d.attributes.filter(a => a.isPrimary).map(a => q(a.name, dialect));
      if (pkCols.length > 0) {
        const cname = dialect === 'oracle' ? `CONSTRAINT ${pad('PK_' + tblUpper, 30)}` : '';
        colDefs.push(`  ${cname}PRIMARY KEY (${pkCols.join(', ')})`);
      }

      /* FK constraints */
      for (const edge of outEdges) {
        const td = entityMap.get(edge.target);
        if (!td) continue;
        const refTbl = q(td.label, dialect);
        const fkCol = q(`${td.label.toUpperCase()}_ID`, dialect);
        const refPk = q((td.attributes ?? []).find(a => a.isPrimary)?.name ?? 'id', dialect);
        const rel = (edge.data?.relationship as string) ?? '';
        const onDel = rel === 'composition' ? '\n    ON DELETE CASCADE' : '';

        if (dialect === 'oracle') {
          colDefs.push(
            `  CONSTRAINT ${pad('FK_' + tblUpper + '_' + td.label.toUpperCase(), 30)}` +
            `FOREIGN KEY (${fkCol})\n    REFERENCES ${refTbl}(${refPk})${onDel}`
          );
        } else {
          colDefs.push(`  FOREIGN KEY (${fkCol}) REFERENCES ${refTbl}(${refPk})${onDel}`);
        }
      }
    }

    lines.push(colDefs.join(',\n'));

    if (dialect === 'mysql') {
      lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
    } else {
      lines.push(');');
    }
    lines.push('');

    /* Comments */
    if (dialect === 'oracle' || dialect === 'postgresql') {
      lines.push(`COMMENT ON TABLE ${tbl} IS '${d.label}';`);
      for (const attr of d.attributes) {
        const tag = attr.isPrimary ? ' [PK]' : '';
        lines.push(`COMMENT ON COLUMN ${tbl}.${q(attr.name, dialect)} IS '${attr.name}${tag}';`);
      }
      lines.push('');
    }
  }

  /* Indexes on FK columns */
  const idxLines: string[] = [];
  for (const node of entities) {
    const d = entityMap.get(node.id)!;
    const tbl = q(d.label, dialect);
    const tblUpper = d.label.toUpperCase();
    for (const edge of edges.filter(e => e.source === node.id)) {
      const td = entityMap.get(edge.target);
      if (!td) continue;
      const fkCol = q(`${td.label.toUpperCase()}_ID`, dialect);
      const idxName = dialect === 'mysql'
        ? `idx_${d.label.toLowerCase()}_${td.label.toLowerCase()}_id`
        : `IDX_${tblUpper}_${td.label.toUpperCase()}_ID`;
      idxLines.push(`CREATE INDEX ${idxName} ON ${tbl}(${fkCol});`);
    }
  }
  if (idxLines.length > 0) {
    lines.push('-- Foreign-key indexes');
    lines.push(...idxLines);
    lines.push('');
  }

  if (dialect !== 'sqlite') lines.push('COMMIT;');
  return lines.join('\n');
}

import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

interface ParsedColumn {
  name: string;
  type: string;
  isPrimary: boolean;
  isForeign: boolean;
  refTable?: string;
  refCol?: string;
}

interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
}

function parseCreateTable(sql: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  // Normalize line endings and strip inline comments
  const clean = sql.replace(/--[^\n]*/g, '').replace(/\r\n/g, '\n');

  const tableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`[\]]?(\w+)["`[\]]?\s*\(([\s\S]*?)\)\s*;/gi;
  let tm: RegExpExecArray | null;

  while ((tm = tableRe.exec(clean)) !== null) {
    const tableName = tm[1];
    const body = tm[2];

    const pkCols = new Set<string>();
    const fkMap = new Map<string, { table: string; col: string }>();

    // Table-level CONSTRAINT PRIMARY KEY
    const pkRe = /(?:CONSTRAINT\s+\w+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/gi;
    let pm: RegExpExecArray | null;
    while ((pm = pkRe.exec(body)) !== null) {
      pm[1].split(',').map(s => s.trim().replace(/["`[\]]/g, '').toUpperCase()).forEach(c => pkCols.add(c));
    }

    // Table-level CONSTRAINT FOREIGN KEY
    const fkRe = /(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["`[\]]?(\w+)["`[\]]?\s*\(([^)]+)\)/gi;
    let fm: RegExpExecArray | null;
    while ((fm = fkRe.exec(body)) !== null) {
      const col = fm[1].trim().replace(/["`[\]]/g, '').toUpperCase();
      fkMap.set(col, { table: fm[2], col: fm[3].trim().replace(/["`[\]]/g, '') });
    }

    const columns: ParsedColumn[] = [];
    // Split on commas but respect nested parens
    const parts: string[] = [];
    let depth = 0, cur = '';
    for (const ch of body) {
      if (ch === '(') { depth++; cur += ch; }
      else if (ch === ')') { depth--; cur += ch; }
      else if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());

    for (const part of parts) {
      const upper = part.trimStart().toUpperCase();
      // Skip table-level constraint lines
      if (/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|INDEX|KEY|CHECK)/.test(upper)) continue;

      // col_name TYPE [extras...]
      const cm = part.match(/^["`[\]]?(\w+)["`[\]]?\s+([A-Z_][A-Z0-9_]*(?:\([^)]*\))?)(.*)/i);
      if (!cm) continue;
      const colName = cm[1];
      const colType = cm[2].toUpperCase();
      const rest = cm[3].toUpperCase();

      if (['PRIMARY', 'CONSTRAINT', 'UNIQUE', 'KEY', 'CHECK', 'FOREIGN', 'INDEX'].includes(colName.toUpperCase())) continue;

      const inlinePk = /PRIMARY\s+KEY/.test(rest) || /AUTO_INCREMENT|AUTOINCREMENT|SERIAL|IDENTITY/.test(rest);
      const inlineFk = /REFERENCES/.test(rest);

      if (inlinePk) pkCols.add(colName.toUpperCase());

      let refTable = '';
      let refCol = 'ID';
      if (inlineFk) {
        const rm = rest.match(/REFERENCES\s+["`[\]]?(\w+)["`[\]]?\s*(?:\(([^)]+)\))?/i);
        if (rm) { refTable = rm[1]; refCol = rm[2]?.trim() ?? 'ID'; }
      } else if (fkMap.has(colName.toUpperCase())) {
        const ref = fkMap.get(colName.toUpperCase())!;
        refTable = ref.table; refCol = ref.col;
      }

      columns.push({
        name: colName,
        type: colType,
        isPrimary: pkCols.has(colName.toUpperCase()) && !inlineFk,
        isForeign: inlineFk || fkMap.has(colName.toUpperCase()),
        refTable: refTable || undefined,
        refCol: refTable ? refCol : undefined,
      });
    }

    if (columns.length > 0) tables.push({ name: tableName, columns });
  }

  return tables;
}

export function parseSqlToNodes(sql: string): { nodes: Node[]; edges: Edge[] } {
  const tables = parseCreateTable(sql);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const idMap = new Map<string, string>(); // tableName.upper → nodeId

  tables.forEach((table, i) => {
    const id = `sql_${i}`;
    idMap.set(table.name.toUpperCase(), id);
    nodes.push({
      id,
      type: 'erNode',
      position: { x: (i % 3) * 300 + 60, y: Math.floor(i / 3) * 260 + 60 },
      data: {
        label: table.name,
        attributes: table.columns.map(c => ({
          name: c.name,
          type: c.type,
          isPrimary: c.isPrimary,
          isForeign: c.isForeign,
        })),
      },
    });
  });

  tables.forEach((table, i) => {
    for (const col of table.columns) {
      if (!col.refTable) continue;
      const targetId = idMap.get(col.refTable.toUpperCase());
      if (!targetId) continue;
      edges.push({
        id: `fk_${i}_${col.name}`,
        source: `sql_${i}`,
        target: targetId,
        label: col.name,
        data: { relationship: 'ManyToOne' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        style: { stroke: '#64748b', strokeWidth: 1.5 },
      });
    }
  });

  return { nodes, edges };
}

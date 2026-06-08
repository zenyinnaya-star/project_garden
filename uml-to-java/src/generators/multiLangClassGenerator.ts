import type { Node, Edge } from '@xyflow/react';
import type { ClassNodeData } from '../types';
import type { OopLang } from '../types';

// ── Type mappers ──────────────────────────────────────────────────────
type TMap = Record<string, string>;

function makeMapper(map: TMap, listFn: (inner: string) => string) {
  return function m(t: string): string {
    const match = t.match(/^List<(.+)>$/);
    if (match) return listFn(match[1]);
    return map[t] ?? t;
  };
}

const PY   = makeMapper({ int:'int', long:'int', Long:'int', Integer:'int', Short:'int', double:'float', float:'float', Double:'float', Float:'float', boolean:'bool', Boolean:'bool', String:'str', string:'str', void:'None', Object:'Any' }, i => `list[${i}]`);
const CPP  = makeMapper({ int:'int', long:'long', Long:'long long', Integer:'int', double:'double', float:'float', boolean:'bool', Boolean:'bool', String:'std::string', string:'std::string', void:'void', Object:'void*' }, i => `std::vector<${i}>`);
const CS   = makeMapper({ int:'int', long:'long', Long:'long', Integer:'int', double:'double', float:'float', boolean:'bool', Boolean:'bool', String:'string', string:'string', void:'void', Object:'object' }, i => `List<${i}>`);
const TS   = makeMapper({ int:'number', long:'number', Long:'number', Integer:'number', double:'number', float:'number', boolean:'boolean', Boolean:'boolean', String:'string', string:'string', void:'void', Object:'any' }, i => `${i}[]`);
const KT   = makeMapper({ int:'Int', long:'Long', Long:'Long', Integer:'Int', double:'Double', float:'Float', boolean:'Boolean', Boolean:'Boolean', String:'String', string:'String', void:'Unit', Object:'Any' }, i => `List<${i}>`);
const GO   = makeMapper({ int:'int', long:'int64', Long:'int64', Integer:'int', double:'float64', float:'float32', boolean:'bool', Boolean:'bool', String:'string', string:'string', void:'', Object:'interface{}' }, i => `[]${i}`);
const SW   = makeMapper({ int:'Int', long:'Int64', Long:'Int64', Integer:'Int', double:'Double', float:'Float', boolean:'Bool', Boolean:'Bool', String:'String', string:'String', void:'Void', Object:'Any' }, i => `[${i}]`);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PHP  = makeMapper({ int:'int', long:'int', Long:'int', Integer:'int', double:'float', float:'float', boolean:'bool', Boolean:'bool', String:'string', string:'string', void:'void', Object:'mixed' }, (_i) => `array`);
const RB   = (_t: string) => _t; // Ruby is dynamic
const JS   = TS; // same as TS for type hints (JSDoc)


// ── Name convention helpers ───────────────────────────────────────────
const snake = (s: string) => s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/,'');
const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Default return value helpers ──────────────────────────────────────
function javaDefault(t: string) {
  const d: TMap = { int:'0', long:'0L', double:'0.0', float:'0.0f', boolean:'false', String:'""' };
  return d[t] ?? 'null';
}
function pyDefault(t: string) {
  const d: TMap = { int:'0', float:'0.0', bool:'False', str:'""' };
  return d[t] ?? 'None';
}
function tsDefault(t: string) {
  const d: TMap = { number:'0', boolean:'false', string:'""' };
  return d[t] ?? 'null';
}
function cppDefault(t: string) {
  const d: TMap = { int:'0', 'long long':'0', double:'0.0', float:'0.0f', bool:'false', 'std::string':'""' };
  return d[t] ?? '{}';
}
function csDefault(t: string) {
  const d: TMap = { int:'0', long:'0', double:'0.0', float:'0.0f', bool:'false', string:'""' };
  return d[t] ?? 'default';
}
function ktDefault(t: string) {
  const d: TMap = { Int:'0', Long:'0L', Double:'0.0', Float:'0.0f', Boolean:'false', String:'""' };
  return d[t] ?? 'null';
}

// ── Per-language generators ───────────────────────────────────────────

function getRelations(node: Node, nodes: Node[], edges: Edge[]) {
  const classes = nodes.filter(n => n.type === 'classNode');
  const superClass = edges
    .filter(e => e.source === node.id && e.data?.relationship === 'extends')
    .map(e => classes.find(c => c.id === e.target))
    .filter(Boolean)
    .map(c => (c!.data as unknown as ClassNodeData).label)[0] ?? '';
  const ifaces = edges
    .filter(e => e.source === node.id && e.data?.relationship === 'implements')
    .map(e => classes.find(c => c.id === e.target))
    .filter(Boolean)
    .map(c => (c!.data as unknown as ClassNodeData).label);
  return { superClass, ifaces };
}

// ── Java ──────────────────────────────────────────────────────────────
function genJava(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = [];
  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const kw = d.type === 'interface' ? 'interface' : d.type === 'abstract' ? 'abstract class' : 'class';
    let decl = `public ${kw} ${d.label}`;
    if (superClass) decl += ` extends ${superClass}`;
    if (ifaces.length) decl += ` implements ${ifaces.join(', ')}`;
    out.push(decl + ' {');
    if (d.fields.length) {
      d.fields.forEach(f => out.push(`    ${f.visibility} ${f.type} ${f.name};`));
      out.push('');
    }
    if (d.type !== 'interface') {
      const priv = d.fields.filter(f => f.visibility === 'private');
      out.push(`    public ${d.label}(${priv.map(f => `${f.type} ${f.name}`).join(', ')}) {`);
      priv.forEach(f => out.push(`        this.${f.name} = ${f.name};`));
      out.push('    }', '');
    }
    d.methods.forEach(m => {
      const abs = m.isAbstract && d.type === 'abstract' ? 'abstract ' : '';
      const sig = `    ${m.visibility} ${abs}${m.returnType} ${m.name}(${m.params})`;
      if (d.type === 'interface' || m.isAbstract) { out.push(sig + ';'); }
      else {
        out.push(sig + ' {');
        if (m.returnType !== 'void') out.push(`        return ${javaDefault(m.returnType)};`);
        out.push('    }');
      }
    });
    out.push('}', '');
  }
  return out.join('\n');
}

// ── Python ────────────────────────────────────────────────────────────
function genPython(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const hasAbstract = classes.some(n => (n.data as unknown as ClassNodeData).type !== 'class');
  const out: string[] = ['# Generated by UML→Code'];
  if (hasAbstract) out.push('from abc import ABC, abstractmethod');
  out.push('from typing import Any, Optional', '');

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const bases = [superClass, ...ifaces].filter(Boolean);
    const isIface = d.type === 'interface';
    const isAbs = d.type === 'abstract';
    const baseStr = bases.length ? bases.join(', ') : (isIface || isAbs) ? 'ABC' : '';

    out.push(`class ${d.label}${baseStr ? `(${baseStr})` : ''}:`);

    if (d.fields.length) {
      const params = d.fields.map(f => `${f.name}: ${PY(f.type)} = None`).join(', ');
      out.push(`    def __init__(self, ${params}):`);
      d.fields.forEach(f => out.push(`        self.${f.name}: ${PY(f.type)} = ${f.name}`));
      out.push('');
    }

    d.methods.forEach(m => {
      const nm = snake(m.name);
      const ret = PY(m.returnType);
      if (isIface || m.isAbstract) out.push('    @abstractmethod');
      out.push(`    def ${nm}(self) -> ${ret}:`);
      out.push(isIface || m.isAbstract ? '        ...' : `        return ${pyDefault(ret)}`);
      out.push('');
    });

    if (!d.fields.length && !d.methods.length) out.push('    pass');
    out.push('');
  }
  return out.join('\n');
}

// ── C++ ───────────────────────────────────────────────────────────────
function genCpp(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['// Generated by UML→Code', '#pragma once', '#include <string>', '#include <vector>', '#include <memory>', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const parents = [superClass, ...ifaces].filter(Boolean);
    const isIface = d.type === 'interface';

    // Declaration
    const inheritance = parents.length ? ` : ${parents.map(p => `public ${p}`).join(', ')}` : '';
    out.push(`class ${d.label}${inheritance} {`);
    out.push('public:');

    // Constructor declaration
    const priv = d.fields.filter(f => f.visibility === 'private');
    out.push(`    ${d.label}(${priv.map(f => `${CPP(f.type)} ${f.name} = ${cppDefault(CPP(f.type))}`).join(', ')});`);

    // Methods
    d.methods.forEach(m => {
      const ret = CPP(m.returnType);
      const virt = isIface || m.isAbstract ? 'virtual ' : '';
      const pure = isIface || m.isAbstract ? ' = 0' : '';
      const constQ = m.returnType !== 'void' ? ' const' : '';
      out.push(`    ${virt}${ret} ${m.name}(${m.params})${constQ}${pure};`);
    });

    if (d.fields.some(f => f.visibility !== 'public')) {
      out.push('', 'private:');
      d.fields.filter(f => f.visibility !== 'public').forEach(f => out.push(`    ${CPP(f.type)} ${f.name};`));
    }
    if (d.fields.some(f => f.visibility === 'public')) {
      out.push('', 'public:');
      d.fields.filter(f => f.visibility === 'public').forEach(f => out.push(`    ${CPP(f.type)} ${f.name};`));
    }

    out.push('};', '');

    // Implementation
    out.push(`// ── ${d.label} implementation ──`);
    out.push(`${d.label}::${d.label}(${priv.map(f => `${CPP(f.type)} ${f.name}`).join(', ')})`);
    if (priv.length) {
      out.push(`    : ${priv.map(f => `${f.name}(${f.name})`).join(', ')} {}`);
    } else {
      out.push('{}');
    }
    out.push('');

    d.methods.filter(m => !isIface && !m.isAbstract).forEach(m => {
      const ret = CPP(m.returnType);
      const constQ = m.returnType !== 'void' ? ' const' : '';
      out.push(`${ret} ${d.label}::${m.name}(${m.params})${constQ} {`);
      if (ret !== 'void') out.push(`    return ${cppDefault(ret)};`);
      out.push('}', '');
    });
  }
  return out.join('\n');
}

// ── C# ────────────────────────────────────────────────────────────────
function genCsharp(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['// Generated by UML→Code', 'using System;', 'using System.Collections.Generic;', '', 'namespace Generated {'];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const parents = [superClass, ...ifaces].filter(Boolean);
    const isIface = d.type === 'interface';
    const isAbs = d.type === 'abstract';
    const kw = isIface ? 'interface' : isAbs ? 'abstract class' : 'class';
    const inheritance = parents.length ? ` : ${parents.join(', ')}` : '';

    out.push(`    public ${kw} ${d.label}${inheritance} {`);
    d.fields.forEach(f => out.push(`        ${f.visibility} ${CS(f.type)} ${pascal(f.name)} { get; set; }`));

    if (!isIface && d.fields.length) {
      out.push('');
      const priv = d.fields.filter(f => f.visibility === 'private');
      out.push(`        public ${d.label}(${priv.map(f => `${CS(f.type)} ${f.name}`).join(', ')}) {`);
      priv.forEach(f => out.push(`            this.${pascal(f.name)} = ${f.name};`));
      out.push('        }');
    }

    d.methods.forEach(m => {
      const abs = isAbs && m.isAbstract ? 'abstract ' : '';
      const virt = isIface ? '' : (!m.isAbstract ? 'virtual ' : '');
      const ret = CS(m.returnType);
      out.push('');
      if (isIface || m.isAbstract) {
        out.push(`        ${m.visibility} ${abs}${ret} ${pascal(m.name)}(${m.params});`);
      } else {
        out.push(`        public ${virt}${ret} ${pascal(m.name)}(${m.params}) {`);
        if (ret !== 'void') out.push(`            return ${csDefault(ret)};`);
        out.push('        }');
      }
    });

    out.push('    }', '');
  }
  out.push('}');
  return out.join('\n');
}

// ── TypeScript ────────────────────────────────────────────────────────
function genTypeScript(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['// Generated by UML→Code', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const isIface = d.type === 'interface';

    if (isIface) {
      out.push(`export interface ${d.label}${superClass ? ` extends ${superClass}` : ''} {`);
      d.methods.forEach(m => out.push(`    ${m.name}(${m.params}): ${TS(m.returnType)};`));
      out.push('}', '');
      continue;
    }

    const ext = superClass ? ` extends ${superClass}` : '';
    const impl = ifaces.length ? ` implements ${ifaces.join(', ')}` : '';
    const abs = d.type === 'abstract' ? 'abstract ' : '';
    out.push(`export ${abs}class ${d.label}${ext}${impl} {`);

    d.fields.forEach(f => {
      const access = f.visibility === 'public' ? 'public' : f.visibility === 'protected' ? 'protected' : 'private';
      out.push(`    ${access} ${f.name}: ${TS(f.type)};`);
    });

    if (d.fields.length) {
      out.push('');
      const priv = d.fields.filter(f => f.visibility === 'private');
      out.push(`    constructor(${priv.map(f => `${f.name}: ${TS(f.type)}`).join(', ')}) {`);
      priv.forEach(f => out.push(`        this.${f.name} = ${f.name};`));
      out.push('    }');
    }

    d.methods.forEach(m => {
      const ret = TS(m.returnType);
      const absKw = m.isAbstract && d.type === 'abstract' ? 'abstract ' : '';
      out.push('');
      if (m.isAbstract) {
        out.push(`    ${absKw}${m.name}(${m.params}): ${ret};`);
      } else {
        out.push(`    ${m.name}(${m.params}): ${ret} {`);
        if (ret !== 'void') out.push(`        return ${tsDefault(ret)};`);
        out.push('    }');
      }
    });

    out.push('}', '');
  }
  return out.join('\n');
}

// ── JavaScript ────────────────────────────────────────────────────────
function genJavaScript(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['// Generated by UML→Code', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass } = getRelations(node, nodes, edges);

    out.push(`class ${d.label}${superClass ? ` extends ${superClass}` : ''} {`);
    const priv = d.fields.filter(f => f.visibility === 'private');
    out.push(`    constructor(${priv.map(f => f.name).join(', ')}) {`);
    if (superClass) out.push('        super();');
    priv.forEach(f => out.push(`        /** @type {${f.type}} */ this.${f.name} = ${f.name};`));
    out.push('    }');

    d.methods.forEach(m => {
      out.push('');
      out.push(`    /** @returns {${m.returnType}} */`);
      out.push(`    ${m.name}(${m.params}) {`);
      if (m.returnType !== 'void') out.push(`        return ${tsDefault(TS(m.returnType))};`);
      out.push('    }');
    });

    out.push('}', '');
    out.push(`module.exports = { ${d.label} };`, '');
  }
  return out.join('\n');
}

// ── Kotlin ────────────────────────────────────────────────────────────
function genKotlin(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['// Generated by UML→Code', 'package generated', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const isIface = d.type === 'interface';
    const isAbs = d.type === 'abstract';

    if (isIface) {
      out.push(`interface ${d.label}${superClass ? ` : ${superClass}` : ''} {`);
      d.methods.forEach(m => out.push(`    fun ${m.name}(): ${KT(m.returnType)}`));
      out.push('}', '');
      continue;
    }

    const parents = [superClass, ...ifaces].filter(Boolean);
    const priv = d.fields.filter(f => f.visibility === 'private');
    const ctorParams = priv.map(f => `    private val ${f.name}: ${KT(f.type)} = ${ktDefault(KT(f.type))}`).join(',\n');
    const absKw = isAbs ? 'abstract ' : '';
    const inh = parents.length ? ` : ${parents.join(', ')}` : '';

    if (priv.length) {
      out.push(`${absKw}class ${d.label}(`);
      out.push(ctorParams);
      out.push(`)${inh} {`);
    } else {
      out.push(`${absKw}class ${d.label}${inh} {`);
    }

    d.methods.forEach(m => {
      const ret = KT(m.returnType);
      const absF = m.isAbstract ? 'abstract ' : 'override '.repeat(0); // simplified
      out.push(`    ${absF}fun ${m.name}(): ${ret}${m.isAbstract ? '' : ` = ${ktDefault(ret)}`}`);
    });

    out.push('}', '');
  }
  return out.join('\n');
}

// ── Go ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function genGo(nodes: Node[], _edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['// Generated by UML→Code', 'package main', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const isIface = d.type === 'interface';

    if (isIface) {
      out.push(`type ${d.label} interface {`);
      d.methods.forEach(m => {
        const ret = GO(m.returnType);
        out.push(`    ${pascal(m.name)}()${ret ? ` ${ret}` : ''}`);
      });
      out.push('}', '');
      continue;
    }

    // Struct
    out.push(`type ${d.label} struct {`);
    d.fields.forEach(f => {
      const exported = f.visibility === 'public' ? pascal(f.name) : f.name;
      out.push(`    ${exported} ${GO(f.type)}`);
    });
    out.push('}', '');

    // Constructor
    const priv = d.fields.filter(f => f.visibility === 'private');
    out.push(`func New${d.label}(${priv.map(f => `${f.name} ${GO(f.type)}`).join(', ')}) *${d.label} {`);
    out.push(`    return &${d.label}{${priv.map(f => `${f.name}: ${f.name}`).join(', ')}}`);
    out.push('}', '');

    // Methods
    d.methods.forEach(m => {
      const ret = GO(m.returnType);
      out.push(`func (s *${d.label}) ${pascal(m.name)}()${ret ? ` ${ret}` : ''} {`);
      if (ret) out.push(`    return ${ret === 'string' ? '""' : ret === 'bool' ? 'false' : '0'}`);
      out.push('}', '');
    });
  }
  return out.join('\n');
}

// ── Swift ─────────────────────────────────────────────────────────────
function genSwift(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['// Generated by UML→Code', 'import Foundation', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const isIface = d.type === 'interface';
    const parents = [superClass, ...ifaces].filter(Boolean);

    if (isIface) {
      out.push(`protocol ${d.label} {`);
      d.methods.forEach(m => out.push(`    func ${m.name}() -> ${SW(m.returnType)}`));
      out.push('}', '');
      continue;
    }

    const kw = d.type === 'abstract' ? 'class' : 'class';
    const inh = parents.length ? `: ${parents.join(', ')}` : '';
    out.push(`${kw} ${d.label}${inh} {`);
    d.fields.forEach(f => {
      const access = f.visibility === 'public' ? 'public' : f.visibility === 'protected' ? 'internal' : 'private';
      out.push(`    ${access} var ${f.name}: ${SW(f.type)}`);
    });

    const priv = d.fields.filter(f => f.visibility === 'private');
    out.push('');
    out.push(`    init(${priv.map(f => `${f.name}: ${SW(f.type)}`).join(', ')}) {`);
    priv.forEach(f => out.push(`        self.${f.name} = ${f.name}`));
    out.push('    }');

    d.methods.forEach(m => {
      const ret = SW(m.returnType);
      out.push('');
      out.push(`    func ${m.name}() -> ${ret} {`);
      if (ret !== 'Void') {
        const def = ret === 'String' ? '""' : ret === 'Bool' ? 'false' : '0';
        out.push(`        return ${def}`);
      }
      out.push('    }');
    });

    out.push('}', '');
  }
  return out.join('\n');
}

// ── PHP ───────────────────────────────────────────────────────────────
function genPhp(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['<?php', '', '// Generated by UML→Code', 'declare(strict_types=1);', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass, ifaces } = getRelations(node, nodes, edges);
    const isIface = d.type === 'interface';
    const isAbs = d.type === 'abstract';
    const kw = isIface ? 'interface' : isAbs ? 'abstract class' : 'class';
    const ext = superClass ? ` extends ${superClass}` : '';
    const impl = ifaces.length ? ` implements ${ifaces.join(', ')}` : '';

    out.push(`${kw} ${d.label}${ext}${impl} {`);
    d.fields.forEach(f => out.push(`    ${f.visibility} ${PHP(f.type)} $${f.name};`));

    if (!isIface && d.fields.length) {
      const priv = d.fields.filter(f => f.visibility === 'private');
      out.push('');
      out.push(`    public function __construct(${priv.map(f => `${PHP(f.type)} $${f.name}`).join(', ')}) {`);
      priv.forEach(f => out.push(`        $this->${f.name} = $${f.name};`));
      out.push('    }');
    }

    d.methods.forEach(m => {
      const ret = PHP(m.returnType);
      const abs = m.isAbstract ? 'abstract ' : '';
      out.push('');
      if (isIface || m.isAbstract) {
        out.push(`    ${m.visibility} ${abs}function ${m.name}(${m.params}): ${ret};`);
      } else {
        out.push(`    ${m.visibility} function ${m.name}(${m.params}): ${ret} {`);
        if (ret !== 'void') {
          const def = ret === 'string' ? '""' : ret === 'bool' ? 'false' : '0';
          out.push(`        return ${def};`);
        }
        out.push('    }');
      }
    });

    out.push('}', '');
  }
  return out.join('\n');
}

// ── Ruby ──────────────────────────────────────────────────────────────
function genRuby(nodes: Node[], edges: Edge[]): string {
  const classes = nodes.filter(n => n.type === 'classNode');
  const out: string[] = ['# Generated by UML→Code', '# frozen_string_literal: true', ''];

  for (const node of classes) {
    const d = node.data as unknown as ClassNodeData;
    const { superClass } = getRelations(node, nodes, edges);
    const isModule = d.type === 'interface';

    if (isModule) {
      out.push(`module ${d.label}`);
      d.methods.forEach(m => { out.push(`  def ${snake(m.name)}`, '    raise NotImplementedError', '  end', ''); });
      out.push('end', '');
      continue;
    }

    out.push(`class ${d.label}${superClass ? ` < ${superClass}` : ''}`);
    if (d.fields.length) {
      const readers = d.fields.filter(f => f.visibility !== 'private').map(f => f.name);
      const writers = d.fields.filter(f => f.visibility === 'public').map(f => f.name);
      if (readers.length) out.push(`  attr_reader ${readers.map(n => `:${n}`).join(', ')}`);
      if (writers.length) out.push(`  attr_writer ${writers.map(n => `:${n}`).join(', ')}`);
      out.push('');
      out.push(`  def initialize(${d.fields.map(f => f.name).join(', ')})`);
      d.fields.forEach(f => out.push(`    @${f.name} = ${f.name}`));
      out.push('  end');
    }

    d.methods.forEach(m => {
      out.push('');
      out.push(`  def ${snake(m.name)}`);
      out.push('    # TODO: implement');
      if (m.returnType !== 'void') out.push('    nil');
      out.push('  end');
    });

    out.push('end', '');
  }
  return out.join('\n');
}

// ── Dispatcher ────────────────────────────────────────────────────────
export function generateClassCodeForLang(nodes: Node[], edges: Edge[], lang: OopLang): string {
  switch (lang) {
    case 'java':       return genJava(nodes, edges);
    case 'python':     return genPython(nodes, edges);
    case 'cpp':        return genCpp(nodes, edges);
    case 'csharp':     return genCsharp(nodes, edges);
    case 'typescript': return genTypeScript(nodes, edges);
    case 'javascript': return genJavaScript(nodes, edges);
    case 'kotlin':     return genKotlin(nodes, edges);
    case 'go':         return genGo(nodes, edges);
    case 'swift':      return genSwift(nodes, edges);
    case 'php':        return genPhp(nodes, edges);
    case 'ruby':       return genRuby(nodes, edges);
    default:           return genJava(nodes, edges);
  }
}

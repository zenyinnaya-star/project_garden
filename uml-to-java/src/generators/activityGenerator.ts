import type { Node, Edge } from '@xyflow/react';
import type { ActivityNodeData } from '../types';
import type { OopLang } from '../types';

/* ── helpers ────────────────────────────────────────────────────── */
function camel(s: string) {
  return s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
          .replace(/[^a-zA-Z0-9]/g, '');
}
function snake(s: string)  { return camel(s).replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''); }
function pascal(s: string) { const c = camel(s); return c.charAt(0).toUpperCase() + c.slice(1); }

/* ── graph traversal ─────────────────────────────────────────────── */
interface GraphCtx {
  nodeMap: Map<string, Node>;
  outgoing: Map<string, Edge[]>;
  visited: Set<string>;
}

function buildCtx(nodes: Node[], edges: Edge[]): GraphCtx {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const outgoing = new Map<string, Edge[]>();
  for (const n of nodes) outgoing.set(n.id, []);
  for (const e of edges) {
    if (outgoing.has(e.source)) outgoing.get(e.source)!.push(e);
  }
  return { nodeMap, outgoing, visited: new Set() };
}

function actData(node: Node): ActivityNodeData {
  return node.data as unknown as ActivityNodeData;
}

/* ── traversal → code lines ──────────────────────────────────────── */
const INDENT = '    ';
const ind = (n: number) => INDENT.repeat(n);

function traverse(lines: string[], ctx: GraphCtx, nodeId: string, indent: number, lang: string) {
  if (ctx.visited.has(nodeId)) { lines.push(`${ind(indent)}// ↩ (back-edge)`); return; }
  ctx.visited.add(nodeId);

  const node = ctx.nodeMap.get(nodeId);
  if (!node) return;
  const d = actData(node);
  const outs = ctx.outgoing.get(nodeId) ?? [];

  /* initial — just follow outgoing */
  if (d.type === 'initial') {
    for (const e of outs) traverse(lines, ctx, e.target, indent, lang);
    return;
  }

  /* final */
  if (d.type === 'final') {
    const kw = lang === 'python' || lang === 'ruby' ? 'return' : 'return;';
    lines.push(`${ind(indent)}${kw}  // Activity end`);
    return;
  }

  /* action */
  if (d.type === 'action') {
    const label = d.label || 'action';
    switch (lang) {
      case 'python': lines.push(`${ind(indent)}${snake(label)}()`); break;
      case 'ruby':   lines.push(`${ind(indent)}${snake(label)}`); break;
      case 'go':     lines.push(`${ind(indent)}${pascal(label)}()`); break;
      default:       lines.push(`${ind(indent)}${camel(label)}();`); break;
    }
    for (const e of outs) traverse(lines, ctx, e.target, indent, lang);
    return;
  }

  /* decision / merge */
  if (d.type === 'decision' || d.type === 'merge') {
    const cond = d.label || 'condition';
    const yesEdge = outs.find(e => e.id.includes('yes') || e.sourceHandle === 'yes') ?? outs[0];
    const noEdge  = outs.find(e => e !== yesEdge);
    const condStr = lang === 'python' ? cond.toLowerCase().replace(/[^a-z0-9_]/g, '_') : `/* ${cond} */`;

    if (lang === 'python') {
      lines.push(`${ind(indent)}if ${condStr}:`);
      if (yesEdge) traverse(lines, ctx, yesEdge.target, indent + 1, lang);
      else lines.push(`${ind(indent + 1)}pass`);
      if (noEdge) { lines.push(`${ind(indent)}else:`); traverse(lines, ctx, noEdge.target, indent + 1, lang); }
    } else if (lang === 'ruby') {
      lines.push(`${ind(indent)}if ${condStr}`);
      if (yesEdge) traverse(lines, ctx, yesEdge.target, indent + 1, lang);
      if (noEdge) { lines.push(`${ind(indent)}else`); traverse(lines, ctx, noEdge.target, indent + 1, lang); }
      lines.push(`${ind(indent)}end`);
    } else {
      lines.push(`${ind(indent)}if (${condStr}) {`);
      if (yesEdge) traverse(lines, ctx, yesEdge.target, indent + 1, lang);
      if (noEdge)  { lines.push(`${ind(indent)}} else {`); traverse(lines, ctx, noEdge.target, indent + 1, lang); }
      lines.push(`${ind(indent)}}`);
    }
    return;
  }

  /* fork — parallel branches */
  if (d.type === 'fork') {
    switch (lang) {
      case 'java':
        lines.push(`${ind(indent)}// ── Fork: parallel branches ──`);
        lines.push(`${ind(indent)}java.util.concurrent.ExecutorService _pool = java.util.concurrent.Executors.newCachedThreadPool();`);
        lines.push(`${ind(indent)}java.util.concurrent.CountDownLatch  _latch = new java.util.concurrent.CountDownLatch(${outs.length});`);
        outs.forEach((e, bi) => {
          lines.push(`${ind(indent)}_pool.submit(() -> {  // Branch ${bi + 1}`);
          traverse(lines, ctx, e.target, indent + 1, lang);
          lines.push(`${ind(indent + 1)}_latch.countDown();`);
          lines.push(`${ind(indent)}});`);
        });
        lines.push(`${ind(indent)}try { _latch.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }`);
        lines.push(`${ind(indent)}_pool.shutdown();`);
        lines.push(`${ind(indent)}// ── Join ──`);
        break;
      case 'python':
        lines.push(`${ind(indent)}# ── Fork: parallel branches ──`);
        lines.push(`${ind(indent)}import threading`);
        lines.push(`${ind(indent)}_threads = []`);
        outs.forEach((e, bi) => {
          lines.push(`${ind(indent)}def _branch_${bi + 1}():`);
          traverse(lines, ctx, e.target, indent + 1, lang);
          lines.push(`${ind(indent)}_threads.append(threading.Thread(target=_branch_${bi + 1}))`);
        });
        lines.push(`${ind(indent)}for t in _threads: t.start()`);
        lines.push(`${ind(indent)}for t in _threads: t.join()  # Join`);
        break;
      case 'typescript': case 'javascript':
        lines.push(`${ind(indent)}// ── Fork: parallel branches ──`);
        lines.push(`${ind(indent)}await Promise.all([`);
        outs.forEach((_, bi) => {
          lines.push(`${ind(indent + 1)}(async () => {  // Branch ${bi + 1}`);
          // We can't easily traverse here; just emit a comment
          lines.push(`${ind(indent + 2)}// TODO: branch ${bi + 1} actions`);
          lines.push(`${ind(indent + 1)})(),`);
        });
        lines.push(`${ind(indent)}]);  // Join`);
        break;
      default: // C#, Kotlin, Go, etc.
        lines.push(`${ind(indent)}// ── Fork: parallel branches ──`);
        outs.forEach((e, bi) => {
          lines.push(`${ind(indent)}// Branch ${bi + 1}:`);
          traverse(lines, ctx, e.target, indent, lang);
        });
        lines.push(`${ind(indent)}// ── Join ──`);
    }
    return;
  }

  /* join — continue downstream */
  if (d.type === 'join') {
    for (const e of outs) traverse(lines, ctx, e.target, indent, lang);
  }
}

/* ── stubs for action nodes ─────────────────────────────────────── */
function actionStubs(nodes: Node[], lang: string): string[] {
  const actions = nodes
    .filter(n => n.type === 'activityNode' && actData(n).type === 'action')
    .map(n => actData(n).label || 'action');
  if (!actions.length) return [];
  const lines: string[] = ['', '// ── Action stubs ──────────────'];
  const done = new Set<string>();
  for (const label of actions) {
    const key = camel(label);
    if (done.has(key)) continue;
    done.add(key);
    switch (lang) {
      case 'python':
        lines.push(`def ${snake(label)}():`, `    # TODO: implement ${label}`, `    pass`, ``);
        break;
      case 'ruby':
        lines.push(`def ${snake(label)}`, `  # TODO: implement ${label}`, `end`, ``);
        break;
      case 'go':
        lines.push(`func ${pascal(label)}() {`, `\t// TODO: implement ${label}`, `}`, ``);
        break;
      case 'kotlin':
        lines.push(`fun ${camel(label)}() {`, `    // TODO: implement ${label}`, `}`, ``);
        break;
      case 'csharp':
        lines.push(`private static void ${pascal(label)}() {`, `    // TODO: implement ${label}`, `}`, ``);
        break;
      default: // java, cpp, ts, js
        lines.push(`private static void ${camel(label)}() {`, `    // TODO: implement ${label}`, `}`, ``);
    }
  }
  return lines;
}

/* ── per-language wrapper ─────────────────────────────────────────── */
function genCode(nodes: Node[], edges: Edge[], lang: string): string {
  const actNodes = nodes.filter(n => n.type === 'activityNode');
  const startNode = actNodes.find(n => actData(n).type === 'initial');
  const ctx = buildCtx(actNodes, edges.filter(e => actNodes.find(n => n.id === e.source)));
  const bodyLines: string[] = [];
  const now = new Date().toISOString().slice(0, 10);

  if (startNode) traverse(bodyLines, ctx, startNode.id, 1, lang);
  else bodyLines.push(`    // Connect an Initial node (●) to begin the activity`);

  const stubs = actionStubs(nodes, lang);

  switch (lang) {
    case 'python': return [
      `# Generated by UML→Code — Activity Diagram`,
      `# Generated: ${now}`,
      ``,
      `def main():`,
      ...bodyLines,
      ...stubs.map(l => l.startsWith('def ') || l.startsWith('  ') || l === '' ? l : l),
      ``,
      `if __name__ == '__main__':`,
      `    main()`,
    ].join('\n');

    case 'ruby': return [
      `# Generated by UML→Code — Activity Diagram`,
      `# Generated: ${now}`,
      ``,
      `def main`,
      ...bodyLines,
      `end`,
      ...stubs,
      ``,
      `main`,
    ].join('\n');

    case 'kotlin': return [
      `// Generated by UML→Code — Activity Diagram`,
      `// Generated: ${now}`,
      ``,
      `fun main() {`,
      ...bodyLines,
      `}`,
      ...stubs,
    ].join('\n');

    case 'go': return [
      `// Generated by UML→Code — Activity Diagram`,
      `// Generated: ${now}`,
      `package main`,
      ``,
      `func main() {`,
      ...bodyLines.map(l => l.replace(/ {4}/g, '\t')),
      `}`,
      ...stubs,
    ].join('\n');

    case 'csharp': return [
      `// Generated by UML→Code — Activity Diagram`,
      `// Generated: ${now}`,
      `using System;`,
      `using System.Threading;`,
      ``,
      `public class ActivityProcess {`,
      `    public static void Main(string[] args) {`,
      ...bodyLines.map(l => `    ${l}`),
      `    }`,
      ...stubs.map(l => l ? `    ${l}` : ''),
      `}`,
    ].join('\n');

    case 'cpp': return [
      `// Generated by UML→Code — Activity Diagram`,
      `// Generated: ${now}`,
      `#include <iostream>`,
      `#include <thread>`,
      `#include <future>`,
      ``,
      ...stubs.filter(l => l.startsWith('private static')).map(l => `void ${l.replace('private static void ', '').replace('()', '();')}`),
      ``,
      `int main() {`,
      ...bodyLines,
      `    return 0;`,
      `}`,
      ``,
      ...stubs.filter(l => l.startsWith('private static')).map(l => `void ${l.replace('private static void ', '').replace('{', '{\n')}`),
    ].join('\n');

    case 'typescript': return [
      `// Generated by UML→Code — Activity Diagram`,
      `// Generated: ${now}`,
      ``,
      `async function main(): Promise<void> {`,
      ...bodyLines,
      `}`,
      ...stubs.map(l => l.replace('private static void ', 'function ')),
      ``,
      `main();`,
    ].join('\n');

    case 'javascript': return [
      `// Generated by UML→Code — Activity Diagram`,
      `// Generated: ${now}`,
      ``,
      `async function main() {`,
      ...bodyLines,
      `}`,
      ...stubs.map(l => l.replace('private static void ', 'function ')),
      ``,
      `main();`,
    ].join('\n');

    default: // java
      return [
        `// Generated by UML→Code — Activity Diagram`,
        `// Generated: ${now}`,
        ``,
        `public class ActivityProcess {`,
        ``,
        `    public static void main(String[] args)`,
        `            throws InterruptedException {`,
        ...bodyLines,
        `    }`,
        ...stubs,
        `}`,
      ].join('\n');
  }
}

/* ── dispatcher ─────────────────────────────────────────────────── */
export function generateActivityCode(nodes: Node[], edges: Edge[], lang: OopLang = 'java'): string {
  const actNodes = nodes.filter(n => n.type === 'activityNode');
  if (!actNodes.length) {
    return `// No activity diagram nodes yet.\n// Add an Initial node (●), Actions, Decisions, and a Final node (◉).`;
  }
  return genCode(nodes, edges, lang);
}

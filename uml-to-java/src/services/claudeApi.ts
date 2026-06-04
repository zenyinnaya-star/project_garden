import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { DiagramType } from '../types';

export interface DiagramData {
  diagramType: DiagramType;
  nodes: Node[];
  edges: Edge[];
}

const SCHEMA_PROMPT = `Return ONLY a valid JSON object — no markdown fences, no explanation.

Schema:
{
  "diagramType": "class" | "er" | "flowchart" | "sequence",
  "nodes": [ ...see below... ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2",
      "label": "optional text",
      "data": { "relationship": "extends|implements|association|ManyToOne|OneToMany|ManyToMany|flow|yes|no|sync|async|return" }
    }
  ]
}

Node formats:

classNode  →  { "id":"n1","type":"classNode","position":{"x":100,"y":100},
  "data":{ "label":"ClassName","type":"class|interface|abstract",
    "fields":[{"name":"id","type":"int","visibility":"private"}],
    "methods":[{"name":"getId","returnType":"int","params":"","visibility":"public","isAbstract":false}] }}

erNode  →  { "id":"n1","type":"erNode","position":{"x":100,"y":100},
  "data":{ "label":"table_name",
    "attributes":[{"name":"id","type":"INT","isPrimary":true,"isForeign":false}] }}

flowNode  →  { "id":"n1","type":"flowNode","position":{"x":100,"y":100},
  "data":{ "label":"Step","type":"start|end|process|decision|io" }}

sequenceNode  →  { "id":"n1","type":"sequenceNode","position":{"x":100,"y":100},
  "data":{ "label":"Name","type":"actor|object|boundary|controller" }}

Layout: space nodes 260px apart horizontally, 220px vertically.
Include all entities/classes/steps visible in the diagram.`;

async function callOpenAI(messages: object[], apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return (data.choices[0]?.message?.content as string) ?? '';
}

function hydrate(raw: string): DiagramData {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in AI response');

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
    diagramType?: DiagramType;
    nodes?: Node[];
    edges?: Array<Partial<Edge>>;
  };

  const edges: Edge[] = (parsed.edges ?? []).map((e, i) => ({
    id: e.id ?? `e_ai_${i}`,
    source: e.source ?? '',
    target: e.target ?? '',
    label: e.label,
    data: e.data ?? {},
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    style: { stroke: '#64748b', strokeWidth: 1.5 },
  }));

  return {
    diagramType: parsed.diagramType ?? 'class',
    nodes: parsed.nodes ?? [],
    edges,
  };
}

export async function analyzeImageDiagram(
  base64: string,
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
  apiKey: string
): Promise<DiagramData> {
  const text = await callOpenAI([{
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
      { type: 'text', text: `Analyze this diagram image and extract its full structure.\n\n${SCHEMA_PROMPT}` },
    ],
  }], apiKey);
  return hydrate(text);
}

export async function generateDiagramFromText(
  description: string,
  diagramType: DiagramType,
  apiKey: string
): Promise<DiagramData> {
  const hints: Record<DiagramType, string> = {
    class: 'Create a complete class diagram with classes, interfaces, relationships, fields, and methods.',
    er: 'Create an ER diagram with tables and columns (use SQL types: INT, VARCHAR, DATE, etc.), primary keys, and foreign keys.',
    flowchart: 'Create a flowchart with a Start node, process steps, at least one decision diamond, and an End node.',
    sequence: 'Create a sequence diagram with participant objects and numbered message arrows between them showing method calls and returns.',
    activity: 'Create an activity diagram with an initial node, action steps, at least one decision fork, and a final node.',
  };

  const text = await callOpenAI([{
    role: 'user',
    content: `${hints[diagramType]} Use diagramType="${diagramType}".\n\nDescription: ${description}\n\n${SCHEMA_PROMPT}`,
  }], apiKey);
  return hydrate(text);
}

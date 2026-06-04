export type DiagramType = 'class' | 'flowchart' | 'er' | 'sequence' | 'activity';

export type OopLang = 'java' | 'python' | 'cpp' | 'csharp' | 'typescript' | 'kotlin' | 'go' | 'swift' | 'php' | 'ruby' | 'javascript';
export type SqlLang  = 'oracle' | 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
export type TargetLang = OopLang | SqlLang;

export interface ClassNodeData {
  label: string;
  type: 'class' | 'interface' | 'abstract';
  fields: { name: string; type: string; visibility: 'public' | 'private' | 'protected' }[];
  methods: { name: string; returnType: string; params: string; visibility: 'public' | 'private' | 'protected'; isAbstract?: boolean }[];
}

export interface SequenceNodeData {
  label: string;
  type: 'actor' | 'object' | 'boundary' | 'controller';
}

export interface FlowNodeData {
  label: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'io';
}

export interface ErNodeData {
  label: string;
  attributes: { name: string; type: string; isPrimary?: boolean; isForeign?: boolean }[];
}

export interface ActivityNodeData {
  label: string;
  type: 'initial' | 'final' | 'action' | 'decision' | 'fork' | 'join' | 'merge';
}

export type UmlNodeData = ClassNodeData | SequenceNodeData | FlowNodeData | ErNodeData | ActivityNodeData;

export interface PaletteItem {
  type: string;
  label: string;
  icon: string;
  defaultData: UmlNodeData;
}

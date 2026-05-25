import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import type { Connection, Edge, Node, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ClassNode from './nodes/ClassNode';
import FlowNode from './nodes/FlowNode';
import ErNode from './nodes/ErNode';
import Palette from './components/Palette';
import PropertiesPanel from './components/PropertiesPanel';
import CodeOutput from './components/CodeOutput';
import EdgeModal from './components/EdgeModal';
import ImportModal from './components/ImportModal';
import ApiKeyModal from './components/ApiKeyModal';
import LandingModal from './components/LandingModal';
import CodeDropPanel from './components/CodeDropPanel';
import EmptyCanvas from './components/EmptyCanvas';
import type { DiagramType } from './types';
import { KeyIcon, UploadIcon, XIcon, PlayIcon, DiagramIcon } from './components/Icons';
import { generateClassCode } from './generators/classGenerator';
import { generateFlowCode } from './generators/flowGenerator';
import { generateOracleDDL } from './generators/oracleGenerator';

const nodeTypes = {
  classNode: ClassNode,
  flowNode: FlowNode,
  erNode: ErNode,
};

const DIAGRAM_TABS: { id: DiagramType; label: string }[] = [
  { id: 'class', label: 'Class' },
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'er', label: 'ER' },
];

let nodeIdCounter = 1;
function getId() { return `node_${nodeIdCounter++}`; }

export default function App() {
  const [diagramType, setDiagramType] = useState<DiagramType>('class');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [switchMode, setSwitchMode] = useState(false);
  const [showLanding, setShowLanding] = useState<boolean>(
    () => localStorage.getItem('uml_visited') !== '1'
  );
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('openai_key') ?? '');
  const [edgeModal, setEdgeModal] = useState<{ visible: boolean; edgeId: string | null; label: string; rel: string }>({
    visible: false, edgeId: null, label: '', rel: '',
  });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const clickAddCount = useRef(0);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge: Edge = {
        ...params,
        id: `edge_${Date.now()}`,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        style: { stroke: '#64748b', strokeWidth: 1.5 },
        data: { relationship: 'association', label: '' },
      };
      setEdges(eds => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEdgeModal({
      visible: true,
      edgeId: edge.id,
      label: (edge.label as string) || '',
      rel: (edge.data?.relationship as string) || '',
    });
  }, []);

  const saveEdge = (edgeId: string, label: string, relationship: string) => {
    setEdges(eds =>
      eds.map(e =>
        e.id === edgeId
          ? {
              ...e,
              label: label || undefined,
              data: { ...e.data, relationship },
              style: {
                stroke:
                  relationship === 'extends' ? '#c084fc' :
                  relationship === 'implements' ? '#60a5fa' :
                  relationship === 'composition' ? '#f87171' :
                  relationship === 'aggregation' ? '#fbbf24' : '#64748b',
                strokeWidth: 1.5,
                strokeDasharray: relationship === 'dependency' ? '5,5' : undefined,
              },
            }
          : e
      )
    );
    setEdgeModal({ visible: false, edgeId: null, label: '', rel: '' });
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('nodeType');
      const nodeData = JSON.parse(event.dataTransfer.getData('nodeData') || '{}');
      if (!nodeType || !reactFlowWrapper.current || !rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type: nodeType,
        position,
        data: { ...nodeData },
      };
      setNodes(nds => [...nds, newNode]);
    },
    [rfInstance, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNodeToCanvas = useCallback((nodeType: string, data: object) => {
    const offset = (clickAddCount.current % 6) * 30;
    clickAddCount.current++;
    let position = { x: 300 + offset, y: 200 + offset };
    if (rfInstance && reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const center = rfInstance.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      position = { x: center.x - 80 + offset, y: center.y - 40 + offset };
    }
    setNodes(nds => [...nds, { id: getId(), type: nodeType, position, data: { ...data } }]);
  }, [rfInstance, setNodes]);

  // Double-click on the empty canvas pane (not on a node) to add a node at that position.
  // ReactFlow v12 has no onPaneDoubleClick prop — we attach a native dblclick listener on the wrapper div.
  const onWrapperDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Ignore if the double-click landed on a node, edge, or control element
    const target = event.target as HTMLElement;
    if (target.closest('.react-flow__node, .react-flow__edge, .react-flow__controls, .react-flow__minimap')) return;
    if (!rfInstance) return;
    const position = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const defaults: Partial<Record<DiagramType, { nodeType: string; data: object }>> = {
      class:     { nodeType: 'classNode', data: { label: 'NewClass', type: 'class', fields: [], methods: [] } },
      flowchart: { nodeType: 'flowNode',  data: { label: 'Step', type: 'process' } },
      er:        { nodeType: 'erNode',    data: { label: 'NewTable', attributes: [{ name: 'id', type: 'INT', isPrimary: true }] } },
    };
    const def = defaults[diagramType];
    if (!def) return;
    setNodes(nds => [...nds, { id: getId(), type: def.nodeType, position, data: def.data }]);
  }, [rfInstance, diagramType, setNodes]);

  const updateNodeData = useCallback((id: string, data: Record<string, unknown>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data } : n));
    setSelectedNode(prev => prev?.id === id ? { ...prev, data } : prev);
  }, [setNodes]);

  const handleGenerate = () => {
    let code = '';
    if (diagramType === 'class') code = generateClassCode(nodes, edges);
    else if (diagramType === 'flowchart') code = generateFlowCode(nodes, edges);
    else if (diagramType === 'er') code = generateOracleDDL(nodes, edges);
    setGeneratedCode(code || '// Nothing to generate yet.');
    setShowCode(true);
  };

  const handleImport = (type: DiagramType, importedNodes: Node[], importedEdges: Edge[]) => {
    setDiagramType(type);
    setNodes(importedNodes);
    setEdges(importedEdges);
    setSelectedNode(null);
    setGeneratedCode('');
    setShowCode(false);
    // Auto-generate code right after import
    setTimeout(() => {
      let code = '';
      if (type === 'class') code = generateClassCode(importedNodes, importedEdges);
      else if (type === 'flowchart') code = generateFlowCode(importedNodes, importedEdges);
      else if (type === 'er') code = generateOracleDDL(importedNodes, importedEdges);
      if (code) { setGeneratedCode(code); setShowCode(true); }
    }, 100);
  };

  const handleDismissLanding = () => {
    localStorage.setItem('uml_visited', '1');
    setShowLanding(false);
  };

  const saveApiKey = (key: string) => {
    if (key) localStorage.setItem('openai_key', key);
    else localStorage.removeItem('openai_key');
    setApiKey(key);
  };

  const handleClear = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (confirm('Clear the canvas?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setGeneratedCode('');
    }
  };

  const switchDiagram = (type: DiagramType) => {
    setDiagramType(type);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setGeneratedCode('');
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, data: object) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.setData('nodeData', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  /* ── theme tokens ── */
  const T = switchMode ? {
    appBg:      '#f8f8f8',
    barBg:      '#dc2626',
    barBorder:  '#b91c1c',
    barText:    '#fff',
    tabsBg:     'rgba(0,0,0,0.15)',
    tabActive:  '#fff',
    tabActiveTx:'#dc2626',
    tabIdle:    'rgba(255,255,255,0.75)',
    btnBorder:  'rgba(255,255,255,0.35)',
    btnBg:      'rgba(255,255,255,0.12)',
    btnText:    '#fff',
    genBg:      '#fff',
    genTx:      '#dc2626',
  } : {
    appBg:      '#0f172a',
    barBg:      '#0f172a',
    barBorder:  '#1e293b',
    barText:    '#f1f5f9',
    tabsBg:     '#1e293b',
    tabActive:  '#1d4ed8',
    tabActiveTx:'#fff',
    tabIdle:    '#94a3b8',
    btnBorder:  '#334155',
    btnBg:      '#1e293b',
    btnText:    '#94a3b8',
    genBg:      '#1d4ed8',
    genTx:      '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.appBg, transition: 'background 0.2s' }}>
      {/* Top Bar */}
      <div style={{
        height: 52,
        background: T.barBg,
        borderBottom: `1px solid ${T.barBorder}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        flexShrink: 0,
        transition: 'background 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <div style={{
            width: 30, height: 30,
            background: switchMode ? '#fff' : '#1d4ed8',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
            color: switchMode ? '#dc2626' : '#fff',
            transition: 'all 0.2s',
          }}>U</div>
          <span style={{ color: T.barText, fontWeight: 600, fontSize: 15, transition: 'color 0.2s' }}>
            UML<span style={{ color: switchMode ? '#fecaca' : '#3b82f6' }}>→Java</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, background: T.tabsBg, borderRadius: 6, padding: 3 }}>
          {DIAGRAM_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchDiagram(tab.id)}
              style={{
                background: diagramType === tab.id ? T.tabActive : 'transparent',
                border: 'none',
                borderRadius: 4,
                color: diagramType === tab.id ? T.tabActiveTx : T.tabIdle,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── right-side actions — all flex-shrink:0 so they never wrap off screen ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>

          {/* Pro badge — icon only, tooltip explains */}
          <div
            title="Professional Mode coming soon — team workspaces, version history, CI/CD hooks & cloud sync"
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 6, padding: '4px 8px', cursor: 'default', userSelect: 'none', flexShrink: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#a78bfa', letterSpacing: 0.5 }}>PRO</span>
            <span style={{ fontSize: 8, fontWeight: 800, color: '#7c3aed', background: 'rgba(124,58,237,0.2)', padding: '1px 4px', borderRadius: 4 }}>SOON</span>
          </div>

          {/* Switch Mode (Code Import) */}
          <button
            onClick={() => setSwitchMode(s => !s)}
            title={switchMode ? 'Exit Code Import mode' : 'Code Import — drop Java or Oracle DDL to generate diagrams'}
            style={{
              background: switchMode ? '#fff' : '#7f1d1d',
              border: `1px solid ${switchMode ? '#fca5a5' : '#991b1b'}`,
              borderRadius: 6, color: switchMode ? '#dc2626' : '#fca5a5',
              padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
            {switchMode ? 'Exit' : 'Code Import'}
          </button>

          {/* API key — icon only */}
          <button
            onClick={() => setShowApiKey(true)}
            title={apiKey ? 'API key set — click to change' : 'Set OpenAI API key for AI features'}
            style={{ background: T.btnBg, border: `1px solid ${apiKey ? (switchMode ? 'rgba(255,255,255,0.5)' : '#166534') : T.btnBorder}`, borderRadius: 6, color: apiKey ? (switchMode ? '#fff' : '#4ade80') : T.btnText, padding: '5px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
          >
            <KeyIcon size={12} />
            <span style={{ fontSize: 10 }}>{apiKey ? '' : 'API Key'}</span>
          </button>

          {/* Import */}
          {!switchMode && (
            <button
              onClick={() => setShowImport(true)}
              style={{ background: T.btnBg, border: `1px solid ${T.btnBorder}`, borderRadius: 6, color: T.btnText, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            >
              <UploadIcon size={12} /> Import
            </button>
          )}

          {/* Hide code */}
          {showCode && !switchMode && (
            <button
              onClick={() => setShowCode(false)}
              title="Hide code panel"
              style={{ background: 'transparent', border: `1px solid ${T.btnBorder}`, borderRadius: 6, color: T.btnText, padding: '5px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
            >
              <XIcon size={9} />
            </button>
          )}

          {/* Clear */}
          {!switchMode && (
            <button
              onClick={handleClear}
              style={{ background: 'transparent', border: `1px solid ${T.btnBorder}`, borderRadius: 6, color: T.btnText, padding: '5px 10px', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
            >
              Clear
            </button>
          )}

          {/* Generate Code */}
          {!switchMode && (
            <button
              onClick={handleGenerate}
              style={{ background: T.genBg, border: 'none', borderRadius: 6, color: T.genTx, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            >
              <PlayIcon size={10} /> Generate
            </button>
          )}
        </div>
      </div>

      {/* Main body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Palette diagramType={diagramType} onDragStart={onDragStart} onAdd={addNodeToCanvas} switchMode={switchMode} />

        <div ref={reactFlowWrapper} style={{ flex: 1, position: 'relative' }} onDoubleClick={onWrapperDoubleClick}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setRfInstance}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#64748b', strokeWidth: 1.5 },
            }}
          >
            <Controls />
            <MiniMap
              nodeColor={n => {
                if (n.type === 'classNode') return '#1d4ed8';
                if (n.type === 'sequenceNode') return '#059669';
                if (n.type === 'flowNode') return '#d97706';
                return '#7c3aed';
              }}
              maskColor="rgba(15,23,42,0.7)"
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
          </ReactFlow>

          {switchMode && (
            <CodeDropPanel
              onImport={handleImport}
              onClose={() => setSwitchMode(false)}
            />
          )}

          {nodes.length === 0 && !switchMode && (
            <EmptyCanvas
              diagramType={diagramType}
              onAddNode={addNodeToCanvas}
              onSwitchDiagram={switchDiagram}
            />
          )}
        </div>

        {!switchMode && <PropertiesPanel node={selectedNode} onUpdate={updateNodeData} />}
        {!switchMode && showCode && <CodeOutput code={generatedCode} diagramType={diagramType} nodes={nodes} edges={edges} />}
      </div>

      <EdgeModal
        visible={edgeModal.visible}
        edgeId={edgeModal.edgeId}
        currentLabel={edgeModal.label}
        currentRelationship={edgeModal.rel}
        diagramType={diagramType}
        onSave={saveEdge}
        onClose={() => setEdgeModal(m => ({ ...m, visible: false }))}
      />

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
          apiKey={apiKey}
          onNeedApiKey={() => { setShowImport(false); setShowApiKey(true); }}
        />
      )}

      {showApiKey && (
        <ApiKeyModal
          currentKey={apiKey}
          onSave={saveApiKey}
          onClose={() => setShowApiKey(false)}
        />
      )}

      {showLanding && <LandingModal onClose={handleDismissLanding} />}
    </div>
  );
}

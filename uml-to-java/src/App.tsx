import { useCallback, useEffect, useRef, useState } from 'react';
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
import SequenceNode from './nodes/SequenceNode';
import ActivityNode from './nodes/ActivityNode';
import Palette from './components/Palette';
import PropertiesPanel from './components/PropertiesPanel';
import CodeOutput from './components/CodeOutput';
import EdgeModal from './components/EdgeModal';
import ImportModal from './components/ImportModal';
import ApiKeyModal from './components/ApiKeyModal';
import LandingModal from './components/LandingModal';
import TutorialOverlay from './components/TutorialOverlay';
import AuthModal    from './components/AuthModal';
import UserMenu     from './components/UserMenu';
import ShareModal   from './components/ShareModal';
import CodeDropPanel from './components/CodeDropPanel';
import EmptyCanvas from './components/EmptyCanvas';
import type { DiagramType, TargetLang } from './types';
import type { OopLang } from './types';
import type { SqlDialect } from './generators/sqlDialects';
import { KeyIcon, UploadIcon, XIcon, PlayIcon } from './components/Icons';
import { useAuth }  from './hooks/useAuth';
import { useCollab } from './hooks/useCollab';
import type { CollabSnapshot } from './hooks/useCollab';
import { generateClassCodeForLang } from './generators/multiLangClassGenerator';
import { generateFlowCode } from './generators/flowGenerator';
import { generateDDL } from './generators/sqlDialects';
import { generateSequenceCode } from './generators/sequenceGenerator';
import { generateActivityCode } from './generators/activityGenerator';
import LanguagePicker from './components/LanguagePicker';

const nodeTypes = {
  classNode:    ClassNode,
  flowNode:     FlowNode,
  erNode:       ErNode,
  sequenceNode: SequenceNode,
  activityNode: ActivityNode,
};

const DIAGRAM_TABS: { id: DiagramType; label: string }[] = [
  { id: 'class',     label: 'Class'     },
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'er',        label: 'ER'        },
  { id: 'sequence',  label: 'Sequence'  },
  { id: 'activity',  label: 'Activity'  },
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
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try { return localStorage.getItem('uml_visited') !== '1'; } catch { return true; }
  });
  const [langByType, setLangByType] = useState<Record<DiagramType, TargetLang>>({
    class: 'java', flowchart: 'java', er: 'oracle', sequence: 'java', activity: 'java',
  });

  /* ── Auth ── */
  const { user, loading: authLoading, signOut } = useAuth();
  const [showAuth,  setShowAuth]  = useState(false);
  const [showShare, setShowShare] = useState(false);

  /* ── Collaboration room (from URL or created on Share click) ── */
  const [roomId, setRoomId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('room');
  });

  // Stable guest name — generated once, won't change on re-renders
  const [guestName] = useState(() => `Guest-${Math.random().toString(36).slice(2, 6)}`);
  const displayName = user?.email ? user.email.split('@')[0] : guestName;

  /* Remote update handler — apply incoming state from collaborators */
  const handleRemoteUpdate = useCallback((snapshot: CollabSnapshot) => {
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setDiagramType(snapshot.diagramType);
  }, [setNodes, setEdges]);

  const { peers, isConnected, myColor, broadcastState, stashState } = useCollab(
    roomId,
    displayName,
    handleRemoteUpdate,
  );

  /* Debounced broadcast — fires 400ms after the last change */
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleBroadcast = useCallback((snapshot: CollabSnapshot) => {
    stashState(snapshot);
    if (!roomId) return;
    if (broadcastTimer.current) clearTimeout(broadcastTimer.current);
    broadcastTimer.current = setTimeout(() => broadcastState(snapshot), 400);
  }, [roomId, stashState, broadcastState]);
  const [apiKey, setApiKey] = useState<string>(() => {
    try { return localStorage.getItem('openai_key') ?? ''; } catch { return ''; }
  });
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
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
        style: { stroke: '#3f3f46', strokeWidth: 1.5 },
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
                  relationship === 'aggregation' ? '#fbbf24' : '#3f3f46',
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
      class:     { nodeType: 'classNode',    data: { label: 'NewClass', type: 'class', fields: [], methods: [] } },
      flowchart: { nodeType: 'flowNode',     data: { label: 'Step', type: 'process' } },
      er:        { nodeType: 'erNode',       data: { label: 'NewTable', attributes: [{ name: 'id', type: 'INT', isPrimary: true }] } },
      sequence:  { nodeType: 'sequenceNode', data: { label: 'Participant', type: 'object' } },
      activity:  { nodeType: 'activityNode', data: { label: 'Action', type: 'action' } },
    };
    const def = defaults[diagramType];
    if (!def) return;
    setNodes(nds => [...nds, { id: getId(), type: def.nodeType, position, data: def.data }]);
  }, [rfInstance, diagramType, setNodes]);

  const updateNodeData = useCallback((id: string, data: Record<string, unknown>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data } : n));
    setSelectedNode(prev => prev?.id === id ? { ...prev, data } : prev);
  }, [setNodes]);

  /* Broadcast diagram state to collaborators on every meaningful change */
  useEffect(() => {
    scheduleBroadcast({ nodes, edges, diagramType });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, diagramType]);

  const currentLang = langByType[diagramType];

  const handleGenerate = () => {
    let code = '';
    if      (diagramType === 'class')     code = generateClassCodeForLang(nodes, edges, currentLang as OopLang);
    else if (diagramType === 'flowchart') code = generateFlowCode(nodes, edges, currentLang as OopLang);
    else if (diagramType === 'er')        code = generateDDL(nodes, edges, currentLang as SqlDialect);
    else if (diagramType === 'sequence')  code = generateSequenceCode(nodes, edges, currentLang as OopLang);
    else if (diagramType === 'activity')  code = generateActivityCode(nodes, edges, currentLang as OopLang);
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
    // Auto-generate code right after import using the per-type language
    setTimeout(() => {
      const lang = langByType[type];
      let code = '';
      if      (type === 'class')     code = generateClassCodeForLang(importedNodes, importedEdges, lang as OopLang);
      else if (type === 'flowchart') code = generateFlowCode(importedNodes, importedEdges, lang as OopLang);
      else if (type === 'er')        code = generateDDL(importedNodes, importedEdges, lang as SqlDialect);
      else if (type === 'sequence')  code = generateSequenceCode(importedNodes, importedEdges, lang as OopLang);
      else if (type === 'activity')  code = generateActivityCode(importedNodes, importedEdges, lang as OopLang);
      if (code) { setGeneratedCode(code); setShowCode(true); }
    }, 100);
  };

  const handleShare = () => {
    if (!roomId) {
      const newRoom = crypto.randomUUID();
      setRoomId(newRoom);
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoom);
      window.history.replaceState(null, '', url.toString());
    }
    setShowShare(true);
  };

  const handleStopSharing = () => {
    setRoomId(null);
    setShowShare(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState(null, '', url.toString());
  };

  /* ── Tutorial ── */
  const [showTutorial, setShowTutorial] = useState(false);

  const handleDismissLanding = () => {
    localStorage.setItem('uml_visited', '1');
    setShowLanding(false);
  };

  const handleStartTutorial = () => {
    handleDismissLanding();
    // Small delay so the landing modal finishes unmounting before the tutorial starts
    setTimeout(() => setShowTutorial(true), 80);
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
    appBg:      '#000000',
    barBg:      '#020c1a',
    barBorder:  'rgba(14,165,233,0.3)',
    barText:    '#e0f2fe',
    tabsBg:     'rgba(14,165,233,0.06)',
    tabActive:  '#0ea5e9',
    tabActiveTx:'#000000',
    tabIdle:    '#475569',
    btnBorder:  'rgba(14,165,233,0.25)',
    btnBg:      'rgba(14,165,233,0.08)',
    btnText:    '#7dd3fc',
    genBg:      'linear-gradient(135deg,#0ea5e9,#0284c7)',
    genTx:      '#ffffff',
  } : {
    appBg:      '#000000',
    barBg:      '#000000',
    barBorder:  'rgba(255,255,255,0.08)',
    barText:    '#ffffff',
    tabsBg:     'rgba(255,255,255,0.05)',
    tabActive:  '#f97316',
    tabActiveTx:'#ffffff',
    tabIdle:    '#52525b',
    btnBorder:  'rgba(255,255,255,0.1)',
    btnBg:      'rgba(255,255,255,0.04)',
    btnText:    '#71717a',
    genBg:      'linear-gradient(135deg,#f97316,#ea580c)',
    genTx:      '#ffffff',
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
        <div
          onClick={() => setShowLanding(true)}
          title="Back to home"
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, cursor: 'pointer', userSelect: 'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
        >
          <div style={{
            width: 30, height: 30,
            background: switchMode ? 'rgba(14,165,233,0.15)' : 'linear-gradient(135deg,#f97316,#ea580c)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
            color: switchMode ? '#38bdf8' : '#ffffff',
            boxShadow: switchMode ? '0 0 12px rgba(14,165,233,0.3)' : '0 0 12px rgba(249,115,22,0.4)',
            transition: 'all 0.2s',
          }}>U</div>
          <span style={{ color: T.barText, fontWeight: 600, fontSize: 15, transition: 'color 0.2s' }}>
            UML<span style={{ color: switchMode ? '#38bdf8' : '#f97316' }}>→Code</span>
          </span>
        </div>

        <div data-tutorial="diagram-tabs" style={{ display: 'flex', gap: 4, background: T.tabsBg, borderRadius: 6, padding: 3 }}>
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

        {/* ── Language picker ── */}
        {!switchMode && (
          <LanguagePicker
            diagramType={diagramType}
            lang={currentLang}
            onChange={lang => setLangByType(prev => ({ ...prev, [diagramType]: lang }))}
          />
        )}

        {/* ════════════════════════════════════════════════════════
            RIGHT-SIDE ACTIONS  (3 logical groups + primary CTA)
            ════════════════════════════════════════════════════════ */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>

          {/* ── GROUP A: Account & Collaboration ─────────────────── */}

          {/* Sign In / User avatar */}
          {!authLoading && (
            user ? (
              <UserMenu user={user} onSignOut={signOut} />
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                title="Sign in to save diagrams and collaborate"
                style={{
                  background: T.btnBg, border: `1px solid ${T.btnBorder}`,
                  borderRadius: 6, color: T.btnText,
                  padding: '5px 10px', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  flexShrink: 0, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'; e.currentTarget.style.color = '#f97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.btnBorder; e.currentTarget.style.color = T.btnText; e.currentTarget.style.background = T.btnBg; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M20 21a8 8 0 10-16 0"/>
                </svg>
                Sign In
              </button>
            )
          )}

          {/* Share + Live peer avatars (grouped together) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            {/* Stacked peer avatars — appear when collaborators are present */}
            {roomId && peers.length > 0 && (
              <div style={{ display: 'flex', marginRight: 2 }}>
                {peers.slice(0, 3).map((p, i) => (
                  <div key={p.sessionId} title={p.displayName} style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: p.color + '25', border: `1.5px solid ${p.color}66`,
                    color: p.color, fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: i > 0 ? -7 : 0, zIndex: 10 - i, position: 'relative',
                    boxShadow: '0 0 0 1.5px #000',
                  }}>
                    {p.displayName.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {peers.length > 3 && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)', color: '#71717a', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -7, zIndex: 6, position: 'relative', boxShadow: '0 0 0 1.5px #000' }}>
                    +{peers.length - 3}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleShare}
              title={roomId ? 'Collaboration active — click to manage' : 'Share & collaborate in real time'}
              style={{
                background: roomId ? (isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.1)') : T.btnBg,
                border: `1px solid ${roomId ? (isConnected ? 'rgba(16,185,129,0.45)' : 'rgba(249,115,22,0.4)') : T.btnBorder}`,
                borderRadius: 6,
                color: roomId ? (isConnected ? '#10b981' : '#f97316') : T.btnText,
                padding: '5px 10px', fontSize: 11, fontWeight: roomId ? 700 : 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: roomId && isConnected ? '0 0 8px rgba(16,185,129,0.25)' : 'none',
              }}
              onMouseEnter={e => { if (!roomId) { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.07)'; }}}
              onMouseLeave={e => { if (!roomId) { e.currentTarget.style.borderColor = T.btnBorder; e.currentTarget.style.color = T.btnText; e.currentTarget.style.background = T.btnBg; }}}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              {roomId ? (isConnected ? '● Live' : 'Connecting…') : 'Share'}
            </button>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ width: 1, height: 20, background: T.btnBorder, margin: '0 6px', flexShrink: 0, opacity: 0.7 }} />

          {/* ── GROUP B: Tools ───────────────────────────────────── */}

          {/* Import diagram / AI import */}
          {!switchMode && (
            <button
              onClick={() => setShowImport(true)}
              title="Import existing code or diagram"
              style={{ background: T.btnBg, border: `1px solid ${T.btnBorder}`, borderRadius: 6, color: T.btnText, padding: '5px 9px', fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#e4e4e7'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.btnBorder; e.currentTarget.style.color = T.btnText; }}
            >
              <UploadIcon size={11} /> Import
            </button>
          )}

          {/* API Key */}
          <button
            onClick={() => setShowApiKey(true)}
            title={apiKey ? 'OpenAI API key set — click to change' : 'Set OpenAI API key for AI import'}
            style={{
              background: apiKey ? (switchMode ? 'rgba(14,165,233,0.08)' : 'rgba(249,115,22,0.08)') : T.btnBg,
              border: `1px solid ${apiKey ? (switchMode ? 'rgba(14,165,233,0.4)' : 'rgba(249,115,22,0.35)') : T.btnBorder}`,
              borderRadius: 6,
              color: apiKey ? (switchMode ? '#38bdf8' : '#f97316') : T.btnText,
              padding: '5px 8px', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!apiKey) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#e4e4e7'; }}}
            onMouseLeave={e => { if (!apiKey) { e.currentTarget.style.borderColor = T.btnBorder; e.currentTarget.style.color = T.btnText; }}}
          >
            <KeyIcon size={12} />
            {!apiKey && <span style={{ fontSize: 10 }}>AI Key</span>}
          </button>

          {/* Code Import mode toggle */}
          <button
            onClick={() => setSwitchMode(s => !s)}
            title={switchMode ? 'Exit Code Import mode' : 'Code Import — paste code to reverse-engineer a diagram'}
            style={{
              background: switchMode ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.06)',
              border: `1px solid ${switchMode ? 'rgba(14,165,233,0.6)' : 'rgba(14,165,233,0.22)'}`,
              borderRadius: 6, color: switchMode ? '#38bdf8' : '#7dd3fc',
              padding: '5px 9px', fontSize: 11, fontWeight: switchMode ? 700 : 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!switchMode) { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.45)'; e.currentTarget.style.color = '#38bdf8'; }}}
            onMouseLeave={e => { if (!switchMode) { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.22)'; e.currentTarget.style.color = '#7dd3fc'; }}}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
            {switchMode ? 'Exit Import' : 'Code Import'}
          </button>

          {/* ── DIVIDER (only in normal mode) ── */}
          {!switchMode && (
            <div style={{ width: 1, height: 20, background: T.btnBorder, margin: '0 6px', flexShrink: 0, opacity: 0.7 }} />
          )}

          {/* ── GROUP C: Canvas actions + Primary CTA ────────────── */}

          {/* Hide code panel (shown only when code panel is open) */}
          {showCode && !switchMode && (
            <button
              onClick={() => setShowCode(false)}
              title="Close code panel"
              style={{ background: 'transparent', border: `1px solid ${T.btnBorder}`, borderRadius: 6, color: '#52525b', padding: '5px 7px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.borderColor = T.btnBorder; }}
            >
              <XIcon size={9} />
            </button>
          )}

          {/* Clear canvas */}
          {!switchMode && (
            <button
              onClick={handleClear}
              title="Clear the canvas"
              style={{ background: 'transparent', border: `1px solid ${T.btnBorder}`, borderRadius: 6, color: T.btnText, padding: '5px 10px', fontSize: 11, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.background = 'rgba(248,113,113,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.btnText; e.currentTarget.style.borderColor = T.btnBorder; e.currentTarget.style.background = 'transparent'; }}
            >
              Clear
            </button>
          )}

          {/* Generate — Primary CTA, always last */}
          {!switchMode && (
            <button
              data-tutorial="generate-btn"
              onClick={handleGenerate}
              title="Generate code from your diagram"
              style={{
                background: T.genBg, border: 'none', borderRadius: 6,
                color: T.genTx, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                flexShrink: 0,
                boxShadow: switchMode ? 'none' : '0 0 18px rgba(249,115,22,0.4)',
                transition: 'box-shadow 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 26px rgba(249,115,22,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 18px rgba(249,115,22,0.4)'; e.currentTarget.style.transform = 'none'; }}
            >
              <PlayIcon size={10} /> Generate
            </button>
          )}
        </div>
      </div>

      {/* Main body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div data-tutorial="palette" style={{ display: 'flex', flexShrink: 0, alignSelf: 'stretch' }}>
          <Palette diagramType={diagramType} onDragStart={onDragStart} onAdd={addNodeToCanvas} switchMode={switchMode} />
        </div>

        <div data-tutorial="canvas" ref={reactFlowWrapper} style={{ flex: 1, position: 'relative' }} onDoubleClick={onWrapperDoubleClick}>
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
              style: { stroke: '#3f3f46', strokeWidth: 1.5 },
            }}
          >
            <Controls />
            <MiniMap
              nodeColor={n => {
                if (n.type === 'classNode') return '#f97316';
                if (n.type === 'sequenceNode') return '#4ade80';
                if (n.type === 'flowNode') return '#fb923c';
                return '#a78bfa';
              }}
              style={{ background: '#050a12', border: '1px solid rgba(255,255,255,0.08)' }}
              maskColor="rgba(0,0,0,0.7)"
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.06)" />
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

        {!switchMode && (
          <div data-tutorial="properties-panel" style={{ display: 'flex', flexShrink: 0, alignSelf: 'stretch' }}>
            <PropertiesPanel node={selectedNode} onUpdate={updateNodeData} />
          </div>
        )}
        {!switchMode && showCode && (
          <CodeOutput
            code={generatedCode}
            diagramType={diagramType}
            targetLang={currentLang}
            nodes={nodes}
            edges={edges}
            onClose={() => setShowCode(false)}
          />
        )}
      </div>

      <EdgeModal
        key={edgeModal.edgeId ?? 'none'}
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

      {showLanding && (
        <LandingModal
          onClose={handleDismissLanding}
          onSignIn={() => { handleDismissLanding(); setShowAuth(true); }}
          onStartTutorial={handleStartTutorial}
        />
      )}

      {showTutorial && (
        <TutorialOverlay onClose={() => setShowTutorial(false)} />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          initialTab="signin"
        />
      )}

      {showShare && roomId && (
        <ShareModal
          roomId={roomId}
          peers={peers}
          isConnected={isConnected}
          myColor={myColor}
          myName={displayName}
          onClose={() => setShowShare(false)}
          onStopSharing={handleStopSharing}
        />
      )}
    </div>
  );
}

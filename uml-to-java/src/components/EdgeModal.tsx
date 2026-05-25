import type { DiagramType } from '../types';

interface Props {
  visible: boolean;
  edgeId: string | null;
  currentLabel: string;
  currentRelationship: string;
  diagramType: DiagramType;
  onSave: (edgeId: string, label: string, relationship: string) => void;
  onClose: () => void;
}

const relationships: Record<DiagramType, { value: string; label: string }[]> = {
  class: [
    { value: 'association', label: 'Association' },
    { value: 'extends', label: 'Extends (Inheritance)' },
    { value: 'implements', label: 'Implements' },
    { value: 'aggregation', label: 'Aggregation' },
    { value: 'composition', label: 'Composition' },
    { value: 'dependency', label: 'Dependency' },
  ],
  flowchart: [
    { value: 'flow', label: 'Flow' },
    { value: 'yes', label: 'Yes branch' },
    { value: 'no', label: 'No branch' },
  ],
  er: [
    { value: 'OneToOne', label: 'One-to-One' },
    { value: 'OneToMany', label: 'One-to-Many' },
    { value: 'ManyToOne', label: 'Many-to-One' },
    { value: 'ManyToMany', label: 'Many-to-Many' },
  ],
};

export default function EdgeModal({ visible, edgeId, currentLabel, currentRelationship, diagramType, onSave, onClose }: Props) {
  if (!visible || !edgeId) return null;

  let label = currentLabel;
  let rel = currentRelationship || relationships[diagramType][0]?.value || '';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }} onClick={onClose}>
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 20,
          minWidth: 280,
          color: '#e2e8f0',
          fontSize: 13,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Edit Connection</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Label (optional)</div>
          <input
            style={{
              background: '#0f172a', border: '1px solid #334155', borderRadius: 4,
              color: '#e2e8f0', padding: '6px 8px', fontSize: 12, width: '100%', outline: 'none',
            }}
            defaultValue={currentLabel}
            onChange={e => { label = e.target.value; }}
            placeholder="e.g. login(user)"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Relationship Type</div>
          <select
            style={{
              background: '#0f172a', border: '1px solid #334155', borderRadius: 4,
              color: '#e2e8f0', padding: '6px 8px', fontSize: 12, width: '100%', outline: 'none', cursor: 'pointer',
            }}
            defaultValue={currentRelationship || relationships[diagramType][0]?.value}
            onChange={e => { rel = e.target.value; }}
          >
            {relationships[diagramType].map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            style={{ background: '#334155', border: 'none', borderRadius: 4, color: '#94a3b8', padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ background: '#1d4ed8', border: 'none', borderRadius: 4, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            onClick={() => onSave(edgeId, label, rel)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

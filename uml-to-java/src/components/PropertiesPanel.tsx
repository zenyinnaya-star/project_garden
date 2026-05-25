import type { Node } from '@xyflow/react';
import type { ClassNodeData, SequenceNodeData, FlowNodeData, ErNodeData } from '../types';
import { XIcon } from './Icons';

interface Props {
  node: Node | null;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 4,
  color: '#e2e8f0',
  padding: '4px 8px',
  fontSize: 12,
  width: '100%',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnStyle: React.CSSProperties = {
  background: '#1e3a5f',
  border: '1px solid #334155',
  borderRadius: 4,
  color: '#60a5fa',
  padding: '4px 10px',
  fontSize: 11,
  cursor: 'pointer',
  marginTop: 4,
};

export default function PropertiesPanel({ node, onUpdate }: Props) {
  if (!node) {
    return (
      <div style={{
        width: 36,
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 12,
        color: '#334155',
        fontSize: 10,
        writingMode: 'vertical-rl',
        letterSpacing: 1,
        userSelect: 'none',
      }}>
        PROPERTIES
      </div>
    );
  }

  function update(patch: Record<string, unknown>) {
    onUpdate(node!.id, { ...(node!.data as Record<string, unknown>), ...patch });
  }

  // --- CLASS NODE ---
  if (node.type === 'classNode') {
    const d = node.data as unknown as ClassNodeData;
    return (
      <div style={{ width: 220, background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 16, overflowY: 'auto', fontSize: 12 }}>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Class Properties
        </div>

        <Field label="Name">
          <input style={inputStyle} value={d.label} onChange={e => update({ label: e.target.value })} />
        </Field>
        <Field label="Type">
          <select style={selectStyle} value={d.type} onChange={e => update({ type: e.target.value })}>
            <option value="class">Class</option>
            <option value="interface">Interface</option>
            <option value="abstract">Abstract</option>
          </select>
        </Field>

        <div style={{ color: '#64748b', fontSize: 11, marginTop: 12, marginBottom: 6 }}>Fields</div>
        {d.fields.map((f, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 4, padding: '6px 8px', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="name"
                value={f.name}
                onChange={e => {
                  const fields = [...d.fields];
                  fields[i] = { ...fields[i], name: e.target.value };
                  update({ fields });
                }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="type"
                value={f.type}
                onChange={e => {
                  const fields = [...d.fields];
                  fields[i] = { ...fields[i], type: e.target.value };
                  update({ fields });
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <select
                style={{ ...selectStyle, flex: 1 }}
                value={f.visibility}
                onChange={e => {
                  const fields = [...d.fields];
                  fields[i] = { ...fields[i], visibility: e.target.value as 'public' | 'private' | 'protected' };
                  update({ fields });
                }}
              >
                <option value="private">private</option>
                <option value="protected">protected</option>
                <option value="public">public</option>
              </select>
              <button
                style={{ ...btnStyle, color: '#f87171', marginTop: 0 }}
                onClick={() => update({ fields: d.fields.filter((_, fi) => fi !== i) })}
              ><XIcon size={9} /></button>
            </div>
          </div>
        ))}
        <button style={btnStyle} onClick={() => update({ fields: [...d.fields, { name: 'field', type: 'String', visibility: 'private' }] })}>
          + Add Field
        </button>

        <div style={{ color: '#64748b', fontSize: 11, marginTop: 12, marginBottom: 6 }}>Methods</div>
        {d.methods.map((m, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 4, padding: '6px 8px', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="name"
                value={m.name}
                onChange={e => {
                  const methods = [...d.methods];
                  methods[i] = { ...methods[i], name: e.target.value };
                  update({ methods });
                }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="return"
                value={m.returnType}
                onChange={e => {
                  const methods = [...d.methods];
                  methods[i] = { ...methods[i], returnType: e.target.value };
                  update({ methods });
                }}
              />
            </div>
            <input
              style={{ ...inputStyle, marginBottom: 4 }}
              placeholder="params (e.g. String name)"
              value={m.params}
              onChange={e => {
                const methods = [...d.methods];
                methods[i] = { ...methods[i], params: e.target.value };
                update({ methods });
              }}
            />
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <select
                style={{ ...selectStyle, flex: 1 }}
                value={m.visibility}
                onChange={e => {
                  const methods = [...d.methods];
                  methods[i] = { ...methods[i], visibility: e.target.value as 'public' | 'private' | 'protected' };
                  update({ methods });
                }}
              >
                <option value="public">public</option>
                <option value="protected">protected</option>
                <option value="private">private</option>
              </select>
              <button
                style={{ ...btnStyle, color: '#f87171', marginTop: 0 }}
                onClick={() => update({ methods: d.methods.filter((_, mi) => mi !== i) })}
              ><XIcon size={9} /></button>
            </div>
          </div>
        ))}
        <button style={btnStyle} onClick={() => update({ methods: [...d.methods, { name: 'method', returnType: 'void', params: '', visibility: 'public' }] })}>
          + Add Method
        </button>
      </div>
    );
  }

  // --- SEQUENCE NODE ---
  if (node.type === 'sequenceNode') {
    const d = node.data as unknown as SequenceNodeData;
    return (
      <div style={{ width: 220, background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 16, fontSize: 12 }}>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Participant
        </div>
        <Field label="Name">
          <input style={inputStyle} value={d.label} onChange={e => update({ label: e.target.value })} />
        </Field>
        <Field label="Type">
          <select style={selectStyle} value={d.type} onChange={e => update({ type: e.target.value })}>
            <option value="actor">Actor</option>
            <option value="object">Object</option>
            <option value="boundary">Boundary</option>
            <option value="controller">Controller</option>
          </select>
        </Field>
      </div>
    );
  }

  // --- FLOW NODE ---
  if (node.type === 'flowNode') {
    const d = node.data as unknown as FlowNodeData;
    return (
      <div style={{ width: 220, background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 16, fontSize: 12 }}>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Flow Step
        </div>
        <Field label="Label">
          <input style={inputStyle} value={d.label} onChange={e => update({ label: e.target.value })} />
        </Field>
        <Field label="Type">
          <select style={selectStyle} value={d.type} onChange={e => update({ type: e.target.value })}>
            <option value="start">Start</option>
            <option value="process">Process</option>
            <option value="decision">Decision</option>
            <option value="io">Input/Output</option>
            <option value="end">End</option>
          </select>
        </Field>
      </div>
    );
  }

  // --- ER NODE ---
  if (node.type === 'erNode') {
    const d = node.data as unknown as ErNodeData;
    return (
      <div style={{ width: 220, background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 16, overflowY: 'auto', fontSize: 12 }}>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Entity
        </div>
        <Field label="Table Name">
          <input style={inputStyle} value={d.label} onChange={e => update({ label: e.target.value })} />
        </Field>

        <div style={{ color: '#64748b', fontSize: 11, marginTop: 12, marginBottom: 6 }}>Attributes</div>
        {d.attributes.map((attr, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 4, padding: '6px 8px', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="name"
                value={attr.name}
                onChange={e => {
                  const attributes = [...d.attributes];
                  attributes[i] = { ...attributes[i], name: e.target.value };
                  update({ attributes });
                }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="type"
                value={attr.type}
                onChange={e => {
                  const attributes = [...d.attributes];
                  attributes[i] = { ...attributes[i], type: e.target.value };
                  update({ attributes });
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
              <label style={{ color: '#fbbf24', display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!attr.isPrimary} onChange={e => {
                  const attributes = [...d.attributes];
                  attributes[i] = { ...attributes[i], isPrimary: e.target.checked };
                  update({ attributes });
                }} />
                PK
              </label>
              <label style={{ color: '#6ee7b7', display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!attr.isForeign} onChange={e => {
                  const attributes = [...d.attributes];
                  attributes[i] = { ...attributes[i], isForeign: e.target.checked };
                  update({ attributes });
                }} />
                FK
              </label>
              <button
                style={{ ...btnStyle, color: '#f87171', marginTop: 0, marginLeft: 'auto' }}
                onClick={() => update({ attributes: d.attributes.filter((_, ai) => ai !== i) })}
              ><XIcon size={9} /></button>
            </div>
          </div>
        ))}
        <button style={btnStyle} onClick={() => update({ attributes: [...d.attributes, { name: 'column', type: 'VARCHAR' }] })}>
          + Add Attribute
        </button>
      </div>
    );
  }

  return null;
}

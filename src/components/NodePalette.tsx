import React, { useState } from 'react';
import { useBTStore } from '../store/btStore';
import { CATEGORY_COLORS, PORT_DIRECTIONS } from '../types/bt-constants';
import type { BTNodeCategory, BTNodeDefinition, BTPort, PortDirection } from '../types/bt';

const CATEGORIES: BTNodeCategory[] = ['Control', 'Decorator', 'Action', 'Condition', 'SubTree'];

// Port form state (all fields optional for editing)
interface PortFormState {
  name: string;
  direction: PortDirection;
  description: string;
  defaultValue: string;
}

const emptyPort: PortFormState = {
  name: '',
  direction: 'input',
  description: '',
  defaultValue: '',
};

const NodePalette: React.FC = () => {
  const { project, addNodeModel, deleteNodeModel } = useBTStore();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));

  // Add node form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeCat, setNewNodeCat] = useState<BTNodeCategory>('Action');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodePorts, setNewNodePorts] = useState<PortFormState[]>([]);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const byCategory = (cat: BTNodeCategory) =>
    project.nodeModels.filter((m) => m.category === cat);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/btnode-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Port management
  const addPort = () => {
    setNewNodePorts((prev) => [...prev, { ...emptyPort }]);
  };

  const removePort = (index: number) => {
    setNewNodePorts((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePort = (index: number, field: keyof PortFormState, value: string) => {
    setNewNodePorts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleAddNode = () => {
    const trimmed = newNodeName.trim();
    if (!trimmed) {
      alert('Please enter a node type name');
      return;
    }
    const existing = project.nodeModels.find((m) => m.type === trimmed);
    if (existing) {
      alert(`Node type "${trimmed}" already exists`);
      return;
    }

    // Filter out ports with empty names
    const validPorts: BTPort[] = newNodePorts
      .filter((p) => p.name.trim() !== '')
      .map((p) => ({
        name: p.name.trim(),
        direction: p.direction,
        description: p.description.trim() || undefined,
        defaultValue: p.defaultValue.trim() || undefined,
      }));

    const def: BTNodeDefinition = {
      type: trimmed,
      category: newNodeCat,
      description: newNodeDesc.trim() || undefined,
      ports: validPorts.length > 0 ? validPorts : undefined,
    };

    addNodeModel(def);

    // Reset form
    setNewNodeName('');
    setNewNodeDesc('');
    setNewNodePorts([]);
    setShowAddForm(false);
  };

  const cancelAdd = () => {
    setNewNodeName('');
    setNewNodeDesc('');
    setNewNodePorts([]);
    setShowAddForm(false);
  };

  return (
    <div className="panel node-palette">
      <div className="panel-header">Node Palette</div>

      {CATEGORIES.map((cat) => {
        const nodes = byCategory(cat);
        const colors = CATEGORY_COLORS[cat];
        const isExpanded = expandedCats.has(cat);

        return (
          <div key={cat} style={{ marginBottom: 4 }}>
            <button
              className="cat-header"
              style={{ borderColor: colors.border, color: colors.text }}
              onClick={() => toggleCat(cat)}
            >
              <span>{isExpanded ? '▼' : '▶'} {cat}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>{nodes.length}</span>
            </button>

            {isExpanded && (
              <div style={{ paddingLeft: 4 }}>
                {nodes.map((node) => (
                  <PaletteItem
                    key={node.type}
                    def={node}
                    colors={colors}
                    onDragStart={onDragStart}
                    onDelete={!node.builtin ? deleteNodeModel : undefined}
                  />
                ))}
                {nodes.length === 0 && (
                  <div style={{ fontSize: 11, color: '#556', padding: '4px 8px' }}>
                    No nodes
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add custom node */}
      <div style={{ marginTop: 12, borderTop: '1px solid #334', paddingTop: 8 }}>
        {!showAddForm ? (
          <button
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
            style={{ width: '100%' }}
          >
            + Add Custom Node
          </button>
        ) : (
          <div style={{ padding: '4px 0' }}>
            <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 6 }}>Create Custom Node</div>

            {/* Node Type */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, color: '#6677aa', display: 'block', marginBottom: 2 }}>
                Node Type *
              </label>
              <input
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="e.g. MoveToGoal"
                style={{
                  width: '100%',
                  background: '#1a1a2e',
                  border: '1px solid #334',
                  color: '#ccd',
                  borderRadius: 4,
                  padding: '4px 6px',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, color: '#6677aa', display: 'block', marginBottom: 2 }}>
                Category
              </label>
              <select
                value={newNodeCat}
                onChange={(e) => setNewNodeCat(e.target.value as BTNodeCategory)}
                style={{
                  width: '100%',
                  background: '#1a1a2e',
                  border: '1px solid #334',
                  color: '#ccd',
                  borderRadius: 4,
                  padding: '4px 6px',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              >
                <option value="Action">Action</option>
                <option value="Condition">Condition</option>
                <option value="Control">Control</option>
                <option value="Decorator">Decorator</option>
                <option value="SubTree">SubTree</option>
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, color: '#6677aa', display: 'block', marginBottom: 2 }}>
                Description
              </label>
              <input
                value={newNodeDesc}
                onChange={(e) => setNewNodeDesc(e.target.value)}
                placeholder="Optional description"
                style={{
                  width: '100%',
                  background: '#1a1a2e',
                  border: '1px solid #334',
                  color: '#ccd',
                  borderRadius: 4,
                  padding: '4px 6px',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Ports */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <label style={{ fontSize: 10, color: '#6677aa' }}>
                  Ports {newNodePorts.length > 0 && `(${newNodePorts.length})`}
                </label>
                <button
                  type="button"
                  onClick={addPort}
                  style={{
                    background: 'none',
                    border: '1px solid #334',
                    color: '#88aacc',
                    borderRadius: 3,
                    padding: '1px 6px',
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  + Port
                </button>
              </div>

              {newNodePorts.map((port, index) => (
                <div
                  key={index}
                  style={{
                    background: '#151525',
                    border: '1px solid #2a3a5a',
                    borderRadius: 4,
                    padding: '6px',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <input
                      value={port.name}
                      onChange={(e) => updatePort(index, 'name', e.target.value)}
                      placeholder="Port name"
                      style={{
                        flex: 1,
                        background: '#1a1a2e',
                        border: '1px solid #334',
                        color: '#ccd',
                        borderRadius: 3,
                        padding: '2px 4px',
                        fontSize: 11,
                      }}
                    />
                    <select
                      value={port.direction}
                      onChange={(e) => updatePort(index, 'direction', e.target.value)}
                      style={{
                        width: 80,
                        background: '#1a1a2e',
                        border: '1px solid #334',
                        color: '#ccd',
                        borderRadius: 3,
                        padding: '2px 4px',
                        fontSize: 11,
                      }}
                    >
                      {PORT_DIRECTIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removePort(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e04040',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: '0 2px',
                      }}
                      title="Remove port"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select
                      value={port.defaultValue ? 'custom' : ''}
                      onChange={(e) => updatePort(index, 'defaultValue', e.target.value)}
                      style={{
                        width: 80,
                        background: '#1a1a2e',
                        border: '1px solid #334',
                        color: '#ccd',
                        borderRadius: 3,
                        padding: '2px 4px',
                        fontSize: 10,
                      }}
                    >
                      <option value="">No default</option>
                      <option value="custom">Custom</option>
                    </select>
                    {port.defaultValue !== undefined && (
                      <input
                        value={port.defaultValue}
                        onChange={(e) => updatePort(index, 'defaultValue', e.target.value)}
                        placeholder="Default"
                        style={{
                          flex: 1,
                          background: '#1a1a2e',
                          border: '1px solid #334',
                          color: '#ccd',
                          borderRadius: 3,
                          padding: '2px 4px',
                          fontSize: 10,
                        }}
                      />
                    )}
                    <input
                      value={port.description}
                      onChange={(e) => updatePort(index, 'description', e.target.value)}
                      placeholder="Description"
                      style={{
                        flex: 1,
                        background: '#1a1a2e',
                        border: '1px solid #334',
                        color: '#ccd',
                        borderRadius: 3,
                        padding: '2px 4px',
                        fontSize: 10,
                      }}
                    />
                  </div>
                </div>
              ))}

              {newNodePorts.length === 0 && (
                <div style={{ fontSize: 10, color: '#556', textAlign: 'center', padding: '4px' }}>
                  No ports defined
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <button
                className="btn-secondary"
                onClick={cancelAdd}
                style={{ flex: 1, fontSize: 11, padding: '4px' }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddNode}
                style={{ flex: 1, fontSize: 11, padding: '4px' }}
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface PaletteItemProps {
  def: BTNodeDefinition;
  colors: { bg: string; border: string; text: string };
  onDragStart: (e: React.DragEvent, type: string) => void;
  onDelete?: (type: string) => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ def, colors, onDragStart, onDelete }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, def.type)}
    className="palette-item"
    style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
    title={def.description || def.type}
  >
    <span style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {def.type}
    </span>
    {onDelete && (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(def.type); }}
        style={{
          background: 'none',
          border: 'none',
          color: '#e04040',
          cursor: 'pointer',
          padding: '0 2px',
          fontSize: 12,
          lineHeight: 1,
        }}
        title="Delete custom node"
      >
        ✕
      </button>
    )}
  </div>
);

export default NodePalette;

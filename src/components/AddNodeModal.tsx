import React, { useState, useEffect } from 'react';
import { CATEGORY_COLORS, PORT_DIRECTIONS } from '../types/bt-constants';
import type { BTNodeCategory, BTNodeDefinition, BTPort, PortDirection } from '../types/bt';

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

interface AddNodeModalProps {
  onSave: (def: BTNodeDefinition) => void;
  onClose: () => void;
}

const AddNodeModal: React.FC<AddNodeModalProps> = ({ onSave, onClose }) => {
  const [nodeType, setNodeType] = useState('');
  const [category, setCategory] = useState<BTNodeCategory>('Action');
  const [description, setDescription] = useState('');
  const [ports, setPorts] = useState<PortFormState[]>([]);

  // Reset on open
  useEffect(() => {
    setNodeType('');
    setCategory('Action');
    setDescription('');
    setPorts([]);
  }, []);

  const handleAddPort = () => {
    setPorts((prev) => [...prev, { ...emptyPort }]);
  };

  const handleRemovePort = (index: number) => {
    setPorts((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePortChange = (index: number, field: keyof PortFormState, value: string) => {
    setPorts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = () => {
    const trimmed = nodeType.trim();
    if (!trimmed) {
      alert('Please enter a node type name');
      return;
    }

    const validPorts: BTPort[] = ports
      .filter((p) => p.name.trim() !== '')
      .map((p) => ({
        name: p.name.trim(),
        direction: p.direction,
        description: p.description.trim() || undefined,
        defaultValue: p.defaultValue.trim() || undefined,
      }));

    const def: BTNodeDefinition = {
      type: trimmed,
      category,
      description: description.trim() || undefined,
      ports: validPorts.length > 0 ? validPorts : undefined,
    };

    onSave(def);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const colors = CATEGORY_COLORS[category];

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content add-node-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span style={{ color: '#c8e0ff' }}>Create Custom Node</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Node Type & Category Row */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Node Type *</label>
              <input
                type="text"
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value)}
                placeholder="e.g. MoveToGoal"
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BTNodeCategory)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="Action">Action</option>
                <option value="Condition">Condition</option>
                <option value="Control">Control</option>
                <option value="Decorator">Decorator</option>
                <option value="SubTree">SubTree</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this node"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Ports Section */}
          <div className="form-group">
            <div className="ports-header">
              <label>
                Ports
                {ports.length > 0 && <span className="ports-count">({ports.length})</span>}
              </label>
              <button type="button" className="btn-add-port" onClick={handleAddPort}>
                + Add Port
              </button>
            </div>

            {ports.length > 0 && (
              <div className="ports-list">
                {ports.map((port, index) => (
                  <div key={index} className="port-item">
                    <div className="port-item-header">
                      <span className="port-index">#{index + 1}</span>
                      <button
                        type="button"
                        className="btn-remove-port"
                        onClick={() => handleRemovePort(index)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="port-item-body">
                      <div className="port-field port-field-name">
                        <label>Name</label>
                        <input
                          type="text"
                          value={port.name}
                          onChange={(e) => handlePortChange(index, 'name', e.target.value)}
                          placeholder="e.g. msec"
                        />
                      </div>
                      <div className="port-field port-field-dir">
                        <label>Direction</label>
                        <select
                          value={port.direction}
                          onChange={(e) => handlePortChange(index, 'direction', e.target.value)}
                        >
                          {PORT_DIRECTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="port-field port-field-default">
                        <label>Default</label>
                        <input
                          type="text"
                          value={port.defaultValue}
                          onChange={(e) => handlePortChange(index, 'defaultValue', e.target.value)}
                          placeholder="-1, true, ..."
                        />
                      </div>
                    </div>
                    <div className="port-field port-field-desc">
                      <label>Description</label>
                      <input
                        type="text"
                        value={port.description}
                        onChange={(e) => handlePortChange(index, 'description', e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ports.length === 0 && (
              <div className="ports-empty">
                No ports defined. Ports are optional — click "Add Port" to define input/output parameters.
              </div>
            )}
          </div>

          {/* Preview */}
          {nodeType && (
            <div className="node-preview">
              <div className="preview-label">Preview</div>
              <div
                className="preview-node"
                style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
              >
                <div className="preview-category">{category}</div>
                <div className="preview-type">{nodeType}</div>
                {description && <div className="preview-desc">{description}</div>}
                {ports.length > 0 && (
                  <div className="preview-ports">
                    {ports.filter(p => p.name).map((p, i) => (
                      <div key={i} className="preview-port">
                        <span className="preview-port-dir">{p.direction}</span>
                        <span className="preview-port-name">{p.name}</span>
                        {p.defaultValue && <span className="preview-port-default">= {p.defaultValue}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Create Node</button>
        </div>
      </div>
    </div>
  );
};

export default AddNodeModal;

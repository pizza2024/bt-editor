import React, { useState, useEffect } from 'react';
import { CATEGORY_COLORS, PORT_DIRECTIONS, PORT_TYPES } from '../types/bt-constants';
import type { BTNodeCategory, BTNodeDefinition, BTPort, PortDirection } from '../types/bt';
import { validateNodeModel } from '../utils/btXml';
import { X, Plus, AlertTriangle } from 'lucide-react';

interface PortFormState {
  name: string;
  direction: PortDirection;
  description: string;
  defaultValue: string;
  portType: string;
}

const emptyPort: PortFormState = {
  name: '',
  direction: 'input',
  description: '',
  defaultValue: '',
  portType: 'string',
};

interface NodeModelModalProps {
  /** Create new model */
  mode: 'create';
  defaultCategory?: BTNodeCategory;
  existingModels?: BTNodeDefinition[];
  onSave: (def: BTNodeDefinition) => void;
  onClose: () => void;
}

interface NodeModelEditProps {
  /** Edit existing model definition */
  mode: 'edit';
  nodeDef: BTNodeDefinition;
  onSave: (def: BTNodeDefinition) => void;
  onDelete?: (type: string) => void;
  onClose: () => void;
}

interface NodeModelViewProps {
  /** View existing model definition in read-only mode */
  mode: 'view';
  nodeDef: BTNodeDefinition;
  onClose: () => void;
}

type Props = NodeModelModalProps | NodeModelEditProps | NodeModelViewProps;

const NodeModelModal: React.FC<Props> = (props) => {
  const isCreate = props.mode === 'create';
  const isEdit = props.mode === 'edit';
  const isView = props.mode === 'view';
  const isReadonly = isView;

  // Form state
  const [nodeType, setNodeType] = useState('');
  const [category, setCategory] = useState<BTNodeCategory>('Action');
  const [description, setDescription] = useState('');
  const [ports, setPorts] = useState<PortFormState[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize
  useEffect(() => {
    if (isCreate) {
      setNodeType('');
      setCategory(props.defaultCategory ?? 'Action');
      setDescription('');
      setPorts([]);
    } else {
      const def = props.nodeDef;
      setNodeType(def.type);
      setCategory(def.category);
      setDescription(def.description ?? '');
      setPorts(def.ports?.map(p => ({
        name: p.name,
        direction: p.direction,
        description: p.description ?? '',
        defaultValue: p.defaultValue ?? '',
        portType: p.portType ?? 'string',
      })) ?? []);
    }
  }, [props]);

  // Port management
  const handleAddPort = () => setPorts(prev => [...prev, { ...emptyPort }]);

  const handleRemovePort = (index: number) => {
    setPorts(prev => prev.filter((_, i) => i !== index));
  };

  const handlePortChange = (index: number, field: keyof PortFormState, value: string) => {
    setPorts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    if (isView) return;

    const trimmed = nodeType.trim();

    const validPorts: BTPort[] = ports
      .filter(p => p.name.trim())
      .map(p => ({
        name: p.name.trim(),
        direction: p.direction,
        portType: p.portType !== 'string' ? p.portType : undefined,
        description: p.description.trim() || undefined,
        defaultValue: p.defaultValue.trim() || undefined,
      }));

    const def: BTNodeDefinition = isCreate
      ? { type: trimmed, category, description: description.trim() || undefined, ports: validPorts.length > 0 ? validPorts : undefined }
      : { ...(props as NodeModelEditProps).nodeDef, category, description: description.trim() || undefined, ports: validPorts.length > 0 ? validPorts : undefined };

    // Run node model validation
    const existingModels = isCreate ? (props as NodeModelModalProps).existingModels ?? [] : [];
    const issues = validateNodeModel(def, existingModels);
    const errors = issues.filter(i => i.severity === 'error');
    if (errors.length > 0) {
      setValidationErrors(errors.map(e => e.message));
      return;
    }

    setValidationErrors([]);
    if (isCreate) {
      props.onSave(def);
    } else {
      props.onSave(def);
    }
    props.onClose();
  };

  const handleDelete = () => {
    if (isEdit && (props as NodeModelEditProps).onDelete) {
      (props as NodeModelEditProps).onDelete!(props.nodeDef.type);
      props.onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) props.onClose();
  };

  const colors = CATEGORY_COLORS[category];

  const getTitle = () => {
    if (isCreate) return 'Create Model';
    if (isView) return `Model Definition: ${nodeType}`;
    return `Edit Model: ${nodeType}`;
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content node-model-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span style={{ color: colors.text }}>{getTitle()}</span>
          </div>
          <button className="modal-close" onClick={props.onClose}><X size={14} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {isReadonly && (
            <div className="info-text" style={{ marginBottom: 12 }}>
              This model definition is read-only when opened from the Models Palette.
            </div>
          )}

          {/* Node Type + Category Row */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Node Type *</label>
              <input
                type="text"
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value)}
                placeholder="e.g. MoveToGoal"
                disabled={!isCreate || isReadonly}
                className={!isCreate || isReadonly ? 'input-disabled' : ''}
                autoFocus={isCreate}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BTNodeCategory)}
                disabled={!isCreate || isReadonly}
                className={!isCreate || isReadonly ? 'input-disabled' : ''}
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
              placeholder="Optional description of this node type"
              disabled={isReadonly}
              className={isReadonly ? 'input-disabled' : ''}
            />
          </div>

          {/* Ports Section */}
          <div className="form-group">
            <div className="ports-header">
              <label>
                Port Definitions
                {ports.length > 0 && <span className="ports-count">({ports.length})</span>}
              </label>
              {!isReadonly && (
                <button type="button" className="btn-add-port" onClick={handleAddPort}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Plus size={12} />Add Port</span>
                </button>
              )}
            </div>

            {ports.length > 0 && (
              <div className="ports-list">
                {ports.map((port, index) => (
                  <div key={index} className="port-item">
                    <div className="port-item-header">
                      <span className="port-index">#{index + 1}</span>
                      {!isReadonly && (
                        <button
                          type="button"
                          className="btn-remove-port"
                          onClick={() => handleRemovePort(index)}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <div className="port-item-body">
                      <div className="port-field port-field-name">
                        <label>Name</label>
                        <input
                          type="text"
                          value={port.name}
                          onChange={(e) => handlePortChange(index, 'name', e.target.value)}
                          placeholder="e.g. msec"
                          disabled={isReadonly}
                          className={isReadonly ? 'input-disabled' : ''}
                        />
                      </div>
                      <div className="port-field port-field-dir">
                        <label>Direction</label>
                        <select
                          value={port.direction}
                          onChange={(e) => handlePortChange(index, 'direction', e.target.value)}
                          disabled={isReadonly}
                          className={isReadonly ? 'input-disabled' : ''}
                        >
                          {PORT_DIRECTIONS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="port-field port-field-type">
                        <label>Type</label>
                        <select
                          value={port.portType}
                          onChange={(e) => handlePortChange(index, 'portType', e.target.value)}
                          disabled={isReadonly}
                          className={isReadonly ? 'input-disabled' : ''}
                        >
                          {PORT_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
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
                          disabled={isReadonly}
                          className={isReadonly ? 'input-disabled' : ''}
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
                        disabled={isReadonly}
                        className={isReadonly ? 'input-disabled' : ''}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ports.length === 0 && (
              <div className="ports-empty">
                No ports defined. Click "Add Port" to define input/output parameters for this node type.
              </div>
            )}
          </div>

          {/* Preview */}
          {isCreate && nodeType && (
            <div className="node-preview">
              <div className="preview-label">Preview</div>
              <div
                className="preview-node"
                style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
              >
                <div className="preview-category">{category}</div>
                <div className="preview-type">{nodeType}</div>
                {description && <div className="preview-desc">{description}</div>}
                {ports.filter(p => p.name).length > 0 && (
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
          {validationErrors.length > 0 && (
            <div className="validation-errors">
              {validationErrors.map((err, i) => (
                <div key={i} className="validation-error-item"><AlertTriangle size={12} style={{ marginRight: 4 }} />{err}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {isEdit && (
            <button
              className="btn-danger"
              onClick={handleDelete}
              style={{ marginRight: 'auto' }}
            >
              Delete
            </button>
          )}
          <button className="btn-secondary" onClick={props.onClose}>{isView ? 'Close' : 'Cancel'}</button>
          {!isView && (
            <button className="btn-primary" onClick={handleSave}>
              {isCreate ? 'Create' : 'Update'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeModelModal;

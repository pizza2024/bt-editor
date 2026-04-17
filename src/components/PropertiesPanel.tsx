import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTStore, useBTStoreApi } from '../store/BTStoreProvider';
import type { BTNodeDefinition } from '../types/bt';
import { CATEGORY_COLORS } from '../types/bt-constants';
import type { Node } from '@xyflow/react';
import { useBTEditorIntegration, isIntegrationReadonly } from '../integration/context';
import { dispatchEditorWindowEvent } from '../integration/editorEvents';

// Pre/post condition attribute keys (matching NodeEditModal)
const PRE_KEYS = ['_failureIf', '_successIf', '_skipIf', '_while'] as const;
const POST_KEYS = ['_onSuccess', '_onFailure', '_onHalted', '_post'] as const;

// Map internal condition keys to i18n keys (strip leading underscore)
const PRE_I18N_KEYS: Record<string, string> = {
  _failureIf: 'failureIf',
  _successIf: 'successIf',
  _skipIf: 'skipIf',
  _while: 'while',
};

const POST_I18N_KEYS: Record<string, string> = {
  _onSuccess: 'onSuccess',
  _onFailure: 'onFailure',
  _onHalted: 'onHalted',
  _post: 'post',
};

const PropertiesPanel: React.FC = () => {
  const { t } = useTranslation();
  const integration = useBTEditorIntegration();
  const storeApi = useBTStoreApi();
  const { project, activeTreeId, selectedNodeId, updateNodePorts, updateNodeName, updateNodeConditions, localNodes, setLocalCanvas } = useBTStore();
  const readonly = isIntegrationReadonly(integration);

  // Use refs to always get current values in callbacks (avoid stale closure)
  const selectedNodeIdRef = useRef(selectedNodeId);
  const localNodesRef = useRef(localNodes);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);
  useEffect(() => { localNodesRef.current = localNodes; }, [localNodes]);

  // Find the selected BT node in the active tree
  const tree = project.trees.find((t) => t.id === activeTreeId);
  // First try to find in store tree, fall back to local canvas nodes
  let btNode = selectedNodeId && tree ? findNode(tree.root, selectedNodeId) : null;

  // If not found in store tree (e.g., node just created, not yet saved),
  // look up from local canvas nodes
  if (!btNode && selectedNodeId) {
    const localNode = localNodes.find((n) => n.id === selectedNodeId);
    if (localNode) {
      const data = localNode.data as {
        nodeType: string;
        label: string;
        ports?: Record<string, string>;
        category?: string;
        preconditions?: Record<string, string>;
        postconditions?: Record<string, string>;
      };
      btNode = {
        id: localNode.id,
        type: data.nodeType,
        name: data.label !== data.nodeType ? data.label : undefined,
        ports: (data.ports as Record<string, string>) ?? {},
        preconditions: data.preconditions,
        postconditions: data.postconditions,
        children: [],
      };
    }
  }

  const nodeDef: BTNodeDefinition | undefined = btNode
    ? project.nodeModels.find((m) => m.type === btNode.type)
    : undefined;

  const nodeCategory = nodeDef?.category ?? 'Control';
  const colors = CATEGORY_COLORS[nodeCategory] ?? CATEGORY_COLORS.Control;

  // Force re-render when node selection changes
  const nodeKey = selectedNodeId ?? 'none';

  // Local state for edited port values
  const [localPorts, setLocalPorts] = useState<Record<string, string>>({});
  useEffect(() => {
    setLocalPorts(btNode?.ports ? { ...btNode.ports } : {});
  }, [nodeKey, btNode?.ports]);

  // Local state for node name
  const [localName, setLocalName] = useState('');
  useEffect(() => {
    setLocalName(btNode?.name ?? '');
  }, [nodeKey, btNode?.name]);

  // Local state for SubTree target
  const [localSubTreeId, setLocalSubTreeId] = useState('');
  useEffect(() => {
    setLocalSubTreeId(btNode?.name ?? '');
  }, [nodeKey, btNode?.name]);

  // Local state for preconditions
  const [localPreconditions, setLocalPreconditions] = useState<Record<string, string>>({});
  useEffect(() => {
    const initPre: Record<string, string> = {};
    PRE_KEYS.forEach(k => { initPre[k] = btNode?.preconditions?.[k] ?? ''; });
    setLocalPreconditions(initPre);
  }, [nodeKey, btNode?.preconditions]);

  // Local state for postconditions
  const [localPostconditions, setLocalPostconditions] = useState<Record<string, string>>({});
  useEffect(() => {
    const initPost: Record<string, string> = {};
    POST_KEYS.forEach(k => { initPost[k] = btNode?.postconditions?.[k] ?? ''; });
    setLocalPostconditions(initPost);
  }, [nodeKey, btNode?.postconditions]);

  const allPorts = nodeDef?.ports ?? [];
  const isLeaf = nodeCategory === 'Action' || nodeCategory === 'Condition' || nodeCategory === 'SubTree';
  const isSubTree = btNode?.type === 'SubTree';

  // Save handler for port values
  // For nodes already in the tree, update both tree and localNodes.
  // For nodes only in localNodes (not yet synced), only update localNodes.
  const handleSavePorts = useCallback(() => {
    if (readonly) return;
    if (!btNode) return;
    const { localEdges } = storeApi.getState();
    const currentLocalNodes = localNodesRef.current;
    // Build updated flow nodes with new ports merged
    const mergedPorts = { ...btNode.ports, ...localPorts };
    const updated = currentLocalNodes.map((n: Node) => {
      if (n.id !== btNode.id) return n;
      return { ...n, data: { ...n.data, ports: mergedPorts } };
    });
    // Check if node exists in the tree (not just in localNodes)
    const tree = project.trees.find((t) => t.id === activeTreeId);
    const nodeInTree = tree ? findNode(tree.root, btNode.id) : null;
    if (nodeInTree) {
      // Node is in tree - update tree and localNodes
      updateNodePorts(btNode.id, localPorts);
      setLocalCanvas(updated, localEdges);
    } else {
      // Node only in localNodes (not yet synced to tree) - only update localNodes
      setLocalCanvas(updated, localEdges);
    }
    // Notify ReactFlow canvas to refresh nodes from localNodes
    dispatchEditorWindowEvent('bt-nodes-updated');
  }, [btNode, localPorts, updateNodePorts, setLocalCanvas, project.trees, activeTreeId, readonly]);

  // Save handler for name
  const handleSaveName = useCallback(() => {
    if (readonly) return;
    if (!btNode) return;
    const { localEdges } = storeApi.getState();
    const currentLocalNodes = localNodesRef.current;
    const updated = currentLocalNodes.map((n: Node) => {
      if (n.id !== btNode.id) return n;
      return { ...n, data: { ...n.data, label: localName } };
    });
    // Check if node exists in the tree
    const tree = project.trees.find((t) => t.id === activeTreeId);
    const nodeInTree = tree ? findNode(tree.root, btNode.id) : null;
    if (nodeInTree) {
      updateNodeName(btNode.id, localName);
      setLocalCanvas(updated, localEdges);
    } else {
      setLocalCanvas(updated, localEdges);
    }
    dispatchEditorWindowEvent('bt-nodes-updated');
  }, [btNode, localName, updateNodeName, setLocalCanvas, project.trees, activeTreeId, readonly]);

  // Save handler for SubTree target
  const handleSaveSubTree = useCallback(() => {
    if (readonly) return;
    if (!btNode) return;
    const { localEdges } = storeApi.getState();
    const currentLocalNodes = localNodesRef.current;
    const updated = currentLocalNodes.map((n: Node) => {
      if (n.id !== btNode.id) return n;
      return { ...n, data: { ...n.data, label: localSubTreeId } };
    });
    // Check if node exists in the tree
    const tree = project.trees.find((t) => t.id === activeTreeId);
    const nodeInTree = tree ? findNode(tree.root, btNode.id) : null;
    if (nodeInTree) {
      updateNodeName(btNode.id, localSubTreeId);
      setLocalCanvas(updated, localEdges);
    } else {
      setLocalCanvas(updated, localEdges);
    }
    dispatchEditorWindowEvent('bt-nodes-updated');
  }, [btNode, localSubTreeId, updateNodeName, setLocalCanvas, project.trees, activeTreeId, readonly]);

  // Save handler for pre/post conditions
  const handleSaveConditions = useCallback(() => {
    if (readonly) return;
    if (!btNode) return;
    const { localEdges } = storeApi.getState();
    const currentLocalNodes = localNodesRef.current;

    // Clean up empty conditions
    const cleanPre: Record<string, string> = {};
    PRE_KEYS.forEach(k => { if (localPreconditions[k]?.trim()) cleanPre[k] = localPreconditions[k].trim(); });

    const cleanPost: Record<string, string> = {};
    POST_KEYS.forEach(k => { if (localPostconditions[k]?.trim()) cleanPost[k] = localPostconditions[k].trim(); });

    // Build updated flow nodes with new conditions merged into data
    const updated = currentLocalNodes.map((n: Node) => {
      if (n.id !== btNode.id) return n;
      return {
        ...n,
        data: {
          ...n.data,
          preconditions: Object.keys(cleanPre).length > 0 ? cleanPre : undefined,
          postconditions: Object.keys(cleanPost).length > 0 ? cleanPost : undefined,
        },
      };
    });

    // Check if node exists in the tree
    const tree = project.trees.find((t) => t.id === activeTreeId);
    const nodeInTree = tree ? findNode(tree.root, btNode.id) : null;
    if (nodeInTree) {
      // Node is in tree - update tree and localNodes
      updateNodeConditions(
        btNode.id,
        Object.keys(cleanPre).length > 0 ? cleanPre : undefined,
        Object.keys(cleanPost).length > 0 ? cleanPost : undefined
      );
      setLocalCanvas(updated, localEdges);
    } else {
      // Node only in localNodes (not yet synced to tree) - only update localNodes
      setLocalCanvas(updated, localEdges);
    }
    dispatchEditorWindowEvent('bt-nodes-updated');
  }, [btNode, localPreconditions, localPostconditions, updateNodeConditions, setLocalCanvas, project.trees, activeTreeId, readonly]);

  const updatePort = (name: string, value: string) => {
    setLocalPorts((prev) => ({ ...prev, [name]: value }));
  };

  if (!btNode) {
    return (
      <div className="panel properties-panel">
        <div className="panel-header">{t('properties.panel')}</div>
        <div className="properties-empty-state">
          {t('properties.selectNode')}
        </div>
      </div>
    );
  }

  return (
    <div className="panel properties-panel">
      <div className="panel-header">{t('properties.panel')}</div>

      {/* Node identity */}
      <div
        className="properties-node-card"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="properties-node-category" style={{ color: colors.text }}>
          {nodeDef?.category ?? 'Unknown'}
        </div>
        <div className="properties-node-title" style={{ color: colors.text }}>{btNode.type}</div>
        {nodeDef?.description && (
          <div className="properties-node-desc" style={{ color: colors.text }}>
            {nodeDef.description}
          </div>
        )}
      </div>

      {/* Node Name (for Control/Decorator/SubTree) */}
      {(nodeDef || isSubTree) && !isLeaf && (
        <Section title={t('properties.name')}>
          <div className="properties-inline-actions">
            <input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder={t('properties.optionalAlias')}
              disabled={readonly}
              style={inputStyle}
            />
            {(nodeDef || isSubTree) && (
              <button className="btn-primary" onClick={handleSaveName} style={{ flexShrink: 0 }} disabled={readonly}>
                {t('properties.save')}
              </button>
            )}
          </div>
        </Section>
      )}

      {/* SubTree Target */}
      {isSubTree && (
        <Section title={t('properties.subtreeTarget')}>
          <div className="properties-inline-actions" style={{ marginBottom: 8 }}>
            <select
              value={localSubTreeId}
              onChange={(e) => setLocalSubTreeId(e.target.value)}
              disabled={readonly}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="">{t('properties.selectTree')}</option>
              {project.trees
                .filter((tree) => tree.id !== activeTreeId)
                .map((tree) => (
                  <option key={tree.id} value={tree.id}>
                    {tree.id}
                  </option>
                ))}
            </select>
            <button className="btn-primary" onClick={handleSaveSubTree} style={{ flexShrink: 0 }} disabled={readonly}>
              {t('properties.save')}
            </button>
          </div>
          <div className="properties-hint">
            {t('properties.availableTrees', { trees: project.trees.map((tree) => tree.id).join(', ') })}
          </div>
        </Section>
      )}

      {/* Port Values */}
      {allPorts.length > 0 && (
        <Section title={t('properties.portValues')}>
          {allPorts.map((p) => (
            <div key={p.name} className="properties-field-row">
              <label className="properties-field-label" style={{ minWidth: 80 }}>
                {p.name}
                <span className="properties-field-dir">({p.direction})</span>
              </label>
              <input
                value={localPorts[p.name] ?? ''}
                onChange={(e) => updatePort(p.name, e.target.value)}
                placeholder="{}"
                disabled={readonly}
                style={inputStyle}
                title={p.description}
              />
            </div>
          ))}
          <button className="btn-primary properties-save-btn" onClick={handleSavePorts} disabled={readonly}>
            {t('properties.apply')}
          </button>
          <div className="properties-hint">
            {t('properties.portDescription')}
          </div>
        </Section>
      )}

      {/* Pre-conditions Section */}
      <Section title={t('properties.preconditions')}>
        <div className="properties-hint" style={{ marginBottom: 6 }}>
          {t('properties.preconditionsDescription')}
        </div>
        {PRE_KEYS.map(key => (
          <div key={key} className="properties-field-row">
            <label className="properties-field-label" style={{ minWidth: 90 }}>
              {t(`conditions.${PRE_I18N_KEYS[key]}`)}
            </label>
            <input
              type="text"
              value={localPreconditions[key] ?? ''}
              onChange={(e) => setLocalPreconditions(prev => ({ ...prev, [key]: e.target.value }))}
              disabled={readonly}
              placeholder={key === '_while' ? '{key} == value' : '{expression}'}
              style={inputStyle}
            />
          </div>
        ))}
        <button className="btn-primary properties-save-btn" onClick={handleSaveConditions} disabled={readonly}>
          {t('properties.save')}
        </button>
      </Section>

      {/* Post-conditions Section */}
      <Section title={t('properties.postconditions')}>
        <div className="properties-hint" style={{ marginBottom: 6 }}>
          {t('properties.postconditionsDescription')}
        </div>
        {POST_KEYS.map(key => (
          <div key={key} className="properties-field-row">
            <label className="properties-field-label" style={{ minWidth: 90 }}>
              {t(`conditions.${POST_I18N_KEYS[key]}`)}
            </label>
            <input
              type="text"
              value={localPostconditions[key] ?? ''}
              onChange={(e) => setLocalPostconditions(prev => ({ ...prev, [key]: e.target.value }))}
              disabled={readonly}
              placeholder="{expression}"
              style={inputStyle}
            />
          </div>
        ))}
        <button className="btn-primary properties-save-btn" onClick={handleSaveConditions} disabled={readonly}>
          {t('properties.save')}
        </button>
      </Section>

      {/* Node ID */}
      <div className="properties-node-id">ID: {btNode.id}</div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="properties-section">
    <div className="properties-section-title">
      {title}
    </div>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-primary)',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 12,
  width: '100%',
  boxSizing: 'border-box',
};

function findNode(
  node: import('../types/bt').BTTreeNode,
  id: string
): import('../types/bt').BTTreeNode | null {
  if (node.id === id) return node;
  for (const c of node.children) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return null;
}

export default PropertiesPanel;

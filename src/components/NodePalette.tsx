import React, { useState } from 'react';
import { useBTStore } from '../store/btStore';
import { CATEGORY_COLORS } from '../types/bt-constants';
import type { BTNodeCategory, BTNodeDefinition } from '../types/bt';
import AddNodeModal from './AddNodeModal';

const CATEGORIES: BTNodeCategory[] = ['Control', 'Decorator', 'Action', 'Condition', 'SubTree'];

const NodePalette: React.FC = () => {
  const { project, addNodeModel, deleteNodeModel } = useBTStore();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleAddNode = (def: BTNodeDefinition) => {
    addNodeModel(def);
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

      {/* Add custom node button */}
      <div style={{ marginTop: 12, borderTop: '1px solid #334', paddingTop: 8 }}>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ width: '100%' }}
        >
          + Add Custom Node
        </button>
      </div>

      {/* Add Node Modal */}
      {showAddModal && (
        <AddNodeModal
          onSave={handleAddNode}
          onClose={() => setShowAddModal(false)}
        />
      )}
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

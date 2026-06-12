import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTStore } from '../store/btStore';
import { CATEGORY_COLORS } from '../types/bt-constants';
import type { BTNodeCategory, BTNodeDefinition } from '../types/bt';
import NodeModelModal from './NodeModelModal';
import ClearableInput from './inputs/ClearableInput';

const CATEGORIES: BTNodeCategory[] = ['Action', 'Condition', 'Control', 'Decorator', 'SubTree'].sort((a, b) => a.localeCompare(b)) as BTNodeCategory[];

const NodePalette: React.FC = () => {
  const { t } = useTranslation();
  const { project, addNodeModel, updateNodeModel, deleteNodeModel } = useBTStore();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  // Model modal state: null = closed, 'create' = create new, BTNodeDefinition = edit existing
  const [modelModal, setModelModal] = useState<{ mode: 'create'; defaultCategory: BTNodeCategory } | { mode: 'edit'; def: BTNodeDefinition } | null>(null);

  // Filter models by search query. Matches against:
  //   - raw type name
  //   - description
  //   - raw category name (e.g. "Action")
  //   - localized category label (e.g. "动作" in zh, "Action" in en)
  // so users can type either English category names or their localized
  // labels and still get all models in that bucket.
  const query = searchQuery.trim().toLowerCase();
  const filteredNodes = query
    ? project.nodeModels.filter((m) => {
        if (m.type.toLowerCase().includes(query)) return true;
        if (m.description?.toLowerCase().includes(query)) return true;
        if (m.category.toLowerCase().includes(query)) return true;
        const localized = t(`palette.categories.${m.category}`).toLowerCase();
        if (localized && localized.includes(query)) return true;
        return false;
      })
    : null; // null means no search, show all by category

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const byCategory = (cat: BTNodeCategory) =>
    project.nodeModels.filter((m) => m.category === cat).sort((a, b) => a.type.localeCompare(b.type));

  // In search mode, group hits by category preserving the canonical order
  // so the user sees a familiar layout (Action → Condition → …).
  const filteredByCategory: Array<{ cat: BTNodeCategory; items: BTNodeDefinition[] }> = query
    ? CATEGORIES
        .map((cat) => ({
          cat,
          items: (filteredNodes ?? []).filter((m) => m.category === cat),
        }))
        .filter((g) => g.items.length > 0)
    : [];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/btnode-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCreate = (def: BTNodeDefinition) => {
    addNodeModel(def);
  };

  const handleUpdate = (def: BTNodeDefinition) => {
    updateNodeModel(def);
    setModelModal(null);
  };

  const handleDelete = (type: string) => {
    if (window.confirm(`Delete custom node "${type}"?`)) {
      deleteNodeModel(type);
    }
  };

  const toggleCollapse = () => setCollapsed((c) => !c);

  return (
    <div className={`panel node-palette${collapsed ? ' collapsed' : ''}`}>
      <div className="panel-header" onClick={toggleCollapse}>
        <span>Models Palette</span>
        <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
      <>
      {/* Search box */}
      <div style={{ padding: '8px 8px 4px 8px' }}>
        <ClearableInput
          type="text"
          placeholder={t('palette.searchHint')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          wrapperClassName="palette-search-wrapper"
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'var(--input-dark-bg, #0d0d1a)',
            border: '1px solid var(--border-light, #334)',
            borderRadius: 4,
            color: 'var(--text-primary, #ccd)',
            fontSize: 12,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Search results (grouped by category) or default category list */}
      {query ? (
        <div style={{ padding: '4px 4px 0 4px' }}>
          {filteredByCategory.length > 0 ? (
            filteredByCategory.map(({ cat, items }) => {
              const colors = CATEGORY_COLORS[cat];
              return (
                <div key={cat} style={{ marginBottom: 4 }}>
                  <div
                    className="cat-header"
                    // No click handler in search mode — purely a visual
                    // section header showing the matched category.
                    style={{ '--cat-accent': colors.border } as React.CSSProperties}
                  >
                    <span>{t(`palette.categories.${cat}`)}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      {t('palette.matchesInCategory', { count: items.length, category: t(`palette.categories.${cat}`) })}
                    </span>
                  </div>
                  <div style={{ paddingLeft: 4 }}>
                    {items.map((node) => (
                      <PaletteItem
                        key={node.type}
                        def={node}
                        colors={colors}
                        onDragStart={onDragStart}
                        onEdit={!node.builtin ? () => setModelModal({ mode: 'edit', def: node }) : undefined}
                        onDelete={!node.builtin ? deleteNodeModel : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px' }}>
              {t('palette.noModelsMatch', { query: searchQuery })}
            </div>
          )}
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const nodes = byCategory(cat);
          const colors = CATEGORY_COLORS[cat];
          const isExpanded = expandedCats.has(cat);

          return (
            <div key={cat} style={{ marginBottom: 4 }}>
              <button
                className="cat-header"
                style={{ '--cat-accent': colors.border } as React.CSSProperties}
                onClick={() => toggleCat(cat)}
              >
                <span>{isExpanded ? '▼' : '▶'} {t(`palette.categories.${cat}`)}</span>
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
                      onEdit={!node.builtin ? () => setModelModal({ mode: 'edit', def: node }) : undefined}
                      onDelete={!node.builtin ? deleteNodeModel : undefined}
                    />
                  ))}
                  {nodes.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>
                      No nodes
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add custom node button */}
      <div style={{ marginTop: 12, borderTop: '1px solid var(--border-light, #334)', paddingTop: 8 }}>
        <button
          className="btn-primary"
          onClick={() => setModelModal({ mode: 'create', defaultCategory: 'Action' })}
          style={{ width: '100%' }}
        >
          + Add Model
        </button>
      </div>

      {/* Node Model Modal (Create or Edit) */}
      {modelModal?.mode === 'create' && (
        <NodeModelModal
          mode="create"
          defaultCategory={modelModal.defaultCategory}
          existingModels={project.nodeModels}
          onSave={handleCreate}
          onClose={() => setModelModal(null)}
        />
      )}
      {modelModal?.mode === 'edit' && (
        <NodeModelModal
          mode="edit"
          nodeDef={modelModal.def}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setModelModal(null)}
        />
      )}
      </>
      )}
    </div>
  );
};

interface PaletteItemProps {
  def: BTNodeDefinition;
  colors: { bg: string; border: string; text: string };
  onDragStart: (e: React.DragEvent, type: string) => void;
  onEdit?: (def: BTNodeDefinition) => void;
  onDelete?: (type: string) => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ def, colors, onDragStart, onEdit, onDelete }) => (
  <div className="palette-item-wrapper">
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
    </div>
    {(onEdit || onDelete) && (
      <div className="palette-item-actions">
        {onEdit && (
          <button
            onClick={() => onEdit(def)}
            className="palette-item-btn"
            title="Edit model"
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(def.type); }}
            className="palette-item-btn danger"
            title="Delete model"
          >
            ✕
          </button>
        )}
      </div>
    )}
  </div>
);

export default NodePalette;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTStore } from '../store/BTStoreProvider';
import { CATEGORY_COLORS } from '../types/bt-constants';
import type { BTNodeCategory, BTNodeDefinition } from '../types/bt';
import NodeModelModal from './NodeModelModal';

const CATEGORIES: BTNodeCategory[] = ['Action', 'Condition', 'Control', 'Decorator', 'SubTree'].sort((a, b) => a.localeCompare(b)) as BTNodeCategory[];

type PaletteEntry = {
  def: BTNodeDefinition;
  displayLabel?: string;
  subtreeTarget?: string;
  isGeneratedSubTree?: boolean;
};

const NodePalette: React.FC = () => {
  const { t } = useTranslation();
  const { project, theme, addNodeModel, updateNodeModel, deleteNodeModel } = useBTStore();
  const isLightTheme = theme === 'light';
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  // Model modal state: null = closed, 'create' = create new, BTNodeDefinition = edit existing
  const [modelModal, setModelModal] = useState<
    { mode: 'create'; defaultCategory: BTNodeCategory }
    | { mode: 'edit'; def: BTNodeDefinition }
    | { mode: 'view'; def: BTNodeDefinition }
    | null
  >(null);

  const getPaletteEntries = (cat: BTNodeCategory): PaletteEntry[] => {
    if (cat !== 'SubTree') {
      const baseEntries: PaletteEntry[] = project.nodeModels
        .filter((m) => m.category === cat)
        .map((def) => ({ def }));
      return baseEntries.sort((a, b) => a.def.type.localeCompare(b.def.type));
    }

    // SubTree palette items are generated from Project trees and always
    // exclude current main_tree_to_execute.
    const generatedSubTrees: PaletteEntry[] = project.trees
      .filter((tree) => tree.id !== project.mainTreeId)
      .map((tree) => ({
        def: {
          type: 'SubTree',
          category: 'SubTree',
          description: `SubTree reference to ${tree.id}`,
          builtin: true,
        },
        displayLabel: tree.id,
        subtreeTarget: tree.id,
        isGeneratedSubTree: true,
      }));

    return generatedSubTrees.sort((a, b) => (a.displayLabel ?? a.def.type).localeCompare(b.displayLabel ?? b.def.type));
  };

  const allPaletteEntries = CATEGORIES.flatMap((cat) => getPaletteEntries(cat));

  // Filter nodes by search query (search by display label, type, description, or category)
  const filteredNodes = searchQuery.trim()
    ? allPaletteEntries.filter((entry) => {
        const label = (entry.displayLabel ?? entry.def.type).toLowerCase();
        const q = searchQuery.toLowerCase();
        return label.includes(q)
          || entry.def.type.toLowerCase().includes(q)
          || entry.def.description?.toLowerCase().includes(q)
          || entry.def.category.toLowerCase().includes(q);
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

  const byCategory = (cat: BTNodeCategory) => getPaletteEntries(cat);

  const onDragStart = (event: React.DragEvent, nodeType: string, subtreeTarget?: string) => {
    event.dataTransfer.setData('application/btnode-type', nodeType);
    if (subtreeTarget) {
      event.dataTransfer.setData('application/bt-subtree-target', subtreeTarget);
    }
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
      <div className="panel-body node-palette-body">
        <div className="node-palette-scroll">
          {/* Search box */}
          <div style={{ padding: '8px 8px 4px 8px' }}>
            <input
              className="node-palette-search-input"
              type="text"
              placeholder={t('palette.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                fontSize: 12,
                boxSizing: 'border-box',
                boxShadow: isLightTheme ? '0 1px 0 rgba(74, 128, 208, 0.14)' : 'none',
              }}
            />
          </div>

          {/* Search results or category list */}
          {filteredNodes !== null ? (
            <div style={{ padding: '4px 4px 0 4px' }}>
              {filteredNodes.length > 0 ? (
                // Group search results by category
                CATEGORIES.map((cat) => {
                  const matchingInCat = filteredNodes.filter((m) => m.def.category === cat);
                  if (matchingInCat.length === 0) return null;

                  const colors = CATEGORY_COLORS[cat];
                  // Auto-expand categories with search results
                  const isExpanded = true;

                  return (
                    <div key={cat} style={{ marginBottom: 4 }}>
                      <button
                        className="cat-header"
                        style={{
                          borderColor: isLightTheme ? `${colors.border}99` : colors.border,
                          background: isLightTheme ? `${colors.bg}1f` : colors.bg,
                          color: isLightTheme ? colors.border : colors.text,
                        }}
                        onClick={() => toggleCat(cat)}
                      >
                        <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                          {isExpanded ? '▼' : '▶'} {cat}
                        </span>
                        <span style={{ fontSize: 10, opacity: isLightTheme ? 0.9 : 0.75 }}>{matchingInCat.length}</span>
                      </button>

                      {isExpanded && (
                        <div style={{ paddingLeft: 4 }}>
                          {matchingInCat.map((entry) => (
                            <PaletteItem
                              key={`${entry.def.type}:${entry.displayLabel ?? entry.def.type}`}
                              def={entry.def}
                              displayLabel={entry.displayLabel}
                              subtreeTarget={entry.subtreeTarget}
                              isGeneratedSubTree={entry.isGeneratedSubTree}
                              colors={colors}
                              onDragStart={onDragStart}
                              customModelLabel={t('palette.customModel')}
                              onOpen={entry.isGeneratedSubTree ? undefined : () => setModelModal({ mode: 'view', def: entry.def })}
                              onEdit={!entry.def.builtin && !entry.isGeneratedSubTree ? () => setModelModal({ mode: 'edit', def: entry.def }) : undefined}
                              onDelete={!entry.def.builtin && !entry.isGeneratedSubTree ? deleteNodeModel : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }).filter(Boolean)
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px' }}>
                  No models match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          ) : (
            CATEGORIES.map((cat) => {
              const entries = byCategory(cat);
              const colors = CATEGORY_COLORS[cat];
              const isExpanded = expandedCats.has(cat);

              return (
                <div key={cat} style={{ marginBottom: 4 }}>
                  <button
                    className="cat-header"
                    style={{
                      borderColor: isLightTheme ? `${colors.border}99` : colors.border,
                      background: isLightTheme ? `${colors.bg}1f` : colors.bg,
                      color: isLightTheme ? colors.border : colors.text,
                    }}
                    onClick={() => toggleCat(cat)}
                  >
                    <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                      {isExpanded ? '▼' : '▶'} {cat}
                    </span>
                    <span style={{ fontSize: 10, opacity: isLightTheme ? 0.9 : 0.75 }}>{entries.length}</span>
                  </button>

                  {isExpanded && (
                    <div style={{ paddingLeft: 4 }}>
                      {entries.map((entry) => (
                        <PaletteItem
                          key={`${entry.def.type}:${entry.displayLabel ?? entry.def.type}`}
                          def={entry.def}
                          displayLabel={entry.displayLabel}
                          subtreeTarget={entry.subtreeTarget}
                          isGeneratedSubTree={entry.isGeneratedSubTree}
                          colors={colors}
                          onDragStart={onDragStart}
                          customModelLabel={t('palette.customModel')}
                          onOpen={entry.isGeneratedSubTree ? undefined : () => setModelModal({ mode: 'view', def: entry.def })}
                          onEdit={!entry.def.builtin && !entry.isGeneratedSubTree ? () => setModelModal({ mode: 'edit', def: entry.def }) : undefined}
                          onDelete={!entry.def.builtin && !entry.isGeneratedSubTree ? deleteNodeModel : undefined}
                        />
                      ))}
                      {entries.length === 0 && (
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
        </div>

        {/* Add custom node button */}
        <div className="node-palette-footer">
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
      {modelModal?.mode === 'view' && (
        <NodeModelModal
          mode="view"
          nodeDef={modelModal.def}
          onClose={() => setModelModal(null)}
        />
      )}
      </div>
      )}
    </div>
  );
};

interface PaletteItemProps {
  def: BTNodeDefinition;
  displayLabel?: string;
  subtreeTarget?: string;
  isGeneratedSubTree?: boolean;
  colors: { bg: string; border: string; text: string };
  onDragStart: (e: React.DragEvent, type: string, subtreeTarget?: string) => void;
  customModelLabel: string;
  onOpen?: (def: BTNodeDefinition) => void;
  onEdit?: (def: BTNodeDefinition) => void;
  onDelete?: (type: string) => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({
  def,
  displayLabel,
  subtreeTarget,
  isGeneratedSubTree,
  colors,
  onDragStart,
  customModelLabel,
  onOpen,
  onEdit,
  onDelete,
}) => (
  <div className="palette-item-wrapper">
    <div
      draggable
      onDragStart={(e) => onDragStart(e, def.type, subtreeTarget)}
      onDoubleClick={() => onOpen?.(def)}
      className="palette-item"
      style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
      title={def.description || displayLabel || def.type}
    >
      <span className="palette-item-label" style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {isGeneratedSubTree && <span style={{ marginRight: 6, opacity: 0.85 }}>🌳</span>}
        {!def.builtin && (
          <span
            className="palette-custom-icon"
            title={customModelLabel}
            aria-label={customModelLabel}
          >
            ★
          </span>
        )}
        {displayLabel ?? def.type}
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

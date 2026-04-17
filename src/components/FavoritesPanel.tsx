import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTStore, useBTStoreApi } from '../store/BTStoreProvider';
import { Star, X, GripVertical } from 'lucide-react';

interface FavoriteTemplate {
  id: string;
  name: string;
  type: string; // node type
  ports?: Record<string, string>;
  preconditions?: Record<string, string>;
  postconditions?: Record<string, string>;
  subtree?: {
    rootId: string;
    nodes: Array<{
      id: string;
      position: { x: number; y: number };
      data: {
        label?: string;
        nodeType: string;
        category: string;
        colors?: { bg: string; border: string; text: string };
        ports?: Record<string, string>;
        preconditions?: Record<string, string>;
        postconditions?: Record<string, string>;
        childrenCount?: number;
        description?: string;
        cdata?: string;
      };
    }>;
    edges: Array<{
      source: string;
      target: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
    }>;
  };
  category: string;
  createdAt: number;
}

interface FavoritesPanelProps {
  onDragStart?: (template: FavoriteTemplate, event: React.DragEvent) => void;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ onDragStart }) => {
  const { t } = useTranslation();
  const storeApi = useBTStoreApi();
  const { favorites, removeFavorite } = useBTStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleDragStart = (e: React.DragEvent, template: FavoriteTemplate) => {
    const payload = JSON.stringify(template);
    e.dataTransfer.setData('application/bt-template', payload);
    // Fallback payload improves DnD interoperability in some browsers/webviews.
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(template, e);
  };

  const handleEditStart = (template: FavoriteTemplate) => {
    setEditingId(template.id);
    setEditName(template.name);
  };

  const handleEditSave = (template: FavoriteTemplate) => {
    if (editName.trim() && editName !== template.name) {
      storeApi.getState().updateFavorite(template.id, editName.trim());
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, template: FavoriteTemplate) => {
    if (e.key === 'Enter') {
      handleEditSave(template);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Action': return '#4a9f4a';
      case 'Condition': return '#4a7fd4';
      case 'Decorator': return '#9f4a9f';
      case 'SubTree': return '#d47f4a';
      default: return '#888';
    }
  };

  if (isCollapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 5,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-light)',
          borderRadius: 6,
          padding: '8px 12px',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(false)}
        title={t('favorites.title')}
      >
        <span style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Star size={14} />{favorites.length}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 5,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-light)',
        borderRadius: 6,
        width: 220,
        maxHeight: 400,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-light)',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(true)}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-link)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Star size={13} />{t('favorites.title')} ({favorites.length})</span>
        </span>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 12,
            padding: '2px 6px',
          }}
          onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Favorites list */}
      <div style={{ overflow: 'auto', maxHeight: 340, padding: 8 }}>
        {favorites.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
            {t('favorites.empty')}
          </div>
        ) : (
          favorites.map((fav) => (
            <div
              key={fav.id}
              draggable
              onDragStart={(e) => handleDragStart(e, fav)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 4,
                padding: '6px 10px',
                marginBottom: 6,
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* Drag handle icon */}
              <span style={{ color: 'var(--text-muted)', fontSize: 10, display: 'inline-flex' }}><GripVertical size={12} /></span>

              {/* Category color dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getCategoryColor(fav.category),
                  flexShrink: 0,
                }}
              />

              {/* Name */}
              {editingId === fav.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleEditSave(fav)}
                  onKeyDown={(e) => handleEditKeyDown(e, fav)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 3,
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    padding: '2px 4px',
                    outline: 'none',
                  }}
                />
              ) : (
                <span
                  style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onDoubleClick={(e) => { e.stopPropagation(); handleEditStart(fav); }}
                  title={`${fav.type}${fav.ports ? ' - ' + Object.entries(fav.ports).map(([k, v]) => `${k}: ${v}`).join(', ') : ''}`}
                >
                  {fav.name}
                </span>
              )}

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: '2px 4px',
                }}
                title={t('favorites.remove')}
              >
                <X size={10} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Hint */}
      {favorites.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 8px', borderTop: '1px solid var(--border-light)' }}>
          {t('favorites.hint')}
        </div>
      )}
    </div>
  );
};

export default FavoritesPanel;

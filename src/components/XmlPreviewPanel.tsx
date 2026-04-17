import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import xmlFormatter from 'xml-formatter';
import { useBTStore, useBTStoreApi } from '../store/BTStoreProvider';
import type { BTProject } from '../types/bt';
import { parseXML, serializeXML } from '../utils/btXml';
import { useBTEditorIntegration, isIntegrationReadonly } from '../integration/context';

const XML_PANEL_MIN_WIDTH = 240;
type XmlPreviewMode = 'local' | 'main';

function buildPreviewProject(
  project: BTProject,
  activeTreeId: string,
  mode: XmlPreviewMode
) {
  if (mode === 'main') {
    return project;
  }

  const activeTree = project.trees.find((tree) => tree.id === activeTreeId);
  return {
    ...project,
    mainTreeId: activeTreeId,
    trees: activeTree ? [activeTree] : [],
  };
}

function formatXmlForPreview(source: string): string {
  if (!source.trim()) return source;

  try {
    return xmlFormatter(source, {
      indentation: '  ',
      lineSeparator: '\n',
      collapseContent: true,
      whiteSpaceAtEndOfSelfclosingTag: false,
    });
  } catch {
    // Fall back to original content if formatting fails.
    return source;
  }
}

const XmlPreviewPanel: React.FC = () => {
  const { t } = useTranslation();
  const integration = useBTEditorIntegration();
  const storeApi = useBTStoreApi();
  const project = useBTStore((state) => state.project);
  const activeTreeId = useBTStore((state) => state.activeTreeId);
  const loadXML = useBTStore((state) => state.loadXML);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedXml, setEditedXml] = useState('');
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<XmlPreviewMode>('local');
  const [width, setWidth] = useState(320);
  const [resizing, setResizing] = useState(false);
  const copyResetRef = useRef<number | null>(null);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const previewProject = useMemo(
    () => buildPreviewProject(project, activeTreeId, previewMode),
    [project, activeTreeId, previewMode]
  );
  const xml = useMemo(() => serializeXML(previewProject), [previewProject]);
  const formattedXml = useMemo(() => formatXmlForPreview(xml), [xml]);
  const previewMeta = previewMode === 'main'
    ? t('xmlPreview.previewMainMeta', { tree: project.mainTreeId })
    : t('xmlPreview.activeTree', { tree: activeTreeId });
  const readonly = isIntegrationReadonly(integration);

  useEffect(() => {
    return () => {
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }

      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  const handleResizeMove = (event: MouseEvent) => {
    if (!resizeStateRef.current) return;
    const delta = resizeStateRef.current.startX - event.clientX;
    const nextWidth = Math.max(XML_PANEL_MIN_WIDTH, resizeStateRef.current.startWidth + delta);
    setWidth(nextWidth);
  };

  const handleResizeEnd = () => {
    resizeStateRef.current = null;
    setResizing(false);
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStateRef.current = { startX: event.clientX, startWidth: width };
    setResizing(true);
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleToggle = () => {
    setCollapsed((value) => !value);
  };

  const handleEditClick = () => {
    if (readonly) return;
    setIsEditing(true);
    setEditedXml(xml);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedXml('');
    setXmlError(null);
  };

  const validateXml = useCallback((xml: string): string | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        return parseError.textContent?.replace(/\s+/g, ' ').trim() ?? t('xmlPreview.invalidXml');
      }
      return null;
    } catch {
      return t('xmlPreview.parseError');
    }
  }, [t]);

  const handleXmlChange = useCallback((value: string) => {
    setEditedXml(value);
    setXmlError(validateXml(value));
  }, [validateXml]);

  const handleSaveEdit = () => {
    if (xmlError) {
      return; // Don't save with errors
    }

    try {
      if (previewMode === 'main') {
        const result = integration?.importXml(editedXml, 'import');
        const newProject = result?.ok ? result.data : loadXML(editedXml);
        if (!newProject) {
          setXmlError(t('xmlPreview.invalidXml'));
          return;
        }
      } else {
        const parsedProject = parseXML(editedXml);
        const parsedTreeForActiveTab =
          parsedProject.trees.find((tree) => tree.id === activeTreeId)
          ?? parsedProject.trees.find((tree) => tree.id === parsedProject.mainTreeId)
          ?? parsedProject.trees[0];

        if (!parsedTreeForActiveTab) {
          setXmlError(t('xmlPreview.invalidXml'));
          return;
        }

        storeApi.setState((state) => {
          const nextTrees = state.project.trees.map((tree) => {
            if (tree.id !== activeTreeId) return tree;
            return {
              ...tree,
              root: parsedTreeForActiveTab.root,
            };
          });

          const nextTreeIds = new Set(nextTrees.map((tree) => tree.id));
          parsedProject.trees.forEach((tree) => {
            if (tree.id === activeTreeId || tree.id === parsedTreeForActiveTab.id) return;
            if (!nextTreeIds.has(tree.id)) {
              nextTrees.push(tree);
              nextTreeIds.add(tree.id);
            }
          });

          return {
            ...state,
            project: {
              ...state.project,
              trees: nextTrees,
            },
            selectedNodeId: null,
            localNodes: [],
            localEdges: [],
          };
        });
      }

      setIsEditing(false);
      setEditedXml('');
      setXmlError(null);
    } catch (error) {
      setXmlError(`${t('xmlPreview.parseError')}: ${String(error)}`);
    }
  };

  const handleCopy = async () => {
    try {
      const clipboardAdapter = integration?.adapters.clipboardAdapter;
      if (!clipboardAdapter) {
        throw new Error('Clipboard adapter unavailable');
      }
      await clipboardAdapter.writeText(xml);
      setCopied(true);
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }
      copyResetRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetRef.current = null;
      }, 1200);
    } catch (error) {
      integration?.reportError(
        { code: 'clipboard-write-failed', message: t('xmlPreview.copyFailed'), cause: error },
        'user',
        'copy-xml'
      );
      integration?.adapters.notifyAdapter.alert(t('xmlPreview.copyFailed'));
    }
  };

  if (collapsed) {
    return (
      <aside className="xml-preview-sidebar collapsed" aria-label={t('xmlPreview.title')}>
        <button
          type="button"
          className="xml-preview-collapsed-toggle"
          onClick={handleToggle}
          title={t('xmlPreview.expand')}
          aria-label={t('xmlPreview.expand')}
        >
          <span>{'<'}</span>
          <span className="xml-preview-collapsed-label">XML</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`xml-preview-sidebar${resizing ? ' resizing' : ''}`}
      aria-label={t('xmlPreview.title')}
      style={{ width, minWidth: width }}
    >
      <div
        className="xml-preview-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label={t('xmlPreview.resize')}
        onMouseDown={handleResizeStart}
        title={t('xmlPreview.resize')}
      />
      <div className="xml-preview-header">
        <div className="xml-preview-title-wrap">
          <div className="xml-preview-title">{t('xmlPreview.title')}</div>
          <div className="xml-preview-subtitle">{t('xmlPreview.description')}</div>
        </div>
        <div className="xml-preview-actions">
          {!isEditing && (
            <>
              <button
                type="button"
                className="xml-preview-icon-btn"
                onClick={handleCopy}
                title={t('xmlPreview.copy')}
                aria-label={t('xmlPreview.copy')}
              >
                {copied ? t('xmlPreview.copied') : t('xmlPreview.copy')}
              </button>
              <button
                type="button"
                className="xml-preview-icon-btn"
                onClick={handleEditClick}
                title={t('xmlPreview.edit')}
                aria-label={t('xmlPreview.edit')}
                disabled={readonly}
              >
                ✎
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                className="xml-preview-icon-btn xml-preview-save-btn"
                onClick={handleSaveEdit}
                title={t('xmlPreview.save')}
                aria-label={t('xmlPreview.save')}
              >
                ✔
              </button>
              <button
                type="button"
                className="xml-preview-icon-btn xml-preview-cancel-btn"
                onClick={handleCancelEdit}
                title={t('xmlPreview.cancel')}
                aria-label={t('xmlPreview.cancel')}
              >
                ✕
              </button>
            </>
          )}
          <button
            type="button"
            className="xml-preview-icon-btn"
            onClick={handleToggle}
            title={t('xmlPreview.collapse')}
            aria-label={t('xmlPreview.collapse')}
          >
            {'>'}
          </button>
        </div>
      </div>
      <div className="xml-preview-body">
        <div className="xml-preview-mode-row">
          <span className="xml-preview-mode-label">{t('xmlPreview.modeLabel')}</span>
          <label className="xml-preview-switch" htmlFor="xml-preview-mode-switch">
            <input
              id="xml-preview-mode-switch"
              type="checkbox"
              checked={previewMode === 'main'}
              onChange={(event) => setPreviewMode(event.target.checked ? 'main' : 'local')}
              disabled={isEditing || readonly}
              aria-label={t('xmlPreview.modeSwitch')}
            />
            <span className="xml-preview-switch-track" aria-hidden="true">
              <span className="xml-preview-switch-thumb" />
            </span>
            <span className="xml-preview-switch-text">
              {previewMode === 'main' ? t('xmlPreview.modeMain') : t('xmlPreview.modeLocal')}
            </span>
          </label>
        </div>
        <div className="xml-preview-meta">{previewMeta}</div>
        {isEditing ? (
          <>
            <textarea
              ref={textareaRef}
              className={`xml-preview-textarea${xmlError ? ' xml-preview-textarea-error' : ''}`}
              value={editedXml}
              onChange={(e) => handleXmlChange(e.target.value)}
              spellCheck="false"
              wrap="off"
              readOnly={readonly}
            />
            {xmlError && (
              <div className="xml-error-banner">
                <span className="xml-error-icon">⚠️</span>
                <span className="xml-error-text">{xmlError}</span>
              </div>
            )}
          </>
        ) : (
          <pre className="xml-preview-code">{formattedXml || t('xmlPreview.empty')}</pre>
        )}
      </div>
    </aside>
  );
};

export default XmlPreviewPanel;
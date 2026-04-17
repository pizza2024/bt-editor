import React, { Suspense, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import Toolbar from '../components/Toolbar';
import NodePalette from '../components/NodePalette';
import BTCanvas from '../components/BTCanvas';
import TreeManager from '../components/TreeManager';
import { BTStoreProvider, useBTStoreApi } from '../store/BTStoreProvider';
import { createBTStore, type BTStoreApi } from '../store/btStore';
import { BTEditorIntegrationProvider } from '../integration/context';
import {
  PROJECT_STORAGE_KEY,
  resolveEditorAdapters,
  writeStoredLocale,
} from '../integration/defaultAdapters';
import type {
  BTEditorChangeContext,
  BTEditorError,
  BTEditorErrorContext,
  BTEditorEventOrigin,
  BTEditorRef,
  BTEditorRuntimeState,
  BTEditorSelection,
  BTEditorSelectionContext,
  BTEditorTheme,
  BTEditorTreeAction,
  BTEditorTreeChangeContext,
  EditorAdapters,
  FeatureFlags,
  UIConfig,
} from '../integration/types';
import type { BTProject } from '../types/bt';
import { parseXML } from '../utils/btXml';
import '../i18n';
import '../App.css';

const LEFT_SIDEBAR_DEFAULT_WIDTH = 238;
const LEFT_SIDEBAR_MIN_WIDTH = 180;
const LEFT_SIDEBAR_COLLAPSED_WIDTH = 26;
const RIGHT_SIDEBAR_DEFAULT_WIDTH = 240;
const RIGHT_SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_RESIZER_WIDTH = 8;

const PropertiesPanel = React.lazy(() => import('../components/PropertiesPanel'));
const DebugPanel = React.lazy(() => import('../components/DebugPanel'));
const FavoritesPanel = React.lazy(() => import('../components/FavoritesPanel'));
const XmlPreviewPanel = React.lazy(() => import('../components/XmlPreviewPanel.tsx'));

const DEFAULT_FEATURES: Required<FeatureFlags> = {
  toolbar: true,
  xmlPreview: true,
  debugPanel: true,
  favoritesPanel: true,
  treeTabs: true,
  shortcutsHelp: true,
  pngExport: true,
  importExport: true,
};

function cloneProject(project: BTProject): BTProject {
  if (typeof structuredClone === 'function') {
    return structuredClone(project);
  }

  return JSON.parse(JSON.stringify(project)) as BTProject;
}

function projectsEqual(left: BTProject, right: BTProject) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createError(code: string, message: string, cause?: unknown): BTEditorError {
  return { code, message, cause };
}

function areArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function inferTreeAction(prevState: ReturnType<BTStoreApi['getState']>, nextState: ReturnType<BTStoreApi['getState']>): BTEditorTreeAction | null {
  const prevTreeIds = prevState.project.trees.map((tree) => tree.id);
  const nextTreeIds = nextState.project.trees.map((tree) => tree.id);
  const removedTreeIds = prevTreeIds.filter((id) => !nextTreeIds.includes(id));
  const addedTreeIds = nextTreeIds.filter((id) => !prevTreeIds.includes(id));

  if (addedTreeIds.length === 1 && removedTreeIds.length === 0) {
    return { type: 'add-tree', treeId: addedTreeIds[0] };
  }

  if (removedTreeIds.length === 1 && addedTreeIds.length === 0) {
    return { type: 'delete-tree', treeId: removedTreeIds[0] };
  }

  if (removedTreeIds.length === 1 && addedTreeIds.length === 1 && prevTreeIds.length === nextTreeIds.length) {
    return {
      type: 'rename-tree',
      treeId: addedTreeIds[0],
      previousTreeId: removedTreeIds[0],
      nextTreeId: addedTreeIds[0],
    };
  }

  if (prevState.project.mainTreeId !== nextState.project.mainTreeId) {
    return {
      type: 'set-main-tree',
      treeId: nextState.project.mainTreeId,
      previousTreeId: prevState.project.mainTreeId,
      nextTreeId: nextState.project.mainTreeId,
    };
  }

  if (!areArraysEqual(prevState.openedTreeIds, nextState.openedTreeIds)) {
    const removedOpenedIds = prevState.openedTreeIds.filter((id) => !nextState.openedTreeIds.includes(id));
    const addedOpenedIds = nextState.openedTreeIds.filter((id) => !prevState.openedTreeIds.includes(id));

    if (addedOpenedIds.length === 1) {
      return { type: 'open-tree-tab', treeId: addedOpenedIds[0] };
    }

    if (removedOpenedIds.length > 0) {
      if (nextState.openedTreeIds.length === 1) {
        return { type: 'close-other-tree-tabs', treeId: nextState.openedTreeIds[0] };
      }

      const preservedPrefix = nextState.openedTreeIds.every((id, index) => prevState.openedTreeIds[index] === id);
      if (preservedPrefix) {
        return {
          type: 'close-tree-tabs-to-right',
          treeId: nextState.openedTreeIds[nextState.openedTreeIds.length - 1],
        };
      }

      return { type: 'close-tree-tab', treeId: removedOpenedIds[0] };
    }
  }

  if (prevState.activeTreeId !== nextState.activeTreeId) {
    return {
      type: 'set-active-tree',
      treeId: nextState.activeTreeId,
      previousTreeId: prevState.activeTreeId,
      nextTreeId: nextState.activeTreeId,
    };
  }

  return null;
}

function resolveThemePreference(theme?: BTEditorTheme): 'light' | 'dark' | null {
  if (!theme) return null;
  if (theme === 'light' || theme === 'dark') return theme;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

export type BTEditorProps = {
  className?: string;
  storageKey?: string;
  value?: BTProject;
  defaultValue?: BTProject;
  mode?: 'edit' | 'readonly';
  locale?: string;
  theme?: BTEditorTheme;
  features?: FeatureFlags;
  uiConfig?: UIConfig;
  adapters?: EditorAdapters;
  changeThrottleMs?: number;
  onReady?: (api: BTEditorRef) => void;
  onChange?: (project: BTProject, context: BTEditorChangeContext) => void;
  onSelectionChange?: (selection: BTEditorSelection, context: BTEditorSelectionContext) => void;
  onTreeChange?: (action: BTEditorTreeAction, context: BTEditorTreeChangeContext) => void;
  onImport?: (stage: 'start' | 'success' | 'error', result: unknown, context: { origin: BTEditorEventOrigin; timestamp: number }) => void;
  onExport?: (stage: 'start' | 'success' | 'error', result: unknown, context: { origin: BTEditorEventOrigin; timestamp: number }) => void;
  onError?: (error: BTEditorError, context: BTEditorErrorContext) => void;
};

const BTEditorContent: React.FC<Pick<BTEditorProps, 'className' | 'mode' | 'features' | 'uiConfig'>> = ({
  className = '',
  mode = 'edit',
  features,
  uiConfig,
}) => {
  const { t } = useTranslation();
  const storeApi = useBTStoreApi();
  const mergedFeatures = { ...DEFAULT_FEATURES, ...features };
  const readonly = mode === 'readonly';
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(uiConfig?.leftSidebarCollapsed ?? false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(uiConfig?.rightSidebarCollapsed ?? false);
  const [leftTopPaneRatio, setLeftTopPaneRatio] = useState(uiConfig?.leftTopPaneRatio ?? 0.42);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(uiConfig?.leftSidebarWidth ?? LEFT_SIDEBAR_DEFAULT_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(uiConfig?.rightSidebarWidth ?? RIGHT_SIDEBAR_DEFAULT_WIDTH);
  const mainAreaRef = useRef<HTMLDivElement | null>(null);
  const leftSidebarAreaRef = useRef<HTMLDivElement | null>(null);
  const leftSidebarRef = useRef<HTMLDivElement | null>(null);
  const rightSidebarAreaRef = useRef<HTMLDivElement | null>(null);
  const rightSidebarRef = useRef<HTMLDivElement | null>(null);
  const bothSidebarsCollapsed = leftSidebarCollapsed && rightSidebarCollapsed;
  const effectiveLeftSidebarWidth = leftSidebarCollapsed ? LEFT_SIDEBAR_COLLAPSED_WIDTH : leftSidebarWidth;

  const toggleBothSidebars = () => {
    if (bothSidebarsCollapsed) {
      setLeftSidebarCollapsed(false);
      setRightSidebarCollapsed(false);
      return;
    }

    setLeftSidebarCollapsed(true);
    setRightSidebarCollapsed(true);
  };

  useEffect(() => {
    storeApi.getState().initTheme();
  }, [storeApi]);

  useEffect(() => {
    const mainAreaElement = mainAreaRef.current;
    const rightSidebarAreaElement = rightSidebarAreaRef.current;
    const rightSidebarElement = rightSidebarRef.current;
    if (!mainAreaElement || !rightSidebarAreaElement || !rightSidebarElement) return;

    const syncSidebarWidths = () => {
      const mainAreaWidth = mainAreaElement.getBoundingClientRect().width;
      const rightSidebarAreaWidth = rightSidebarAreaElement.getBoundingClientRect().width;
      const nextLeftMaxWidth = Math.max(
        LEFT_SIDEBAR_MIN_WIDTH,
        mainAreaWidth - rightSidebarAreaWidth - SIDEBAR_RESIZER_WIDTH * 2
      );

      setLeftSidebarWidth((width) => Math.min(width, nextLeftMaxWidth));

      if (rightSidebarCollapsed) {
        return;
      }

      const rightSidebarWidthBounds = rightSidebarElement.getBoundingClientRect().width;
      const fixedRightAreaWidth = rightSidebarAreaWidth - rightSidebarWidthBounds;
      const effectiveLeftWidth = leftSidebarCollapsed
        ? LEFT_SIDEBAR_COLLAPSED_WIDTH
        : Math.min(leftSidebarWidth, nextLeftMaxWidth);
      const nextRightMaxWidth = Math.max(
        RIGHT_SIDEBAR_MIN_WIDTH,
        mainAreaWidth - effectiveLeftWidth - fixedRightAreaWidth - SIDEBAR_RESIZER_WIDTH * 2
      );

      setRightSidebarWidth((width) => Math.min(width, nextRightMaxWidth));
    };

    syncSidebarWidths();

    const resizeObserver = new ResizeObserver(() => {
      syncSidebarWidths();
    });

    resizeObserver.observe(mainAreaElement);
    resizeObserver.observe(rightSidebarAreaElement);

    return () => resizeObserver.disconnect();
  }, [leftSidebarCollapsed, leftSidebarWidth, rightSidebarCollapsed]);

  useEffect(() => {
    const handlePointerUp = () => {
      document.body.classList.remove('is-resizing-panels');
      document.body.classList.remove('is-resizing-columns');
    };

    window.addEventListener('mouseup', handlePointerUp);
    return () => window.removeEventListener('mouseup', handlePointerUp);
  }, []);

  const startLeftSidebarResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const sidebarElement = leftSidebarRef.current;
    if (!sidebarElement) return;

    const bounds = sidebarElement.getBoundingClientRect();
    const dividerHeight = 8;
    const minPaneHeight = 120;
    const totalHeight = bounds.height;
    const minRatio = minPaneHeight / totalHeight;
    const maxRatio = (totalHeight - minPaneHeight - dividerHeight) / totalHeight;

    document.body.classList.add('is-resizing-panels');

    const handlePointerMove = (moveEvent: MouseEvent) => {
      const nextOffset = moveEvent.clientY - bounds.top;
      const nextRatio = nextOffset / totalHeight;
      const clampedRatio = Math.min(maxRatio, Math.max(minRatio, nextRatio));
      setLeftTopPaneRatio(clampedRatio);
    };

    const handlePointerUp = () => {
      document.body.classList.remove('is-resizing-panels');
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  const startLeftSidebarWidthResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const mainAreaElement = mainAreaRef.current;
    const rightSidebarAreaElement = rightSidebarAreaRef.current;
    if (!mainAreaElement || !rightSidebarAreaElement) return;

    const mainAreaBounds = mainAreaElement.getBoundingClientRect();
    const rightSidebarAreaWidth = rightSidebarAreaElement.getBoundingClientRect().width;
    const maxWidth = Math.max(
      LEFT_SIDEBAR_MIN_WIDTH,
      mainAreaBounds.width - rightSidebarAreaWidth - SIDEBAR_RESIZER_WIDTH * 2
    );

    document.body.classList.add('is-resizing-columns');

    const handlePointerMove = (moveEvent: MouseEvent) => {
      const nextWidth = moveEvent.clientX - mainAreaBounds.left;
      const clampedWidth = Math.min(maxWidth, Math.max(LEFT_SIDEBAR_MIN_WIDTH, nextWidth));
      setLeftSidebarCollapsed(false);
      setLeftSidebarWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      document.body.classList.remove('is-resizing-columns');
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  const startRightSidebarWidthResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const mainAreaElement = mainAreaRef.current;
    const leftSidebarAreaElement = leftSidebarAreaRef.current;
    const rightSidebarAreaElement = rightSidebarAreaRef.current;
    const rightSidebarElement = rightSidebarRef.current;
    if (!mainAreaElement || !leftSidebarAreaElement || !rightSidebarAreaElement || !rightSidebarElement) return;

    const mainAreaBounds = mainAreaElement.getBoundingClientRect();
    const leftSidebarAreaWidth = leftSidebarAreaElement.getBoundingClientRect().width;
    const rightSidebarAreaWidth = rightSidebarAreaElement.getBoundingClientRect().width;
    const rightSidebarBounds = rightSidebarElement.getBoundingClientRect();
    const fixedRightAreaWidth = rightSidebarAreaWidth - rightSidebarBounds.width;
    const maxWidth = Math.max(
      RIGHT_SIDEBAR_MIN_WIDTH,
      mainAreaBounds.width - leftSidebarAreaWidth - fixedRightAreaWidth - SIDEBAR_RESIZER_WIDTH * 2
    );

    document.body.classList.add('is-resizing-columns');

    const handlePointerMove = (moveEvent: MouseEvent) => {
      const nextAreaWidth = mainAreaBounds.right - moveEvent.clientX;
      const nextWidth = nextAreaWidth - fixedRightAreaWidth;
      const clampedWidth = Math.min(maxWidth, Math.max(RIGHT_SIDEBAR_MIN_WIDTH, nextWidth));
      setRightSidebarCollapsed(false);
      setRightSidebarWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      document.body.classList.remove('is-resizing-columns');
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  return (
    <div className={`app-layout ${className} ${readonly ? 'bt-editor-readonly' : ''}`.trim()}>
      {mergedFeatures.toolbar && <Toolbar />}
      <div className="main-area" ref={mainAreaRef}>
        <div
          className={`left-sidebar-area${leftSidebarCollapsed ? ' collapsed' : ''}`}
          ref={leftSidebarAreaRef}
          style={{
            width: effectiveLeftSidebarWidth,
            minWidth: effectiveLeftSidebarWidth,
            maxWidth: effectiveLeftSidebarWidth,
          }}
        >
          <div className="left-sidebar" ref={leftSidebarRef}>
            <div className="left-sidebar-split">
              <div
                className="left-sidebar-pane top"
                style={{ flexBasis: `${leftTopPaneRatio * 100}%` }}
              >
                <TreeManager />
              </div>
              <div
                className="left-sidebar-divider"
                onMouseDown={startLeftSidebarResize}
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize left sidebar panels"
              >
                <span className="left-sidebar-divider-handle" />
              </div>
              <div className="left-sidebar-pane bottom">
                {!readonly && <NodePalette />}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle-strip"
            onClick={() => setLeftSidebarCollapsed((value) => !value)}
            title={leftSidebarCollapsed ? t('layout.expandLeftSidebar') : t('layout.collapseLeftSidebar')}
            aria-label={leftSidebarCollapsed ? t('layout.expandLeftSidebar') : t('layout.collapseLeftSidebar')}
          >
            {leftSidebarCollapsed ? '>' : '<'}
          </button>
        </div>

        <div
          className="sidebar-width-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize left sidebar width"
          onMouseDown={startLeftSidebarWidthResize}
        />

        <div className="canvas-area">
          <BTCanvas
            sidePanelsCollapsed={bothSidebarsCollapsed}
            onToggleSidePanels={toggleBothSidebars}
            toggleSidePanelsLabel={bothSidebarsCollapsed ? t('layout.expandSidebars') : t('layout.collapseSidebars')}
          />
          {mergedFeatures.favoritesPanel && (
            <Suspense fallback={null}>
              <FavoritesPanel />
            </Suspense>
          )}
        </div>

        <div
          className={`sidebar-width-resizer${rightSidebarCollapsed ? ' disabled' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize right sidebar width"
          onMouseDown={rightSidebarCollapsed ? undefined : startRightSidebarWidthResize}
        />

        <div
          className={`right-sidebar-area${rightSidebarCollapsed ? ' collapsed' : ''}`}
          ref={rightSidebarAreaRef}
        >
          <button
            type="button"
            className="sidebar-toggle-strip"
            onClick={() => setRightSidebarCollapsed((value) => !value)}
            title={rightSidebarCollapsed ? t('layout.expandRightSidebar') : t('layout.collapseRightSidebar')}
            aria-label={rightSidebarCollapsed ? t('layout.expandRightSidebar') : t('layout.collapseRightSidebar')}
          >
            {rightSidebarCollapsed ? '<' : '>'}
          </button>
          <div
            className="right-sidebar"
            ref={rightSidebarRef}
            style={{ width: rightSidebarWidth, minWidth: rightSidebarWidth, maxWidth: rightSidebarWidth }}
          >
            <Suspense fallback={null}>
              <PropertiesPanel />
            </Suspense>
            {mergedFeatures.debugPanel && (
              <Suspense fallback={null}>
                <DebugPanel />
              </Suspense>
            )}
          </div>
          {mergedFeatures.xmlPreview && (
            <Suspense fallback={null}>
              <XmlPreviewPanel />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

const BTEditor = forwardRef<BTEditorRef, BTEditorProps>(({
  className = '',
  storageKey = PROJECT_STORAGE_KEY,
  value,
  defaultValue,
  mode = 'edit',
  locale,
  theme,
  features,
  uiConfig,
  adapters,
  changeThrottleMs = 0,
  onReady,
  onChange,
  onSelectionChange,
  onTreeChange,
  onImport,
  onExport,
  onError,
}, ref) => {
  const adaptersRef = useRef(resolveEditorAdapters(adapters));
  const storeRef = useRef<BTStoreApi | null>(null);
  const initializedDefaultRef = useRef(false);
  const readyEmittedRef = useRef(false);
  const currentOriginRef = useRef<BTEditorEventOrigin>('user');
  const suppressEventsRef = useRef(false);
  const pendingChangeTimeoutRef = useRef<number | null>(null);
  const pendingChangePayloadRef = useRef<{ project: BTProject; context: BTEditorChangeContext } | null>(null);
  const modeRef = useRef(value !== undefined ? 'controlled' : 'uncontrolled');

  if (!storeRef.current) {
    storeRef.current = createBTStore({ storageKey, adapters: adaptersRef.current });
  }

  const storeApi = storeRef.current;
  const mergedFeatures = { ...DEFAULT_FEATURES, ...features };
  const latestHandlersRef = useRef({ onReady, onChange, onSelectionChange, onTreeChange, onImport, onExport, onError });
  latestHandlersRef.current = { onReady, onChange, onSelectionChange, onTreeChange, onImport, onExport, onError };

  const reportError = (error: BTEditorError, origin: BTEditorEventOrigin = 'system', operation?: string) => {
    adaptersRef.current.loggerAdapter.error(error.message, error.cause);
    latestHandlersRef.current.onError?.(error, {
      type: 'error',
      origin,
      timestamp: Date.now(),
      operation,
    });
  };

  const guardEditableAction = (operation: string) => {
    if (mode !== 'readonly') {
      return true;
    }

    reportError(
      createError('readonly-operation-blocked', `Operation "${operation}" is not allowed in readonly mode.`),
      'user',
      operation
    );
    return false;
  };

  const flushPendingChange = () => {
    if (!pendingChangePayloadRef.current) {
      return;
    }

    const payload = pendingChangePayloadRef.current;
    pendingChangePayloadRef.current = null;
    latestHandlersRef.current.onChange?.(payload.project, payload.context);
  };

  const withOrigin = <T,>(origin: BTEditorEventOrigin, action: () => T) => {
    currentOriginRef.current = origin;
    return action();
  };

  const withoutEvents = (action: () => void) => {
    suppressEventsRef.current = true;
    action();
    suppressEventsRef.current = false;
    currentOriginRef.current = 'user';
  };

  const modelActions = {
    addNodeModel(definition: BTProject['nodeModels'][number], origin: BTEditorEventOrigin = 'user') {
      if (!guardEditableAction('addNodeModel')) return;
      withOrigin(origin, () => {
        storeApi.getState().addNodeModel(definition);
      });
    },
    updateNodeModel(definition: BTProject['nodeModels'][number], origin: BTEditorEventOrigin = 'user') {
      if (!guardEditableAction('updateNodeModel')) return;
      withOrigin(origin, () => {
        storeApi.getState().updateNodeModel(definition);
      });
    },
    replaceNodeModel(type: string, definition: BTProject['nodeModels'][number], origin: BTEditorEventOrigin = 'user') {
      if (!guardEditableAction('replaceNodeModel')) return;
      withOrigin(origin, () => {
        storeApi.getState().replaceNodeModel(type, definition);
      });
    },
    deleteNodeModel(type: string, origin: BTEditorEventOrigin = 'user') {
      if (!guardEditableAction('deleteNodeModel')) return;
      withOrigin(origin, () => {
        storeApi.getState().deleteNodeModel(type);
      });
    },
  };

  const importXml = (xml: string, origin: BTEditorEventOrigin = 'import') => {
    const timestamp = Date.now();
    latestHandlersRef.current.onImport?.('start', { xml }, { origin, timestamp });
    try {
      const project = parseXML(xml);
      withOrigin(origin, () => {
        storeApi.getState().setProject(project);
      });
      latestHandlersRef.current.onImport?.('success', project, { origin, timestamp });
      return { ok: true, data: project } as const;
    } catch (error) {
      const nextError = createError('xml-import-failed', (error as Error).message, error);
      reportError(nextError, origin, 'importXml');
      latestHandlersRef.current.onImport?.('error', nextError, { origin, timestamp });
      return { ok: false, error: nextError } as const;
    }
  };

  const exportXml = (origin: BTEditorEventOrigin = 'api') => {
    const timestamp = Date.now();
    latestHandlersRef.current.onExport?.('start', null, { origin, timestamp });
    try {
      const xml = storeApi.getState().exportXML();
      latestHandlersRef.current.onExport?.('success', xml, { origin, timestamp });
      return { ok: true, data: xml } as const;
    } catch (error) {
      const nextError = createError('xml-export-failed', (error as Error).message, error);
      reportError(nextError, origin, 'exportXml');
      latestHandlersRef.current.onExport?.('error', nextError, { origin, timestamp });
      return { ok: false, error: nextError } as const;
    }
  };

  const getRuntimeState = (): BTEditorRuntimeState => {
    const state = storeApi.getState();
    return {
      mode,
      activeTreeId: state.activeTreeId,
      openedTreeIds: [...state.openedTreeIds],
      selectedNodeId: state.selectedNodeId,
      selectedNodeIds: Array.from(state.selectedNodeIds),
      theme: state.theme,
    };
  };

  const apiRef = useRef<BTEditorRef>({
    getProject: () => cloneProject(storeApi.getState().project),
    setProject: (project) => {
      try {
        withOrigin('api', () => {
          storeApi.getState().setProject(project);
        });
        return { ok: true, data: cloneProject(storeApi.getState().project) };
      } catch (error) {
        const nextError = createError('set-project-failed', (error as Error).message, error);
        reportError(nextError, 'api', 'setProject');
        return { ok: false, error: nextError };
      }
    },
    importXml: (xml) => importXml(xml, 'api'),
    exportXml: () => exportXml('api'),
    undo: () => {
      try {
        withOrigin('api', () => {
          storeApi.getState().undo();
        });
        return { ok: true, data: cloneProject(storeApi.getState().project) };
      } catch (error) {
        const nextError = createError('undo-failed', (error as Error).message, error);
        reportError(nextError, 'api', 'undo');
        return { ok: false, error: nextError };
      }
    },
    redo: () => {
      try {
        withOrigin('api', () => {
          storeApi.getState().redo();
        });
        return { ok: true, data: cloneProject(storeApi.getState().project) };
      } catch (error) {
        const nextError = createError('redo-failed', (error as Error).message, error);
        reportError(nextError, 'api', 'redo');
        return { ok: false, error: nextError };
      }
    },
    getState: getRuntimeState,
  });

  apiRef.current.getProject = () => cloneProject(storeApi.getState().project);
  apiRef.current.getState = getRuntimeState;

  useImperativeHandle(ref, () => apiRef.current, []);

  useEffect(() => {
    const nextMode = value !== undefined ? 'controlled' : 'uncontrolled';
    if (nextMode !== modeRef.current) {
      adaptersRef.current.loggerAdapter.warn(
        'BTEditor switching between controlled and uncontrolled mode is not supported after mount.'
      );
    }
  }, [value]);

  useEffect(() => {
    if (value === undefined) {
      if (initializedDefaultRef.current || defaultValue === undefined) {
        return;
      }

      initializedDefaultRef.current = true;
      withoutEvents(() => {
        storeApi.getState().setProject(defaultValue);
      });
      return;
    }

    const currentProject = storeApi.getState().project;
    if (projectsEqual(currentProject, value)) {
      return;
    }

    withoutEvents(() => {
      storeApi.getState().setProject(value);
    });
  }, [defaultValue, storeApi, value]);

  useEffect(() => {
    const unsubscribe = storeApi.subscribe((state, prevState) => {
      if (suppressEventsRef.current) {
        return;
      }

      const origin = currentOriginRef.current ?? 'user';

      if (state.project !== prevState.project) {
        const context: BTEditorChangeContext = {
          type: 'change',
          origin,
          timestamp: Date.now(),
        };

        const snapshot = cloneProject(state.project);
        if (!latestHandlersRef.current.onChange) {
          currentOriginRef.current = 'user';
        } else if (changeThrottleMs > 0) {
          pendingChangePayloadRef.current = { project: snapshot, context };
          if (pendingChangeTimeoutRef.current !== null) {
            window.clearTimeout(pendingChangeTimeoutRef.current);
          }
          pendingChangeTimeoutRef.current = window.setTimeout(() => {
            pendingChangeTimeoutRef.current = null;
            flushPendingChange();
          }, changeThrottleMs);
        } else {
          latestHandlersRef.current.onChange(snapshot, context);
        }
      }

      if (
        state.selectedNodeId !== prevState.selectedNodeId ||
        state.selectedNodeIds !== prevState.selectedNodeIds
      ) {
        latestHandlersRef.current.onSelectionChange?.(
          {
            selectedNodeId: state.selectedNodeId,
            selectedNodeIds: Array.from(state.selectedNodeIds),
          },
          {
            type: 'selection-change',
            origin,
            timestamp: Date.now(),
          }
        );
      }

      const treeAction = inferTreeAction(prevState, state);
      if (treeAction) {
        latestHandlersRef.current.onTreeChange?.(treeAction, {
          type: 'tree-change',
          origin,
          timestamp: Date.now(),
          activeTreeId: state.activeTreeId,
          openedTreeIds: [...state.openedTreeIds],
          mainTreeId: state.project.mainTreeId,
        });
      }

      currentOriginRef.current = 'user';
    });

    return () => {
      unsubscribe();
      if (pendingChangeTimeoutRef.current !== null) {
        window.clearTimeout(pendingChangeTimeoutRef.current);
        pendingChangeTimeoutRef.current = null;
      }
      flushPendingChange();
    };
  }, [changeThrottleMs, storeApi]);

  useEffect(() => {
    if (!locale) {
      return;
    }

    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    writeStoredLocale(locale, adaptersRef.current.storageAdapter);
  }, [locale]);

  useEffect(() => {
    const resolvedTheme = resolveThemePreference(theme);
    if (!resolvedTheme) {
      return;
    }

    storeApi.getState().setTheme(resolvedTheme);
  }, [storeApi, theme]);

  useEffect(() => {
    if (readyEmittedRef.current) {
      return;
    }

    readyEmittedRef.current = true;
    latestHandlersRef.current.onReady?.(apiRef.current);
  }, []);

  const integrationValue = {
    mode,
    readonly: mode === 'readonly',
    theme,
    locale,
    features: mergedFeatures,
    uiConfig: uiConfig ?? {},
    adapters: adaptersRef.current,
    localeControlled: locale !== undefined,
    themeControlled: theme !== undefined,
    modelActions,
    guardEditableAction,
    importXml,
    exportXml,
    reportError,
  };

  return (
    <BTEditorIntegrationProvider value={integrationValue}>
      <BTStoreProvider store={storeApi}>
        <BTEditorContent className={className} mode={mode} features={mergedFeatures} uiConfig={uiConfig} />
      </BTStoreProvider>
    </BTEditorIntegrationProvider>
  );
});

BTEditor.displayName = 'BTEditor';

export default BTEditor;
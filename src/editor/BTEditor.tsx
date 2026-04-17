import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toolbar from '../components/Toolbar';
import NodePalette from '../components/NodePalette';
import BTCanvas from '../components/BTCanvas';
import TreeManager from '../components/TreeManager';
import { BTStoreProvider, useBTStoreApi } from '../store/BTStoreProvider';
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

export type BTEditorProps = {
  className?: string;
  storageKey?: string;
};

const BTEditorContent: React.FC<Pick<BTEditorProps, 'className'>> = ({ className = '' }) => {
  const { t } = useTranslation();
  const storeApi = useBTStoreApi();
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [leftTopPaneRatio, setLeftTopPaneRatio] = useState(0.42);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(LEFT_SIDEBAR_DEFAULT_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(RIGHT_SIDEBAR_DEFAULT_WIDTH);
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
    <div className={`app-layout ${className}`.trim()}>
      <Toolbar />
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
                <NodePalette />
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
          <Suspense fallback={null}>
            <FavoritesPanel />
          </Suspense>
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
            <Suspense fallback={null}>
              <DebugPanel />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <XmlPreviewPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const BTEditor: React.FC<BTEditorProps> = ({ className = '', storageKey }) => {
  return (
    <BTStoreProvider storageKey={storageKey}>
      <BTEditorContent className={className} />
    </BTStoreProvider>
  );
};

export default BTEditor;
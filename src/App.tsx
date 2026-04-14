import React, { useEffect, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toolbar from './components/Toolbar';
import NodePalette from './components/NodePalette';
import BTCanvas from './components/BTCanvas';
import TreeManager from './components/TreeManager';
import { useBTStore } from './store/btStore';
import './App.css';

// Code-split helper panels (loaded asynchronously)
const PropertiesPanel = React.lazy(() => import('./components/PropertiesPanel'));
const DebugPanel = React.lazy(() => import('./components/DebugPanel'));
const FavoritesPanel = React.lazy(() => import('./components/FavoritesPanel'));
const XmlPreviewPanel = React.lazy(() => import('./components/XmlPreviewPanel.tsx'));

const App: React.FC = () => {
  const { t } = useTranslation();
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  useEffect(() => {
    useBTStore.getState().initTheme();
  }, []);

  return (
    <div className="app-layout">
      <Toolbar />
      <div className="main-area">
        {/* Left sidebar */}
        {leftSidebarCollapsed ? (
          <button
            type="button"
            className="sidebar-collapsed-toggle left"
            onClick={() => setLeftSidebarCollapsed(false)}
            title={t('layout.expandLeftSidebar')}
            aria-label={t('layout.expandLeftSidebar')}
          >
            {'>'}
          </button>
        ) : (
          <div className="left-sidebar-area">
            <div className="left-sidebar">
              <NodePalette />
              <TreeManager />
            </div>
            <button
              type="button"
              className="sidebar-toggle-strip"
              onClick={() => setLeftSidebarCollapsed(true)}
              title={t('layout.collapseLeftSidebar')}
              aria-label={t('layout.collapseLeftSidebar')}
            >
              {'<'}
            </button>
          </div>
        )}

        {/* Canvas */}
        <div className="canvas-area">
          <BTCanvas />
          <Suspense fallback={null}>
            <FavoritesPanel />
          </Suspense>
        </div>

        {/* Right sidebar */}
        {rightSidebarCollapsed ? (
          <button
            type="button"
            className="sidebar-collapsed-toggle right"
            onClick={() => setRightSidebarCollapsed(false)}
            title={t('layout.expandRightSidebar')}
            aria-label={t('layout.expandRightSidebar')}
          >
            {'<'}
          </button>
        ) : (
          <div className="right-sidebar-area">
            <button
              type="button"
              className="sidebar-toggle-strip"
              onClick={() => setRightSidebarCollapsed(true)}
              title={t('layout.collapseRightSidebar')}
              aria-label={t('layout.collapseRightSidebar')}
            >
              {'>'}
            </button>
            <div className="right-sidebar">
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
        )}
      </div>
    </div>
  );
};

export default App;

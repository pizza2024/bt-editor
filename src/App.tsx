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
  const bothSidebarsCollapsed = leftSidebarCollapsed && rightSidebarCollapsed;

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
    useBTStore.getState().initTheme();
  }, []);

  return (
    <div className="app-layout">
      <Toolbar />
      <div className="main-area">
        {/* Left sidebar */}
        <div className={`left-sidebar-area${leftSidebarCollapsed ? ' collapsed' : ''}`}>
          <div className="left-sidebar">
            <NodePalette />
            <TreeManager />
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

        {/* Canvas */}
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

        {/* Right sidebar */}
        <div className={`right-sidebar-area${rightSidebarCollapsed ? ' collapsed' : ''}`}>
          <button
            type="button"
            className="sidebar-toggle-strip"
            onClick={() => setRightSidebarCollapsed((value) => !value)}
            title={rightSidebarCollapsed ? t('layout.expandRightSidebar') : t('layout.collapseRightSidebar')}
            aria-label={rightSidebarCollapsed ? t('layout.expandRightSidebar') : t('layout.collapseRightSidebar')}
          >
            {rightSidebarCollapsed ? '<' : '>'}
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
      </div>
    </div>
  );
};

export default App;

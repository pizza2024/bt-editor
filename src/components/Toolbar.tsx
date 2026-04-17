import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTStore } from '../store/BTStoreProvider';
import { SAMPLE_XML, analyzeMissingNodeModels, type MissingNodeModelCandidate } from '../utils/btXml';
import MissingNodeModelsImporterModal from './MissingNodeModelsImporterModal';
import { useBTEditorIntegration, isIntegrationReadonly } from '../integration/context';
import { writeStoredLocale } from '../integration/defaultAdapters';
import { dispatchEditorWindowEvent } from '../integration/editorEvents';

function isProjectModeSwitchLocked(project: { trees: Array<{ root: { children: unknown[] } }>; mainTreeId: string }): boolean {
  return project.trees.some((tree) => tree.root.children.length > 0);
}

const Toolbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const integration = useBTEditorIntegration();
  
  // Separate selectors for each value to maintain proper reactivity
  // Use arrow functions to ensure they return the same reference for same values
  const loadXML = useBTStore((state) => state.loadXML);
  const exportXML = useBTStore((state) => state.exportXML);
  const setExportFormat = useBTStore((state) => state.setExportFormat);
  const toggleTheme = useBTStore((state) => state.toggleTheme);
  const project = useBTStore((state) => state.project);
  const activeTreeId = useBTStore((state) => state.activeTreeId);
  const theme = useBTStore((state) => state.theme);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [missingModelCandidates, setMissingModelCandidates] = useState<MissingNodeModelCandidate[]>([]);
  
  // Extract xmlFormat from the latest project state
  const xmlFormat: 3 | 4 = project.exportFormat ?? 4;
  const formatSwitchLocked = isProjectModeSwitchLocked(project);

  const toggleLanguage = () => {
    if (!integration || integration.localeControlled) {
      return;
    }

    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    writeStoredLocale(newLang, integration.adapters.storageAdapter);
  };

  const handleExport = useCallback(() => {
    const result = integration?.exportXml('user');
    const xml = result?.ok ? result.data : exportXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${project.mainTreeId}.xml`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }, [exportXML, project.mainTreeId]);

  // Ctrl+S: Export XML
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExport]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const xml = ev.target?.result as string;
      let candidates: MissingNodeModelCandidate[] = [];
      try {
        candidates = analyzeMissingNodeModels(xml);
      } catch {
        candidates = [];
      }
      const importedProject = integration?.importXml(xml, 'import');
      const nextProject = importedProject?.ok ? importedProject.data : loadXML(xml);
      if (!nextProject) return;
      setMissingModelCandidates(candidates);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPNG = () => {
    dispatchEditorWindowEvent('bt-export-png');
  };

  const handleLoadSample = () => {
    if (integration) {
      integration.importXml(SAMPLE_XML, 'api');
      return;
    }

    loadXML(SAMPLE_XML);
  };

  const readonly = isIntegrationReadonly(integration);
  const features = integration?.features;
  const canImportExport = features?.importExport ?? true;
  const canExportPng = features?.pngExport ?? true;
  const canShowShortcuts = features?.shortcutsHelp ?? true;

  return (
    <div className="toolbar">
      {/* Logo */}
      <div className="toolbar-logo">
        <span style={{ color: '#4a80d0' }}>🌳</span> BT Editor
      </div>

      <div className="toolbar-divider" />

      {/* File operations */}
      {canImportExport && (
        <>
          <button className="toolbar-btn" onClick={handleLoadSample} title={t('toolbar.sample')} disabled={readonly}>
            📂 {t('toolbar.sample')}
          </button>
          <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()} title={t('toolbar.importXml')} disabled={readonly}>
            ⬆ {t('toolbar.importXml')}
          </button>
          <button className="toolbar-btn" onClick={handleExport} title={t('toolbar.exportXml')}>
            ⬇ {t('toolbar.exportXml')}
          </button>
        </>
      )}
      {/* XML Format selector */}
      <div className="toolbar-format-group">
        <span className="toolbar-format-label">
          {t('toolbar.xmlFormat')}
        </span>
        <button
          onClick={() => {
            setExportFormat(3);
          }}
          disabled={formatSwitchLocked || readonly}
          className={`toolbar-format-btn${xmlFormat === 3 ? ' active' : ''}`}
          title={formatSwitchLocked ? t('toolbar.formatLockedHint') : 'Select BehaviorTree.CPP v3 format'}
        >
          v3
        </button>
        <button
          onClick={() => {
            setExportFormat(4);
          }}
          disabled={formatSwitchLocked || readonly}
          className={`toolbar-format-btn${xmlFormat === 4 ? ' active' : ''}`}
          title={formatSwitchLocked ? t('toolbar.formatLockedHint') : 'Select BehaviorTree.CPP v4 format'}
        >
          v4
        </button>
      </div>
      {canExportPng && (
        <button className="toolbar-btn" onClick={handleExportPNG} title={t('toolbar.exportPng')}>
          🖼️ {t('toolbar.exportPng')}
        </button>
      )}
      {/* Keyboard shortcuts help */}
      {canShowShortcuts && (
        <button
          className="toolbar-btn"
          onClick={() => dispatchEditorWindowEvent('bt-toggle-shortcuts-help')}
          title={t('toolbar.help')}
        >
          ?
        </button>
      )}
      <input ref={fileInputRef} type="file" accept=".xml" style={{ display: 'none' }} onChange={handleImport} />

      <div className="toolbar-divider" />

      {/* Active tree info */}
      <div style={{ fontSize: 12, color: '#8899bb' }}>
        {t('canvas.treeLabel')}: <span style={{ color: '#c8e0ff', fontWeight: 600 }}>{activeTreeId}</span>
        {activeTreeId === project.mainTreeId && (
          <span style={{ color: '#f0a020', marginLeft: 6 }}>★ {t('canvas.mainTree')}</span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Language toggle */}
      <button
        className="toolbar-btn"
        onClick={toggleLanguage}
        title={t('language.switch')}
        style={{ minWidth: 60 }}
        disabled={integration?.localeControlled}
      >
        {i18n.language === 'en' ? '🇺🇸 EN' : '🇨🇳 中文'}
      </button>

      {/* Theme toggle */}
      <button
        className="toolbar-btn"
        onClick={toggleTheme}
        title={t('toolbar.theme')}
        style={{ minWidth: 70 }}
        disabled={integration?.themeControlled}
      >
        {theme === 'dark' ? '🌙 ' + t('toolbar.dark') : '☀️ ' + t('toolbar.light')}
      </button>

      {/* Help */}
      <div style={{ fontSize: 11, color: '#445', textAlign: 'right' }}>
        {t('canvas.dragHint')}
      </div>

      {missingModelCandidates.length > 0 && (
        <MissingNodeModelsImporterModal
          candidates={missingModelCandidates}
          onClose={() => setMissingModelCandidates([])}
        />
      )}
    </div>
  );
};

export default Toolbar;

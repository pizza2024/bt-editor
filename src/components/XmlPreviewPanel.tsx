import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTStore } from '../store/btStore';
import { serializeXML } from '../utils/btXml';

const XmlPreviewPanel: React.FC = () => {
  const { t } = useTranslation();
  const project = useBTStore((state) => state.project);
  const activeTreeId = useBTStore((state) => state.activeTreeId);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<number | null>(null);

  const xml = useMemo(() => serializeXML(project), [project]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }
    };
  }, []);

  const handleToggle = () => {
    setCollapsed((value) => !value);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }
      copyResetRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetRef.current = null;
      }, 1200);
    } catch {
      window.alert(t('xmlPreview.copyFailed'));
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
    <aside className="xml-preview-sidebar" aria-label={t('xmlPreview.title')}>
      <div className="xml-preview-header">
        <div className="xml-preview-title-wrap">
          <div className="xml-preview-title">{t('xmlPreview.title')}</div>
          <div className="xml-preview-subtitle">{t('xmlPreview.description')}</div>
        </div>
        <div className="xml-preview-actions">
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
            onClick={handleToggle}
            title={t('xmlPreview.collapse')}
            aria-label={t('xmlPreview.collapse')}
          >
            {'>'}
          </button>
        </div>
      </div>
      <div className="xml-preview-body">
        <div className="xml-preview-meta">{t('xmlPreview.activeTree', { tree: activeTreeId })}</div>
        <pre className="xml-preview-code">{xml || t('xmlPreview.empty')}</pre>
      </div>
    </aside>
  );
};

export default XmlPreviewPanel;
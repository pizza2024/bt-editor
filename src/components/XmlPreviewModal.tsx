import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Editor, { type OnMount } from '@monaco-editor/react';

interface XmlPreviewModalProps {
  xml: string;
  fileName: string;
  onClose: () => void;
}

const XmlPreviewModal: React.FC<XmlPreviewModalProps> = ({ xml, fileName, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const lines = useMemo(() => xml.split('\n'), [xml]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = xml;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
      document.body.removeChild(ta);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    // Keep Ctrl/Cmd+F (search), bracket folding, etc. — all built into Monaco.
    void monaco;
  }, []);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content xml-preview-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="XML Preview"
      >
        <div className="modal-header">
          <div className="modal-title">
            <span style={{ fontSize: 18 }}>🧾</span>
            <span className="modal-node-type">{t('xmlPreview.title', 'XML Preview')}</span>
            <span className="modal-instance-id">{fileName}</span>
          </div>
          <button className="modal-close" onClick={onClose} title="Close (Escape)">
            ×
          </button>
        </div>

        <div className="xml-preview-toolbar">
          <span className="xml-preview-stats">
            {lines.length} {t('xmlPreview.lines', 'lines')} · {xml.length.toLocaleString()} {t('xmlPreview.chars', 'chars')}
          </span>
          <div className="xml-preview-actions">
            <button
              className="btn-secondary"
              onClick={() => setWordWrap((v) => !v)}
              title="Toggle word wrap"
            >
              {wordWrap ? '⤵ Wrap: On' : '⤵ Wrap: Off'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleCopy}
              title={t('xmlPreview.copy', 'Copy')}
            >
              {copied ? `✓ ${t('xmlPreview.copied', 'Copied!')}` : `📋 ${t('xmlPreview.copy', 'Copy')}`}
            </button>
            <button
              className="btn-secondary"
              onClick={handleDownload}
              title={t('xmlPreview.download', 'Download')}
            >
              ⬇ {t('xmlPreview.download', 'Download')}
            </button>
            <button
              className="btn-primary"
              onClick={onClose}
              title={t('xmlPreview.close', 'Close')}
            >
              {t('xmlPreview.close', 'Close')}
            </button>
          </div>
        </div>

        <div className="modal-body xml-preview-body">
          {xml.trim().length === 0 ? (
            <div className="xml-preview-empty">{t('xmlPreview.emptyTree', '(empty tree)')}</div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage="xml"
              language="xml"
              theme="vs-dark"
              value={xml}
              onMount={handleEditorMount}
              options={{
                readOnly: true,
                domReadOnly: true,
                minimap: { enabled: true },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Cascadia Code, Consolas, monospace',
                lineNumbers: 'on',
                wordWrap: wordWrap ? 'on' : 'off',
                folding: true,
                foldingStrategy: 'indentation',
                renderWhitespace: 'selection',
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                padding: { top: 8, bottom: 8 },
              }}
              loading={<div className="xml-preview-empty">Loading editor…</div>}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default XmlPreviewModal;

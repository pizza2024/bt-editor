import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import BTFlowNode from './BTFlowNode';
import i18n from '../../i18n';
import { BTStoreProvider } from '../../store/BTStoreProvider';
import { createBTStore } from '../../store/btStore';
import { BTEditorIntegrationProvider, type BTEditorIntegrationContextValue } from '../../integration/context';

vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="mock-handle" />,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
  },
}));

function buildIntegrationValue(readonly: boolean): BTEditorIntegrationContextValue {
  return {
    mode: readonly ? 'readonly' : 'edit',
    readonly,
    theme: 'dark',
    locale: 'en',
    features: {
      toolbar: true,
      xmlPreview: true,
      debugPanel: true,
      favoritesPanel: true,
      treeTabs: true,
      shortcutsHelp: true,
      pngExport: true,
      importExport: true,
    },
    uiConfig: {},
    adapters: {
      storageAdapter: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
      notifyAdapter: {
        alert: () => {},
        confirm: () => false,
      },
      clipboardAdapter: {
        writeText: async () => {},
      },
      loggerAdapter: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    },
    localeControlled: false,
    themeControlled: false,
    modelActions: {
      addNodeModel: () => {},
      updateNodeModel: () => {},
      replaceNodeModel: () => {},
      deleteNodeModel: () => {},
    },
    guardEditableAction: () => !readonly,
    importXml: () => ({ ok: false, error: { code: 'not-used', message: 'not-used' } }),
    exportXml: () => ({ ok: false, error: { code: 'not-used', message: 'not-used' } }),
    reportError: () => {},
  };
}

type TestNodeData = {
  label: string;
  nodeType: string;
  category: string;
  colors: { bg: string; border: string; text: string };
  ports: Record<string, string>;
  portDefs?: Array<{ name: string; direction: 'input' | 'output' | 'inout' }>;
  preconditions?: Record<string, string>;
  postconditions?: Record<string, string>;
  description?: string;
  status?: string;
  childrenCount: number;
  isRoot?: boolean;
};

const baseNodeData: TestNodeData = {
  label: 'MoveToGoal',
  nodeType: 'MoveToGoal',
  category: 'Action',
  colors: { bg: '#111', border: '#222', text: '#eee' },
  ports: {},
  childrenCount: 0,
};

function createNodeProps(data: TestNodeData) {
  return {
    id: 'n_1',
    data,
    selected: false,
    dragging: false,
    zIndex: 1,
    isConnectable: true,
    type: 'btNode',
    xPos: 0,
    yPos: 0,
  } as unknown as React.ComponentProps<typeof BTFlowNode>;
}

describe('BTFlowNode readonly behavior', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderNode(data: TestNodeData, readonly: boolean) {
    const store = createBTStore('btflow-node-test');
    act(() => {
      root.render(
        <React.StrictMode>
          <I18nextProvider i18n={i18n}>
            <BTEditorIntegrationProvider value={buildIntegrationValue(readonly)}>
              <BTStoreProvider store={store}>
                <BTFlowNode {...createNodeProps(data)} />
              </BTStoreProvider>
            </BTEditorIntegrationProvider>
          </I18nextProvider>
        </React.StrictMode>
      );
    });
  }

  it('does not emit node-edit on double click when readonly', () => {
    const onNodeEdit = vi.fn();
    window.addEventListener('bt-node-edit', onNodeEdit as EventListener);

    renderNode(baseNodeData, true);

    const nodeRoot = container.firstElementChild as HTMLElement | null;
    expect(nodeRoot).toBeTruthy();

    act(() => {
      nodeRoot?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    expect(onNodeEdit).not.toHaveBeenCalled();
    window.removeEventListener('bt-node-edit', onNodeEdit as EventListener);
  });

  it('emits open-subtree on double click for subtree node in readonly mode', () => {
    const onOpenSubtree = vi.fn();
    window.addEventListener('bt-open-subtree', onOpenSubtree as EventListener);

    renderNode(
      {
        ...baseNodeData,
        nodeType: 'SubTree',
        category: 'SubTree',
        label: 'ChildTree',
      },
      true
    );

    const nodeRoot = container.firstElementChild as HTMLElement | null;

    act(() => {
      nodeRoot?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    expect(onOpenSubtree).toHaveBeenCalledTimes(1);
    window.removeEventListener('bt-open-subtree', onOpenSubtree as EventListener);
  });

  it('does not emit node-edit for port double click when readonly', () => {
    const onNodeEdit = vi.fn();
    window.addEventListener('bt-node-edit', onNodeEdit as EventListener);

    renderNode(
      {
        ...baseNodeData,
        ports: { speed: '1.0' },
        portDefs: [{ name: 'speed', direction: 'input' }],
      },
      true
    );

    const portRow = container.querySelector('[title="Double-click to edit: speed"]') as HTMLElement | null;
    expect(portRow).toBeTruthy();

    act(() => {
      portRow?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    expect(onNodeEdit).not.toHaveBeenCalled();
    window.removeEventListener('bt-node-edit', onNodeEdit as EventListener);
  });
});

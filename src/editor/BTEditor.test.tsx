import React, { createRef } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import BTEditor from './BTEditor';
import type { BTEditorRef } from '../integration/types';
import type { BTProject } from '../types/bt';
import { useBTStore } from '../store/BTStoreProvider';
import { useBTEditorIntegration } from '../integration/context';

vi.mock('../components/Toolbar', () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock('../components/NodePalette', () => ({
  default: () => <div data-testid="node-palette" />,
}));

vi.mock('../components/BTCanvas', () => ({
  default: () => {
    const integration = useBTEditorIntegration();
    return (
      <div className="react-flow" data-testid="bt-canvas">
        {(integration?.features.treeTabs ?? true) && <div data-testid="tree-tabs-visible" />}
      </div>
    );
  },
}));

vi.mock('../components/TreeManager', () => ({
  default: () => {
    const integration = useBTEditorIntegration();
    const addTree = useBTStore((state) => state.addTree);

    return (
      <div data-testid="tree-manager">
        <button
          data-testid="tree-manager-add"
          disabled={integration?.readonly}
          onClick={() => addTree('AddedTree')}
        >
          add tree
        </button>
      </div>
    );
  },
}));

vi.mock('../components/PropertiesPanel', () => ({
  default: () => <div data-testid="properties-panel" />,
}));

vi.mock('../components/DebugPanel', () => ({
  default: () => <div data-testid="debug-panel" />,
}));

vi.mock('../components/FavoritesPanel', () => ({
  default: () => <div data-testid="favorites-panel" />,
}));

vi.mock('../components/XmlPreviewPanel.tsx', () => ({
  default: () => <div data-testid="xml-preview-panel" />,
}));

const projectA: BTProject = {
  mainTreeId: 'MainTree',
  nodeModels: [],
  trees: [
    {
      id: 'MainTree',
      root: {
        id: 'n_root_a',
        type: 'ROOT',
        ports: {},
        children: [],
      },
    },
    {
      id: 'AltTree',
      root: {
        id: 'n_root_alt',
        type: 'ROOT',
        ports: {},
        children: [],
      },
    },
  ],
  exportFormat: 4,
};

const projectB: BTProject = {
  mainTreeId: 'OtherTree',
  nodeModels: [],
  trees: [
    {
      id: 'OtherTree',
      root: {
        id: 'n_root_b',
        type: 'ROOT',
        ports: {},
        children: [],
      },
    },
  ],
  exportFormat: 4,
};

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function renderEditor(element: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(element);
    await Promise.resolve();
    await Promise.resolve();
  });

  return {
    async rerender(nextElement: React.ReactElement) {
      await act(async () => {
        root?.render(nextElement);
        await Promise.resolve();
        await Promise.resolve();
      });
    },
  };
}

beforeAll(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
  window.localStorage.clear();
});

describe('BTEditor integration API', () => {
  it('applies defaultValue and emits onReady with a usable ref API', async () => {
    const onReady = vi.fn();
    const ref = createRef<BTEditorRef>();

    await renderEditor(<BTEditor ref={ref} defaultValue={projectA} onReady={onReady} />);

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(ref.current?.getProject()).toEqual(projectA);

    const exportResult = ref.current?.exportXml();
    expect(exportResult?.ok).toBe(true);
    if (exportResult?.ok) {
      expect(exportResult.data).toContain('BehaviorTree');
      expect(exportResult.data).toContain(projectA.mainTreeId);
    }
  });

  it('syncs controlled value updates without emitting onChange for prop-driven updates', async () => {
    const onChange = vi.fn();
    const ref = createRef<BTEditorRef>();
    const rendered = await renderEditor(<BTEditor ref={ref} value={projectA} onChange={onChange} />);

    expect(ref.current?.getProject()).toEqual(projectA);

    await rendered.rerender(<BTEditor ref={ref} value={projectB} onChange={onChange} />);

    expect(ref.current?.getProject()).toEqual(projectB);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits onChange with api origin when setProject is called through ref', async () => {
    const onChange = vi.fn();
    const ref = createRef<BTEditorRef>();

    await renderEditor(<BTEditor ref={ref} defaultValue={projectA} onChange={onChange} />);

    await act(async () => {
      ref.current?.setProject(projectB);
      await Promise.resolve();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      projectB,
      expect.objectContaining({
        type: 'change',
        origin: 'api',
      })
    );
  });

  it('emits onTreeChange for tree mutations', async () => {
    const onTreeChange = vi.fn();

    await renderEditor(<BTEditor defaultValue={projectA} onTreeChange={onTreeChange} />);

    const addTreeButton = container?.querySelector('[data-testid="tree-manager-add"]') as HTMLButtonElement | null;
    expect(addTreeButton).toBeTruthy();

    await act(async () => {
      addTreeButton?.click();
      await Promise.resolve();
    });

    expect(onTreeChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'add-tree',
        treeId: 'AddedTree',
      }),
      expect.objectContaining({
        type: 'tree-change',
        origin: 'user',
      })
    );
  });

  it('propagates readonly mode and feature flags to child integration consumers', async () => {
    await renderEditor(
      <BTEditor
        defaultValue={projectA}
        mode="readonly"
        features={{ treeTabs: false }}
      />
    );

    const addTreeButton = container?.querySelector('[data-testid="tree-manager-add"]') as HTMLButtonElement | null;
    const treeTabsMarker = container?.querySelector('[data-testid="tree-tabs-visible"]');

    expect(addTreeButton?.disabled).toBe(true);
    expect(treeTabsMarker).toBeNull();
  });
});
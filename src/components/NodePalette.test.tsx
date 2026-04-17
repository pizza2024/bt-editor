import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import NodePalette from './NodePalette';
import { BTStoreProvider } from '../store/BTStoreProvider';
import { createBTStore } from '../store/btStore';
import i18n from '../i18n';

describe('NodePalette', () => {
  let container: HTMLDivElement;
  let root: Root;
  let previousActEnvironment: boolean | undefined;

  beforeEach(() => {
    previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
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
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  it('opens a readonly model definition modal when a palette item is double-clicked', () => {
    const store = createBTStore('node-palette-readonly-test');

    act(() => {
      root.render(
        <React.StrictMode>
          <I18nextProvider i18n={i18n}>
            <BTStoreProvider store={store}>
              <NodePalette />
            </BTStoreProvider>
          </I18nextProvider>
        </React.StrictMode>
      );
    });

    const paletteItems = Array.from(container.querySelectorAll('.palette-item'));
    const sequenceItem = paletteItems.find((item) => {
      const label = item.querySelector('.palette-item-label')?.textContent?.trim();
      return label === 'Sequence';
    });

    expect(sequenceItem).toBeTruthy();

    act(() => {
      sequenceItem!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    expect(container.textContent).toContain('Model Definition: Sequence');

    const nodeTypeInput = container.querySelector('input[placeholder="e.g. MoveToGoal"]') as HTMLInputElement | null;
    const descriptionInput = container.querySelector('input[placeholder="Optional description of this node type"]') as HTMLInputElement | null;

    expect(nodeTypeInput?.value).toBe('Sequence');
    expect(nodeTypeInput?.disabled).toBe(true);
    expect(descriptionInput?.disabled).toBe(true);
    expect(container.querySelector('.btn-add-port')).toBeNull();
    expect(container.querySelector('.btn-danger')).toBeNull();
    expect(container.querySelector('.node-model-modal .modal-footer .btn-primary')).toBeNull();
  });
});
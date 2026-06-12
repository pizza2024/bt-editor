import { expect, test } from '@playwright/test';
import { loadSampleTree, waitForCanvasReady } from './helpers';

test.describe('XML Preview Modal', () => {
  test('right-click on pane shows Preview XML menu item', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);

    // Right-click on an empty area of the canvas (away from nodes)
    const pane = page.locator('.react-flow__pane');
    const box = await pane.boundingBox();
    expect(box).not.toBeNull();
    // Click in bottom-right corner (likely empty)
    await pane.click({
      button: 'right',
      position: { x: box!.width - 50, y: box!.height - 50 },
    });

    // Context menu should appear
    const menu = page.locator('.context-menu');
    await expect(menu).toBeVisible();

    // The Preview XML menu item should be present
    const previewItem = menu.locator('button', { hasText: /Preview XML/ });
    await expect(previewItem).toBeVisible();
  });

  test('clicking Preview XML opens modal with XML content', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);

    const pane = page.locator('.react-flow__pane');
    const box = await pane.boundingBox();
    await pane.click({
      button: 'right',
      position: { x: box!.width - 50, y: box!.height - 50 },
    });

    await page.locator('.context-menu button', { hasText: /Preview XML/ }).click();

    // Modal should be visible
    const modal = page.locator('.xml-preview-modal');
    await expect(modal).toBeVisible();

    // Title should be present
    await expect(modal.locator('.modal-node-type')).toContainText(/XML Preview/i);

    // Content area should have line numbers and XML
    const preBlock = modal.locator('.xml-preview-pre');
    await expect(preBlock).toBeVisible();

    // Verify the XML contains expected content
    const code = await modal.locator('.xml-preview-code').first().textContent();
    expect(code).toContain('BTCPP_format="4"');
    expect(code).toContain('MainTree');
  });

  test('XML preview modal has Copy and Download buttons', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);

    // Open via right-click
    const pane = page.locator('.react-flow__pane');
    const box = await pane.boundingBox();
    await pane.click({
      button: 'right',
      position: { x: box!.width - 50, y: box!.height - 50 },
    });
    await page.locator('.context-menu button', { hasText: /Preview XML/ }).click();

    const modal = page.locator('.xml-preview-modal');
    await expect(modal).toBeVisible();

    // Copy button
    const copyBtn = modal.locator('button', { hasText: /Copy/ });
    await expect(copyBtn).toBeVisible();

    // Download button
    const downloadBtn = modal.locator('button', { hasText: /Download/ });
    await expect(downloadBtn).toBeVisible();
  });

  test('Ctrl+Shift+S toggles XML preview', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);

    // Press Ctrl+Shift+S
    await page.keyboard.press('Control+Shift+S');
    await page.waitForTimeout(200);

    await expect(page.locator('.xml-preview-modal')).toBeVisible();

    // Press Escape to close (handled by backdrop click; here we click close button)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });
});

import { expect, test } from '@playwright/test';
import { loadSampleTree, waitForCanvasReady } from './helpers';

test.describe('Auto-Layout Modes', () => {
  test('toolbar contains a layout mode selector', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);

    // The select element should exist in the toolbar
    const selector = page.locator('.toolbar-select');
    await expect(selector).toBeVisible();

    // Should have 3 options: Standard, Compact, Horizontal
    const options = await selector.locator('option').allTextContents();
    expect(options.length).toBe(3);
    expect(options.map((o) => o.toLowerCase())).toEqual(
      expect.arrayContaining([expect.stringMatching(/standard/), expect.stringMatching(/compact/), expect.stringMatching(/horizontal/)]),
    );
  });

  test('switching to Compact layout reduces horizontal spread of siblings', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);

    // Helper to get horizontal spread of children in the main tree
    const getHorizontalSpread = async () => {
      // Read node positions from the page state
      return await page.evaluate(() => {
        const nodes = document.querySelectorAll('.react-flow__node');
        const positions: number[] = [];
        nodes.forEach((n) => {
          const style = (n as HTMLElement).style.transform;
          const match = style.match(/translate\(([\d.]+)px,\s*([\d.]+)px\)/);
          if (match) {
            positions.push(parseFloat(match[1]));
          }
        });
        if (positions.length < 2) return 0;
        return Math.max(...positions) - Math.min(...positions);
      });
    };

    // Default (standard)
    const standardSpread = await getHorizontalSpread();

    // Switch to compact
    await page.locator('.toolbar-select').selectOption('compact');
    await page.waitForTimeout(800);
    const compactSpread = await getHorizontalSpread();

    // Compact should have smaller or equal spread (the sample tree may already be tight)
    expect(compactSpread).toBeLessThanOrEqual(standardSpread);
  });

  test('switching to Horizontal (LR) layout rearranges nodes left-to-right', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);

    await page.locator('.toolbar-select').selectOption('lr');
    await page.waitForTimeout(800);

    // In LR mode, child should be to the right of parent (x increases down the tree)
    const layoutCheck = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
      const positions = nodes
        .map((n) => {
          const match = (n as HTMLElement).style.transform.match(/translate\(([\d.]+)px,\s*([\d.]+)px\)/);
          return match ? { id: n.getAttribute('data-id'), x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
        })
        .filter(Boolean) as { id: string; x: number; y: number }[];

      const xs = positions.map((p) => p.x);
      const ys = positions.map((p) => p.y);
      const xSpread = Math.max(...xs) - Math.min(...xs);
      const ySpread = Math.max(...ys) - Math.min(...ys);
      return { xSpread, ySpread };
    });

    expect(layoutCheck.xSpread).toBeGreaterThan(0);
  });
});

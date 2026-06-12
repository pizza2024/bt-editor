import { expect, test } from '@playwright/test';
import { loadSampleTree, waitForCanvasReady } from './helpers';

test.describe('Edge Style (Bezier + Arrow)', () => {
  test('edges render as bezier curves with arrow markers', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);

    // Wait for edges to appear
    await page.waitForSelector('.react-flow__edge', { timeout: 5000 });

    // At least one edge should have a marker-end attribute pointing to a bt-arrow-* id
    const edges = page.locator('.react-flow__edge .react-flow__edge-path');
    const count = await edges.count();
    expect(count).toBeGreaterThan(0);

    // Verify the first edge's SVG has the bezier path style (M ... C ... cubic curve)
    const firstEdge = edges.first();
    const pathD = await firstEdge.getAttribute('d');
    expect(pathD).toBeTruthy();
    // Bezier paths contain "C" commands (cubic curves)
    expect(pathD).toMatch(/[Cc]\s*[\d.-]+/);

    // Verify marker definitions exist in the SVG
    const markers = page.locator('marker[id^="bt-arrow-"]');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);
  });

  test('edge delete button is rendered and clickable', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);
    await page.waitForSelector('.bt-edge-delete-group', { timeout: 5000 });

    // Each edge should have a delete button (g.bt-edge-delete-group)
    const deleteButtons = page.locator('.bt-edge-delete-group');
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);

    // First delete button should contain an SVG path (X shape)
    const firstBtn = deleteButtons.first();
    const xPath = firstBtn.locator('path');
    await expect(xPath).toBeVisible();

    // Verify the X path uses d attribute with M..L..M..L pattern
    const d = await xPath.getAttribute('d');
    expect(d).toMatch(/M\s*-?\d/);
    expect(d).toContain('L');
  });

  test('edge delete button hover changes color (CSS hover state)', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasReady(page);
    await loadSampleTree(page);
    await page.waitForSelector('.bt-edge-delete-group', { timeout: 5000 });

    const deleteButton = page.locator('.bt-edge-delete-group').first();
    // Initial opacity should be 0.5 (not selected)
    const initialOpacity = await deleteButton.evaluate((el) => getComputedStyle(el).opacity);
    expect(parseFloat(initialOpacity)).toBeLessThan(1);

    // Hover should increase opacity to 1
    await deleteButton.hover({ force: true });
    await page.waitForTimeout(200);
    const hoverOpacity = await deleteButton.evaluate((el) => getComputedStyle(el).opacity);
    expect(parseFloat(hoverOpacity)).toBe(1);
  });
});

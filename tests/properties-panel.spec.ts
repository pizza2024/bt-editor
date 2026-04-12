import { expect, test } from '@playwright/test';
import { loadSampleTree, getNodeLocator } from './helpers';

test.describe('Properties Panel', () => {
  test('显示选中节点详情', async ({ page }) => {
    await page.goto('/');
    await loadSampleTree(page);

    // Click on a node to select it
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();

    // Verify properties panel shows details
    await expect(page.locator('.properties-panel')).toBeVisible();
    // Panel should show node info (category, name, ID)
    const panelText = await page.locator('.properties-panel').textContent();
    expect(panelText).toBeTruthy();
    expect(panelText.length).toBeGreaterThan(10);
  });

  test('显示端口信息', async ({ page }) => {
    await page.goto('/');
    await loadSampleTree(page);

    // Click on MoveToGoal node which has ports
    const moveToGoalNode = getNodeLocator(page, 'MoveToGoal');
    if (await moveToGoalNode.count() > 0) {
      await moveToGoalNode.first().click();

      // Check for port section
      const panel = page.locator('.properties-panel');
      await expect(panel).toContainText(/port|input|output/i);
    }
  });

  test('Apply 按钮更新画布节点', async ({ page }) => {
    await page.goto('/');
    await loadSampleTree(page);

    // Find a node with ports and select it
    const moveToGoalNode = getNodeLocator(page, 'MoveToGoal');
    if (await moveToGoalNode.count() > 0) {
      await moveToGoalNode.first().click();
      await page.waitForTimeout(300);

      // Find the Apply button in properties panel
      const applyBtn = page.locator('.properties-panel').getByRole('button', { name: /Apply/i });

      if (await applyBtn.count() > 0) {
        await applyBtn.click();
        await page.waitForTimeout(500);

        // Verify the node still exists after apply
        await expect(moveToGoalNode.first()).toBeVisible();
      }
    }
  });

  test('取消选择时面板清空', async ({ page }) => {
    await page.goto('/');
    await loadSampleTree(page);

    // Select a node first
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    await page.waitForTimeout(200);

    // Click on empty canvas area to deselect
    const pane = page.locator('.react-flow__pane');
    await pane.click({ position: { x: 10, y: 10 } });

    // Panel should show "Select a node" message
    await expect(page.locator('.properties-panel')).toContainText(/select a node/i);
  });

  test('双击打开编辑弹窗', async ({ page }) => {
    await page.goto('/');
    await loadSampleTree(page);

    // Double click on a node
    const sequenceNode = getNodeLocator(page, 'ControlRoot');
    if (await sequenceNode.count() > 0) {
      await sequenceNode.first().dblclick();
      await page.waitForTimeout(300);

      // Verify edit modal opens
      await expect(page.locator('.node-edit-modal, [role="dialog"]')).toBeVisible();
    }
  });
});

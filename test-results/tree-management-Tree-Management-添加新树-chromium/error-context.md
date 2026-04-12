# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tree-management.spec.ts >> Tree Management >> 添加新树
- Location: tests/tree-management.spec.ts:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.tree-manager input[placeholder="NewTreeName"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:oxc] Transform failed with 1 error: [PARSE_ERROR] Error: Unexpected token. Did you mean `{'}'}` or `&rbrace;`? ╭─[ src/components/NodePalette.tsx:183:1 ] │ 183 │ }; │ │ │ ╰─ ─────╯"
  - generic [ref=e5]: /Users/pizza/workspace/btcpp-web-groot-demo/src/components/NodePalette.tsx
  - generic [ref=e6]: at transformWithOxc (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:3745:19) at TransformPluginContext.transform (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:3813:26) at EnvironmentPluginContainer.transform (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:30143:51) at async loadAndTransform (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:24468:26) at async viteTransformMiddleware (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:24262:20)
  - generic [ref=e7]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e8]: server.hmr.overlay
    - text: to
    - code [ref=e9]: "false"
    - text: in
    - code [ref=e10]: vite.config.ts
    - text: .
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { loadSampleTree } from './helpers';
  3  | 
  4  | test.describe('Tree Management', () => {
  5  |   test('添加新树', async ({ page }) => {
  6  |     await page.goto('/');
  7  | 
  8  |     // Fill in tree name in the TreeManager input
  9  |     const treeInput = page.locator('.tree-manager input[placeholder="NewTreeName"]');
> 10 |     await treeInput.fill('NewTree');
     |                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  11 | 
  12 |     // Click the + button
  13 |     await page.locator('.tree-manager .btn-primary').click();
  14 | 
  15 |     // Verify new tree appears in tree manager
  16 |     await expect(page.locator('.tree-item', { hasText: 'NewTree' })).toBeVisible();
  17 |   });
  18 | 
  19 |   test('切换活跃树', async ({ page }) => {
  20 |     await page.goto('/');
  21 |     await loadSampleTree(page);
  22 | 
  23 |     // Add a new tree
  24 |     const treeInput = page.locator('.tree-manager input[placeholder="NewTreeName"]');
  25 |     await treeInput.fill('SecondTree');
  26 |     await page.locator('.tree-manager .btn-primary').click();
  27 |     await page.waitForTimeout(500);
  28 | 
  29 |     // Verify we switched to the new tree (should have only ROOT node)
  30 |     const nodeCount = await page.locator('.react-flow__node').count();
  31 |     expect(nodeCount).toBe(1); // Just ROOT
  32 | 
  33 |     // Verify new tree is selected
  34 |     await expect(page.locator('.tree-item.active')).toContainText('SecondTree');
  35 |   });
  36 | 
  37 |   test('切换树后画布正确更新', async ({ page }) => {
  38 |     await page.goto('/');
  39 |     await loadSampleTree(page);
  40 | 
  41 |     // Sample tree has multiple nodes
  42 |     const nodesBefore = await page.locator('.react-flow__node').count();
  43 |     expect(nodesBefore).toBeGreaterThan(1);
  44 | 
  45 |     // Add new empty tree
  46 |     const treeInput = page.locator('.tree-manager input[placeholder="NewTreeName"]');
  47 |     await treeInput.fill('EmptyTree');
  48 |     await page.locator('.tree-manager .btn-primary').click();
  49 |     await page.waitForTimeout(500);
  50 | 
  51 |     // New tree should have just ROOT
  52 |     const nodesAfter = await page.locator('.react-flow__node').count();
  53 |     expect(nodesAfter).toBe(1);
  54 |   });
  55 | 
  56 |   test('删除非主树', async ({ page }) => {
  57 |     await page.goto('/');
  58 |     await loadSampleTree(page);
  59 | 
  60 |     // Add a new tree
  61 |     const treeInput = page.locator('.tree-manager input[placeholder="NewTreeName"]');
  62 |     await treeInput.fill('DeletableTree');
  63 |     await page.locator('.tree-manager .btn-primary').click();
  64 |     await page.waitForTimeout(300);
  65 | 
  66 |     // Click delete button (✕) on the deletable tree
  67 |     const deletableTreeItem = page.locator('.tree-item', { hasText: 'DeletableTree' });
  68 |     const deleteBtn = deletableTreeItem.locator('button[title="Delete"]');
  69 |     await deleteBtn.click();
  70 | 
  71 |     // Verify tree was deleted
  72 |     await expect(page.locator('.tree-item', { hasText: 'DeletableTree' })).not.toBeVisible();
  73 |   });
  74 | 
  75 |   test('设置主树', async ({ page }) => {
  76 |     await page.goto('/');
  77 |     await loadSampleTree(page);
  78 | 
  79 |     // Add a new tree
  80 |     const treeInput = page.locator('.tree-manager input[placeholder="NewTreeName"]');
  81 |     await treeInput.fill('FutureMain');
  82 |     await page.locator('.tree-manager .btn-primary').click();
  83 |     await page.waitForTimeout(300);
  84 | 
  85 |     // Click the ★ button to set as main
  86 |     const futureMainItem = page.locator('.tree-item', { hasText: 'FutureMain' });
  87 |     const mainBtn = futureMainItem.locator('button[title="Set as main tree"]');
  88 |     await mainBtn.click();
  89 | 
  90 |     // Verify it now has main tree indicator
  91 |     await expect(futureMainItem).toContainText('★');
  92 |   });
  93 | });
  94 | 
```
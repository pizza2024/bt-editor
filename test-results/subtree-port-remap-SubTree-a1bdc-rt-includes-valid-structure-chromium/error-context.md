# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subtree-port-remap.spec.ts >> SubTree Port Remapping >> XML export includes valid structure
- Location: tests/subtree-port-remap.spec.ts:62:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.react-flow') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:oxc] Transform failed with 1 error: [PARSE_ERROR] Error: Unexpected token. Did you mean `{'}'}` or `&rbrace;`? ╭─[ src/components/NodePalette.tsx:183:1 ] │ 183 │ }; │ │ │ ╰─ ─────╯"
  - generic [ref=e5]: /Users/pizza/workspace/btcpp-web-groot-demo/src/components/NodePalette.tsx
  - generic [ref=e6]: at transformWithOxc (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:3745:19) at TransformPluginContext.transform (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:3813:26) at EnvironmentPluginContainer.transform (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:30143:51) at async loadAndTransform (file:///Users/pizza/workspace/btcpp-web-groot-demo/node_modules/vite/dist/node/chunks/node.js:24468:26)
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
  3  | import * as fs from 'fs';
  4  | 
  5  | test.describe('SubTree Port Remapping', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.goto('/');
> 8  |     await page.waitForSelector('.react-flow');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  9  |   });
  10 | 
  11 |   test('SubTree node can be added to canvas', async ({ page }) => {
  12 |     // Drag SubTree from palette to canvas
  13 |     const subtreePalette = page.locator('.palette-item', { hasText: 'SubTree' }).first();
  14 |     const pane = page.locator('.react-flow__pane');
  15 |     await subtreePalette.dragTo(pane, { targetPosition: { x: 400, y: 300 } });
  16 |     await page.waitForTimeout(500);
  17 | 
  18 |     // Verify SubTree node appears on canvas
  19 |     const subtreeNode = page.locator('.react-flow__node', { hasText: 'SubTree' });
  20 |     await expect(subtreeNode).toBeVisible();
  21 |   });
  22 | 
  23 |   test('SubTree node edit modal shows auto-remap option', async ({ page }) => {
  24 |     // Add SubTree to canvas
  25 |     const subtreePalette = page.locator('.palette-item', { hasText: 'SubTree' }).first();
  26 |     const pane = page.locator('.react-flow__pane');
  27 |     await subtreePalette.dragTo(pane, { targetPosition: { x: 400, y: 300 } });
  28 |     await page.waitForTimeout(500);
  29 | 
  30 |     // Double click to open edit modal
  31 |     const subtreeNode = page.locator('.react-flow__node', { hasText: 'SubTree' }).first();
  32 |     await subtreeNode.dblclick();
  33 |     await page.waitForTimeout(300);
  34 | 
  35 |     // Verify modal opens
  36 |     const modal = page.locator('.node-edit-modal');
  37 |     await expect(modal).toBeVisible();
  38 | 
  39 |     // Verify auto-remap checkbox exists
  40 |     const autoRemapLabel = page.locator('.checkbox-label', { hasText: 'Auto-remap' });
  41 |     await expect(autoRemapLabel).toBeVisible();
  42 |   });
  43 | 
  44 |   test('SubTree modal has tree selection dropdown', async ({ page }) => {
  45 |     // Add SubTree to canvas
  46 |     const subtreePalette = page.locator('.palette-item', { hasText: 'SubTree' }).first();
  47 |     const pane = page.locator('.react-flow__pane');
  48 |     await subtreePalette.dragTo(pane, { targetPosition: { x: 400, y: 300 } });
  49 |     await page.waitForTimeout(500);
  50 | 
  51 |     // Open edit modal
  52 |     const subtreeNode = page.locator('.react-flow__node', { hasText: 'SubTree' }).first();
  53 |     await subtreeNode.dblclick();
  54 |     await page.waitForTimeout(300);
  55 | 
  56 |     // Verify ModelName dropdown exists with -- Select Tree -- option
  57 |     const select = page.locator('.node-edit-modal select');
  58 |     await expect(select).toBeVisible();
  59 |     await expect(select.locator('option[value=""]')).toContainText('-- Select Tree --');
  60 |   });
  61 | 
  62 |   test('XML export includes valid structure', async ({ page }) => {
  63 |     await loadSampleTree(page);
  64 | 
  65 |     // Export XML
  66 |     const [download] = await Promise.all([
  67 |       page.waitForEvent('download'),
  68 |       page.getByRole('button', { name: '⬇ Export XML' }).click(),
  69 |     ]);
  70 | 
  71 |     const path = await download.path();
  72 |     const xmlContent = fs.readFileSync(path!, 'utf8');
  73 | 
  74 |     // Verify valid XML structure
  75 |     expect(xmlContent).toContain('BTCPP_format="4"');
  76 |     expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  77 |     expect(xmlContent).toContain('<root');
  78 |     expect(xmlContent).toContain('</root>');
  79 |   });
  80 | });
  81 | 
```
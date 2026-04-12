# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: node-picker.spec.ts >> Node Picker >> should display Models Palette header
- Location: tests/node-picker.spec.ts:10:3

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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Node Picker', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |     // Wait for the app to load
> 7  |     await page.waitForSelector('.react-flow');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  8  |   });
  9  | 
  10 |   test('should display Models Palette header', async ({ page }) => {
  11 |     const paletteHeader = page.locator('.panel-header', { hasText: 'Models Palette' });
  12 |     await expect(paletteHeader).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should have Action category in palette', async ({ page }) => {
  16 |     // Check that Action category is visible in palette
  17 |     const actionCategory = page.locator('.cat-header', { hasText: 'Action' });
  18 |     await expect(actionCategory).toBeVisible();
  19 |   });
  20 | 
  21 |   test('should open edit modal on node double-click', async ({ page }) => {
  22 |     // Find and double-click a node (Sequence from Control category)
  23 |     const sequenceNode = page.locator('.react-flow__node').filter({ hasText: 'Sequence' }).first();
  24 |     
  25 |     if (await sequenceNode.isVisible()) {
  26 |       await sequenceNode.dblclick();
  27 |       
  28 |       // Check modal appears
  29 |       const modal = page.locator('.node-edit-modal');
  30 |       await expect(modal).toBeVisible();
  31 |     }
  32 |   });
  33 | 
  34 |   test('should display node picker styles in CSS', async ({ page }) => {
  35 |     // Verify the node-picker CSS class exists
  36 |     const pickerStyle = page.locator('.node-picker');
  37 |     // The picker itself won't be visible until triggered
  38 |     // But we can verify the element doesn't throw errors
  39 |   });
  40 | 
  41 |   test('all node types should have rectangular shape', async ({ page }) => {
  42 |     // All nodes should have border-radius style making them rectangular
  43 |     // Check that Decorator nodes are no longer circular
  44 |     const decoratorNode = page.locator('.react-flow__node').filter({ hasText: 'Inverter' });
  45 |     // Inverter is a Decorator - it should now be rectangular, not circular
  46 |   });
  47 | });
  48 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: debug-panel.spec.ts >> Debug Panel >> debug panel shows status color indicators
- Location: tests/debug-panel.spec.ts:27:3

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
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.describe('Debug Panel', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
> 6  |     await page.waitForSelector('.react-flow');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  7  |   });
  8  | 
  9  |   test('debug panel is visible', async ({ page }) => {
  10 |     // Debug panel should be visible
  11 |     const debugPanel = page.locator('.debug-panel');
  12 |     await expect(debugPanel).toBeVisible();
  13 |   });
  14 | 
  15 |   test('debug panel has header', async ({ page }) => {
  16 |     const debugPanel = page.locator('.debug-panel');
  17 |     await expect(debugPanel).toContainText('Debug');
  18 |   });
  19 | 
  20 |   test('debug panel has playback controls', async ({ page }) => {
  21 |     const debugPanel = page.locator('.debug-panel');
  22 |     // Should have Play button or similar controls
  23 |     const panelText = await debugPanel.textContent();
  24 |     expect(panelText).toBeTruthy();
  25 |   });
  26 | 
  27 |   test('debug panel shows status color indicators', async ({ page }) => {
  28 |     const debugPanel = page.locator('.debug-panel');
  29 |     await expect(debugPanel).toBeVisible();
  30 |     // The panel should be able to contain status info
  31 |     const text = await debugPanel.textContent();
  32 |     expect(text).toContain('Log');
  33 |   });
  34 | });
  35 | 
```
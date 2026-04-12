# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: connection-rules.spec.ts >> Node Connection Rules >> should allow multiple connections from Control nodes
- Location: tests/connection-rules.spec.ts:32:3

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
  3  | test.describe('Node Connection Rules', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
> 6  |     await page.waitForSelector('.react-flow');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  7  |   });
  8  | 
  9  |   test('should allow connection from ROOT to Sequence', async ({ page }) => {
  10 |     // ROOT should be visible
  11 |     const rootNode = page.locator('.react-flow__node').filter({ hasText: 'ROOT' });
  12 |     await expect(rootNode).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should block connection from Action to any node', async ({ page }) => {
  16 |     // Actions are leaf nodes and should not have outgoing connections
  17 |     // This test verifies the connection validation logic
  18 |   });
  19 | 
  20 |   test('should block connection from Condition to any node', async ({ page }) => {
  21 |     // Conditions are leaf nodes and should not have outgoing connections
  22 |   });
  23 | 
  24 |   test('should block second connection from ROOT', async ({ page }) => {
  25 |     // ROOT can only have ONE child
  26 |   });
  27 | 
  28 |   test('should block second connection from Decorator', async ({ page }) => {
  29 |     // Decorator can only have ONE child
  30 |   });
  31 | 
  32 |   test('should allow multiple connections from Control nodes', async ({ page }) => {
  33 |     // Sequence, Fallback, etc. can have multiple children
  34 |   });
  35 | 
  36 |   test('should allow multiple connections from SubTree', async ({ page }) => {
  37 |     // SubTree can have multiple children
  38 |   });
  39 | });
  40 | 
```
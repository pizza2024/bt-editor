# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/drop-parent.spec.ts >> dragged node keeps its manual position after autosave delay
- Location: tests/e2e/drop-parent.spec.ts:34:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.react-flow__node').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.react-flow__node').first()

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
  3  | test('dropped node stays on canvas without auto-connecting an edge', async ({ page }) => {
  4  |   await page.goto('/');
  5  | 
  6  |   // Open Add Model modal
  7  |   await page.getByRole('button', { name: '+ Add Model' }).click();
  8  | 
  9  |   // Fill in the node type name (using the actual placeholder text from NodeModelModal)
  10 |   const nodeNameInput = page.getByPlaceholder('e.g. MoveToGoal');
  11 |   await nodeNameInput.fill('E2EAction');
  12 | 
  13 |   // Click Create to add the model
  14 |   await page.getByRole('button', { name: 'Create' }).click();
  15 | 
  16 |   const paletteItem = page.locator('.palette-item', { hasText: 'E2EAction' }).first();
  17 |   const pane = page.locator('.react-flow__pane');
  18 |   const edges = page.locator('.bt-flow-edge');
  19 |   await expect(paletteItem).toBeVisible();
  20 |   await expect(pane).toBeVisible();
  21 |   await expect(edges).toHaveCount(0);
  22 | 
  23 |   await paletteItem.dragTo(pane, {
  24 |     targetPosition: { x: 420, y: 220 },
  25 |   });
  26 | 
  27 |   await page.waitForTimeout(1200);
  28 | 
  29 |   const droppedNode = page.locator('.react-flow__node', { hasText: 'E2EAction' });
  30 |   await expect(droppedNode).toHaveCount(1);
  31 |   await expect(edges).toHaveCount(0);
  32 | });
  33 | 
  34 | test('dragged node keeps its manual position after autosave delay', async ({ page }) => {
  35 |   await page.goto('/');
  36 | 
  37 |   const node = page.locator('.react-flow__node').first();
> 38 |   await expect(node).toBeVisible();
     |                      ^ Error: expect(locator).toBeVisible() failed
  39 | 
  40 |   const beforeBox = await node.boundingBox();
  41 |   expect(beforeBox).not.toBeNull();
  42 | 
  43 |   if (!beforeBox) {
  44 |     throw new Error('Node bounding box not available before drag');
  45 |   }
  46 | 
  47 |   await page.mouse.move(beforeBox.x + beforeBox.width / 2, beforeBox.y + beforeBox.height / 2);
  48 |   await page.mouse.down();
  49 |   await page.mouse.move(beforeBox.x + beforeBox.width / 2 + 140, beforeBox.y + beforeBox.height / 2 + 120, {
  50 |     steps: 8,
  51 |   });
  52 |   await page.mouse.up();
  53 | 
  54 |   await page.waitForTimeout(1200);
  55 | 
  56 |   const afterBox = await node.boundingBox();
  57 |   expect(afterBox).not.toBeNull();
  58 | 
  59 |   if (!afterBox) {
  60 |     throw new Error('Node bounding box not available after drag');
  61 |   }
  62 | 
  63 |   expect(afterBox.x).toBeGreaterThan(beforeBox.x + 80);
  64 |   expect(afterBox.y).toBeGreaterThan(beforeBox.y + 60);
  65 | });
  66 | 
  67 | test('edge can be deleted with its delete button', async ({ page }) => {
  68 |   await page.goto('/');
  69 |   await page.getByRole('button', { name: '📂 Sample' }).click();
  70 |   await page.waitForTimeout(1500);
  71 | 
  72 |   // Wait for canvas to render with nodes
  73 |   const canvas = page.locator('.react-flow__pane');
  74 |   await expect(canvas).toBeVisible({ timeout: 10000 });
  75 | 
  76 |   // Use .bt-flow-edge for reliable counting (each edge has one such element)
  77 |   const edges = page.locator('.bt-flow-edge');
  78 |   await expect(edges.first()).toBeVisible({ timeout: 10000 });
  79 | 
  80 |   const countBefore = await edges.count();
  81 |   // Use position-based click because SVG text elements need exact positioning
  82 |   await page.locator('.bt-edge-delete').first().click({ position: { x: 5, y: 10 } });
  83 |   // Wait for state update and re-render
  84 |   await page.waitForTimeout(2000);
  85 | 
  86 |   await expect(edges).toHaveCount(countBefore - 1);
  87 | });
  88 | 
```
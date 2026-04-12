# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: copy-paste.spec.ts >> Copy/Paste >> pasted node is selected after paste
- Location: tests/copy-paste.spec.ts:106:3

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
  1   | import { expect, test } from '@playwright/test';
  2   | import { loadSampleTree } from './helpers';
  3   | 
  4   | test.describe('Copy/Paste', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
> 7   |     await page.waitForSelector('.react-flow');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  8   |   });
  9   | 
  10  |   test('Ctrl+C copies selected node', async ({ page }) => {
  11  |     await loadSampleTree(page);
  12  |     await page.waitForTimeout(500);
  13  | 
  14  |     // Select a node
  15  |     const nodes = page.locator('.react-flow__node');
  16  |     await nodes.nth(1).click();
  17  |     await page.waitForTimeout(200);
  18  | 
  19  |     // Copy with Ctrl+C
  20  |     await page.keyboard.press('Control+c');
  21  |     await page.waitForTimeout(200);
  22  | 
  23  |     // Paste with Ctrl+V
  24  |     await page.keyboard.press('Control+v');
  25  |     await page.waitForTimeout(500);
  26  | 
  27  |     // Should now have one more node
  28  |     const nodeCount = await page.locator('.react-flow__node').count();
  29  |     const initialCount = await loadSampleTree(page).then(() => page.locator('.react-flow__node').count());
  30  |     
  31  |     // After paste, we should have more nodes
  32  |     expect(nodeCount).toBeGreaterThan(1);
  33  |   });
  34  | 
  35  |   test('Ctrl+V pastes copied node with offset', async ({ page }) => {
  36  |     await loadSampleTree(page);
  37  |     await page.waitForTimeout(500);
  38  | 
  39  |     // Get position of first non-ROOT node before copy
  40  |     const nodes = page.locator('.react-flow__node');
  41  |     const nodeBefore = nodes.nth(1);
  42  |     const boxBefore = await nodeBefore.boundingBox();
  43  | 
  44  |     // Select and copy
  45  |     await nodeBefore.click();
  46  |     await page.waitForTimeout(100);
  47  |     await page.keyboard.press('Control+c');
  48  |     await page.waitForTimeout(200);
  49  | 
  50  |     // Paste
  51  |     await page.keyboard.press('Control+v');
  52  |     await page.waitForTimeout(500);
  53  | 
  54  |     // Pasted node should be offset (at least one axis should be different)
  55  |     const nodeAfter = nodes.nth(2);
  56  |     const boxAfter = await nodeAfter.boundingBox();
  57  | 
  58  |     if (boxBefore && boxAfter) {
  59  |       // At least one coordinate should be different due to offset
  60  |       const xDiff = Math.abs(boxAfter.x - boxBefore.x);
  61  |       const yDiff = Math.abs(boxAfter.y - boxBefore.y);
  62  |       expect(xDiff + yDiff).toBeGreaterThan(0);
  63  |     }
  64  |   });
  65  | 
  66  |   test('Ctrl+V without selection does nothing', async ({ page }) => {
  67  |     await loadSampleTree(page);
  68  |     await page.waitForTimeout(500);
  69  | 
  70  |     // Count nodes before
  71  |     const nodesBefore = await page.locator('.react-flow__node').count();
  72  | 
  73  |     // Press Ctrl+V without copying anything
  74  |     await page.keyboard.press('Control+v');
  75  |     await page.waitForTimeout(200);
  76  | 
  77  |     // Count nodes after - should be same
  78  |     const nodesAfter = await page.locator('.react-flow__node').count();
  79  |     expect(nodesAfter).toBe(nodesBefore);
  80  |   });
  81  | 
  82  |   test('multiple Ctrl+V pastes multiple nodes', async ({ page }) => {
  83  |     await loadSampleTree(page);
  84  |     await page.waitForTimeout(500);
  85  | 
  86  |     // Select a node and copy
  87  |     const nodes = page.locator('.react-flow__node');
  88  |     await nodes.nth(1).click();
  89  |     await page.waitForTimeout(100);
  90  |     await page.keyboard.press('Control+c');
  91  |     await page.waitForTimeout(200);
  92  | 
  93  |     // Paste 3 times
  94  |     await page.keyboard.press('Control+v');
  95  |     await page.waitForTimeout(300);
  96  |     await page.keyboard.press('Control+v');
  97  |     await page.waitForTimeout(300);
  98  |     await page.keyboard.press('Control+v');
  99  |     await page.waitForTimeout(300);
  100 | 
  101 |     // Should have more nodes
  102 |     const nodeCount = await page.locator('.react-flow__node').count();
  103 |     expect(nodeCount).toBeGreaterThan(4);
  104 |   });
  105 | 
  106 |   test('pasted node is selected after paste', async ({ page }) => {
  107 |     await loadSampleTree(page);
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: undo-redo.spec.ts >> Undo/Redo >> no crash when redo stack is empty
- Location: tests/undo-redo.spec.ts:119:3

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
  4   | test.describe('Undo/Redo', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
> 7   |     await page.waitForSelector('.react-flow');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  8   |   });
  9   | 
  10  |   test('Ctrl+Z undoes node deletion', async ({ page }) => {
  11  |     await loadSampleTree(page);
  12  |     await page.waitForTimeout(500);
  13  | 
  14  |     // Get initial node count
  15  |     const initialNodes = await page.locator('.react-flow__node').count();
  16  |     expect(initialNodes).toBeGreaterThan(1);
  17  | 
  18  |     // Select a node - click on the first non-ROOT node
  19  |     const nodes = page.locator('.react-flow__node');
  20  |     await nodes.nth(1).click();  // Second node (first is usually ROOT)
  21  |     await page.waitForTimeout(200);
  22  | 
  23  |     // Delete it using keyboard
  24  |     await page.keyboard.press('Delete');
  25  |     await page.waitForTimeout(500);
  26  | 
  27  |     // Verify node is deleted
  28  |     const afterDeleteNodes = await page.locator('.react-flow__node').count();
  29  |     expect(afterDeleteNodes).toBe(initialNodes - 1);
  30  | 
  31  |     // Undo
  32  |     await page.keyboard.press('Control+z');
  33  |     await page.waitForTimeout(500);
  34  | 
  35  |     // Verify node is restored
  36  |     const afterUndoNodes = await page.locator('.react-flow__node').count();
  37  |     expect(afterUndoNodes).toBe(initialNodes);
  38  |   });
  39  | 
  40  |   test('Ctrl+Y redoes undone operation', async ({ page }) => {
  41  |     await loadSampleTree(page);
  42  |     await page.waitForTimeout(500);
  43  | 
  44  |     // Get initial node count
  45  |     const initialNodes = await page.locator('.react-flow__node').count();
  46  | 
  47  |     // Select and delete a node
  48  |     const nodes = page.locator('.react-flow__node');
  49  |     await nodes.nth(1).click();
  50  |     await page.waitForTimeout(200);
  51  |     await page.keyboard.press('Delete');
  52  |     await page.waitForTimeout(500);
  53  | 
  54  |     // Undo
  55  |     await page.keyboard.press('Control+z');
  56  |     await page.waitForTimeout(500);
  57  | 
  58  |     // Verify node is back
  59  |     const afterUndoNodes = await page.locator('.react-flow__node').count();
  60  |     expect(afterUndoNodes).toBe(initialNodes);
  61  | 
  62  |     // Redo
  63  |     await page.keyboard.press('Control+y');
  64  |     await page.waitForTimeout(500);
  65  | 
  66  |     // Verify node is deleted again
  67  |     const afterRedoNodes = await page.locator('.react-flow__node').count();
  68  |     expect(afterRedoNodes).toBe(initialNodes - 1);
  69  |   });
  70  | 
  71  |   test('Ctrl+Shift+Z also redoes', async ({ page }) => {
  72  |     await loadSampleTree(page);
  73  |     await page.waitForTimeout(500);
  74  | 
  75  |     // Get initial node count
  76  |     const initialNodes = await page.locator('.react-flow__node').count();
  77  | 
  78  |     // Select and delete a node
  79  |     const nodes = page.locator('.react-flow__node');
  80  |     await nodes.nth(1).click();
  81  |     await page.waitForTimeout(200);
  82  |     await page.keyboard.press('Delete');
  83  |     await page.waitForTimeout(500);
  84  | 
  85  |     // Undo
  86  |     await page.keyboard.press('Control+z');
  87  |     await page.waitForTimeout(500);
  88  | 
  89  |     // Verify node is back
  90  |     const afterUndoNodes = await page.locator('.react-flow__node').count();
  91  |     expect(afterUndoNodes).toBe(initialNodes);
  92  | 
  93  |     // Redo using Ctrl+Shift+Z
  94  |     await page.keyboard.press('Control+Shift+z');
  95  |     await page.waitForTimeout(500);
  96  | 
  97  |     // Verify node is deleted again
  98  |     const afterRedoNodes = await page.locator('.react-flow__node').count();
  99  |     expect(afterRedoNodes).toBe(initialNodes - 1);
  100 |   });
  101 | 
  102 | 
  103 | 
  104 |   test('no crash when undo stack is empty', async ({ page }) => {
  105 |     await loadSampleTree(page);
  106 |     await page.waitForTimeout(500);
  107 | 
```
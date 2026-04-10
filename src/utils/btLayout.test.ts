import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { autoLayout } from './btLayout';

describe('autoLayout', () => {
  it('assigns numeric positions to all nodes', () => {
    const nodes: Node[] = [
      { id: 'root', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'child', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'root', target: 'child' }];

    const laidOut = autoLayout(nodes, edges);
    const root = laidOut.find((n) => n.id === 'root');
    const child = laidOut.find((n) => n.id === 'child');

    expect(root).toBeDefined();
    expect(child).toBeDefined();
    expect(typeof root?.position.x).toBe('number');
    expect(typeof root?.position.y).toBe('number');
    expect(typeof child?.position.x).toBe('number');
    expect(typeof child?.position.y).toBe('number');
  });

  it('places child below parent in top-to-bottom layout', () => {
    const nodes: Node[] = [
      { id: 'root', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'child', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'root', target: 'child' }];

    const laidOut = autoLayout(nodes, edges);
    const root = laidOut.find((n) => n.id === 'root');
    const child = laidOut.find((n) => n.id === 'child');

    expect(root).toBeDefined();
    expect(child).toBeDefined();
    expect((child?.position.y ?? 0) > (root?.position.y ?? 0)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { autoLayout, beautifyLayout } from './btLayout';

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

  it('compact mode produces tighter spacing than standard', () => {
    // Build a tree with multiple branches at the same rank
    const nodes: Node[] = [
      { id: 'root', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'a', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'c', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'root', target: 'a' },
      { id: 'e2', source: 'root', target: 'b' },
      { id: 'e3', source: 'root', target: 'c' },
    ];

    const standard = autoLayout(nodes, edges);
    const compact = autoLayout(nodes, edges, { compact: true });

    // Compute horizontal spread of a, b, c in both layouts
    const horizontalSpread = (laid: typeof standard) => {
      const xs = ['a', 'b', 'c'].map((id) => laid.find((n) => n.id === id)!.position.x);
      return Math.max(...xs) - Math.min(...xs);
    };

    expect(horizontalSpread(compact)).toBeLessThan(horizontalSpread(standard));
  });

  it('LR rankdir places child to the right of parent', () => {
    const nodes: Node[] = [
      { id: 'root', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'child', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'root', target: 'child' }];

    const laidOut = autoLayout(nodes, edges, { rankdir: 'LR' });
    const root = laidOut.find((n) => n.id === 'root')!;
    const child = laidOut.find((n) => n.id === 'child')!;

    expect(child.position.x).toBeGreaterThan(root.position.x);
  });

  it('compact preset uses smaller default spacing than standard preset', () => {
    const nodes: Node[] = [
      { id: 'root', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'a', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'c', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'root', target: 'a' },
      { id: 'e2', source: 'root', target: 'b' },
      { id: 'e3', source: 'root', target: 'c' },
    ];

    // Use presets without explicit ranksep/nodesep
    const compact = autoLayout(nodes, edges, { compact: true });
    const standard = autoLayout(nodes, edges);

    const spread = (laid: typeof compact) => {
      const xs = ['a', 'b', 'c'].map((id) => laid.find((n) => n.id === id)!.position.x);
      return Math.max(...xs) - Math.min(...xs);
    };

    expect(spread(compact)).toBeLessThan(spread(standard));
  });
});

describe('beautifyLayout', () => {
  const buildTree = (): { nodes: Node[]; edges: Edge[] } => ({
    nodes: [
      { id: 'root', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'a', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'c', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 'root', target: 'a' },
      { id: 'e2', source: 'root', target: 'b' },
      { id: 'e3', source: 'root', target: 'c' },
    ],
  });

  it('returns numeric positions for all nodes', () => {
    const { nodes, edges } = buildTree();
    const laidOut = beautifyLayout(nodes, edges);
    for (const n of laidOut) {
      expect(typeof n.position.x).toBe('number');
      expect(typeof n.position.y).toBe('number');
    }
  });

  it('centers the tree bounding box around the origin (TB)', () => {
    const { nodes, edges } = buildTree();
    const laidOut = beautifyLayout(nodes, edges, { direction: 'TB' });
    const xs = laidOut.map((n) => n.position.x);
    const ys = laidOut.map((n) => n.position.y);
    const NODE_W = 200;
    const NODE_H = 44; // base height when node has no ports/conditions
    const cx = (Math.min(...xs) + Math.max(...xs) + NODE_W) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys) + NODE_H) / 2;
    expect(Math.abs(cx)).toBeLessThan(0.5);
    expect(Math.abs(cy)).toBeLessThan(0.5);
  });

  it('spreads siblings vertically so port-heavy nodes do not overlap', () => {
    // Chain of four leaf siblings, each carrying several port rows.
    // A flat 56-px estimate would stack them too close; per-node sizing should
    // give each one enough vertical room.
    const nodes: Node[] = [
      { id: 'root', type: 'btNode', position: { x: 0, y: 0 }, data: { isRoot: true } },
      { id: 'p1', type: 'btNode', position: { x: 0, y: 0 }, data: { ports: { a: '1', b: '2', c: '3' } } },
      { id: 'p2', type: 'btNode', position: { x: 0, y: 0 }, data: { ports: { a: '1', b: '2', c: '3' } } },
      { id: 'p3', type: 'btNode', position: { x: 0, y: 0 }, data: { ports: { a: '1', b: '2', c: '3' } } },
    ];
    const edges: Edge[] = [
      { id: 'e0', source: 'root', target: 'p1' },
      { id: 'e1', source: 'p1', target: 'p2' },
      { id: 'e2', source: 'p2', target: 'p3' },
    ];
    const laidOut = beautifyLayout(nodes, edges, { direction: 'TB' });
    const byId = new Map(laidOut.map((n) => [n.id, n]));

    // p3 should sit well below p1's top edge — at minimum p1's height + a
    // small gap, far more than the 56-px estimate that was causing overlap.
    const p1Top = byId.get('p1')!.position.y;
    const p3Top = byId.get('p3')!.position.y;
    expect(p3Top - p1Top).toBeGreaterThan(56);
  });

  it('places child to the right of parent when direction is LR', () => {
    const { nodes, edges } = buildTree();
    const laidOut = beautifyLayout(nodes, edges, { direction: 'LR' });
    const root = laidOut.find((n) => n.id === 'root')!;
    const a = laidOut.find((n) => n.id === 'a')!;
    expect(a.position.x).toBeGreaterThan(root.position.x);
  });

  it('places child below parent when direction is TB', () => {
    const { nodes, edges } = buildTree();
    const laidOut = beautifyLayout(nodes, edges, { direction: 'TB' });
    const root = laidOut.find((n) => n.id === 'root')!;
    const a = laidOut.find((n) => n.id === 'a')!;
    expect(a.position.y).toBeGreaterThan(root.position.y);
  });

  it('returns empty array when given no nodes', () => {
    expect(beautifyLayout([], [])).toEqual([]);
  });
});


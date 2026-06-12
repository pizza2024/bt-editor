import { describe, expect, it } from 'vitest';
import type { BTTree } from '../types/bt';
import type { Edge, Node } from '@xyflow/react';
import { flowToTree, isRootNode, isSameTreeStructure, treeToFlow } from './btFlow';

describe('treeToFlow', () => {
  it('converts tree nodes and edges with expected metadata', () => {
    const tree: BTTree = {
      id: 'MainTree',
      root: {
        id: 'root',
        type: 'Sequence',
        name: 'RootSequence',
        ports: {},
        children: [
          {
            id: 'leaf-1',
            type: 'CustomAction',
            ports: { goal: '{target}' },
            children: [],
          },
        ],
      },
    };

    const { nodes, edges } = treeToFlow(tree, [{ type: 'CustomAction', category: 'Action' }]);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);

    const rootNode = nodes.find((n) => n.id === 'root');
    const childNode = nodes.find((n) => n.id === 'leaf-1');

    expect(rootNode?.data).toMatchObject({
      label: 'RootSequence',
      nodeType: 'Sequence',
      category: 'Control',
    });

    expect(childNode?.data).toMatchObject({
      label: 'CustomAction',
      nodeType: 'CustomAction',
      category: 'Action',
      childIndex: 0,
    });

    expect(edges[0]).toMatchObject({
      source: 'root',
      target: 'leaf-1',
      type: 'btEdge',
    });
  });
});

describe('flowToTree', () => {
  it('rebuilds a behavior tree from flow nodes and edges', () => {
    const nodes: Node[] = [
      {
        id: 'root',
        type: 'btNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'Sequence', label: 'Sequence', ports: {} },
      },
      {
        id: 'c1',
        type: 'btNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'ActionA', label: 'Move', ports: { speed: '1.0' } },
      },
    ];

    const edges: Edge[] = [{ id: 'e1', source: 'root', target: 'c1' }];

    const tree = flowToTree('TreeA', nodes, edges);

    expect(tree.id).toBe('TreeA');
    expect(tree.root.type).toBe('Sequence');
    expect(tree.root.children).toHaveLength(1);
    expect(tree.root.children[0]).toMatchObject({
      id: 'c1',
      type: 'ActionA',
      name: 'Move',
      ports: { speed: '1.0' },
      children: [],
    });
  });

  it('throws when no root can be found', () => {
    const nodes: Node[] = [
      {
        id: 'a',
        type: 'btNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'Sequence', label: 'Sequence', ports: {} },
      },
      {
        id: 'b',
        type: 'btNode',
        position: { x: 0, y: 0 },
        data: { nodeType: 'Action', label: 'Action', ports: {} },
      },
    ];

    const edges: Edge[] = [
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'ba', source: 'b', target: 'a' },
    ];

    expect(() => flowToTree('TreeCycle', nodes, edges)).toThrow('No root node found');
  });

  it('picks ROOT-type node when multiple roots exist (e.g. after edge deletion)', () => {
    // After deleting an edge from ROOT->child, both ROOT and child become roots.
    // flowToTree should prefer the ROOT-type node so the correct tree is saved.
    const nodes: Node[] = [
      { id: 'root-a', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Sequence', label: 'Sequence', ports: {} } },
      { id: 'root-b', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'ROOT', label: 'ROOT', ports: {} } },
      { id: 'child1', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Action', label: 'Action', ports: {} } },
    ];
    // root-b->child1 edge exists; no edges to root-a (it's disconnected)
    const edges: Edge[] = [
      { id: 'e1', source: 'root-b', target: 'child1' },
    ];
    // root-a and root-b both have no incoming edges
    // Should pick root-b (ROOT-type) as the tree root
    const tree = flowToTree('TreeMultiRoot', nodes, edges);
    expect(tree.root.id).toBe('root-b');
    expect(tree.root.children).toHaveLength(1);
    expect(tree.root.children[0].id).toBe('child1');
  });

  it('builds tree from reachable nodes when disconnected nodes exist', () => {
    // When disconnected nodes exist (e.g. orphan subtree after edge deletion),
    // flowToTree should NOT throw. It builds from reachable nodes and ignores orphans.
    // Setup: Two disconnected subtrees - one rooted at orphan-root (with child),
    // and one at unreachable-root (with child). Neither has incoming edges.
    // The first root-like node in the array is picked as tree root.
    const nodes: Node[] = [
      { id: 'orphan-root', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Sequence', label: 'Sequence', ports: {} } },
      { id: 'orphan-child', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Action', label: 'Action', ports: {} } },
      { id: 'unreachable-root', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Fallback', label: 'Fallback', ports: {} } },
    ];
    // Only orphan-root->orphan-child edge; unreachable-root is truly orphaned
    const edges: Edge[] = [
      { id: 'e1', source: 'orphan-root', target: 'orphan-child' },
    ];

    // Should NOT throw - orphan-root is picked (no incoming edges, first such node)
    const tree = flowToTree('TreeDisconnected', nodes, edges);
    expect(tree.id).toBe('TreeDisconnected');
    expect(tree.root.id).toBe('orphan-root');
    expect(tree.root.children).toHaveLength(1);
    expect(tree.root.children[0].id).toBe('orphan-child');
    // unreachable-root is silently excluded (not connected to tree root)
  });
});

describe('isSameTreeStructure', () => {
  it('treats equivalent trees as equal', () => {
    const left: BTTree = {
      id: 'MainTree',
      root: {
        id: 'root',
        type: 'Sequence',
        ports: { retry: '3' },
        children: [
          {
            id: 'child',
            type: 'Action',
            name: 'Move',
            ports: {},
            children: [],
          },
        ],
      },
    };

    const right: BTTree = {
      id: 'MainTree',
      root: {
        id: 'root',
        type: 'Sequence',
        ports: { retry: '3' },
        children: [
          {
            id: 'child',
            type: 'Action',
            name: 'Move',
            ports: {},
            children: [],
          },
        ],
      },
    };

    expect(isSameTreeStructure(left, right)).toBe(true);
  });

  it('detects structural differences', () => {
    const left: BTTree = {
      id: 'MainTree',
      root: {
        id: 'root',
        type: 'Sequence',
        ports: {},
        children: [],
      },
    };

    const right: BTTree = {
      id: 'MainTree',
      root: {
        id: 'root',
        type: 'Sequence',
        ports: {},
        children: [
          {
            id: 'child',
            type: 'Action',
            ports: {},
            children: [],
          },
        ],
      },
    };

    expect(isSameTreeStructure(left, right)).toBe(false);
  });
});

describe('isRootNode', () => {
  it('returns true when data.isRoot === true', () => {
    const node: Node = {
      id: 'r',
      type: 'btNode',
      position: { x: 0, y: 0 },
      data: { isRoot: true, nodeType: 'ROOT' },
    };
    expect(isRootNode(node)).toBe(true);
  });

  it('returns true when data.nodeType === "ROOT" but isRoot flag is missing', () => {
    // Side channels (e.g. bt-nodes-updated, older XML imports) may rebuild
    // the data without the isRoot flag. The nodeType fallback keeps delete
    // guards correct.
    const node: Node = {
      id: 'r',
      type: 'btNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'ROOT' },
    };
    expect(isRootNode(node)).toBe(true);
  });

  it('returns false for a non-root node', () => {
    const node: Node = {
      id: 'a',
      type: 'btNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'Sequence' },
    };
    expect(isRootNode(node)).toBe(false);
  });

  it('returns false for a node with empty data', () => {
    const node: Node = {
      id: 'a',
      type: 'btNode',
      position: { x: 0, y: 0 },
      data: {},
    };
    expect(isRootNode(node)).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isRootNode(null)).toBe(false);
    expect(isRootNode(undefined)).toBe(false);
  });

  it('does not misclassify a node whose nodeType contains "ROOT" as substring', () => {
    // Guards against accidental substring matches (the helper uses strict
    // equality with EDITOR_ROOT_TYPE which is the literal "ROOT").
    const node: Node = {
      id: 'a',
      type: 'btNode',
      position: { x: 0, y: 0 },
      data: { nodeType: 'SubTreeROOTLike' },
    };
    expect(isRootNode(node)).toBe(false);
  });
});

describe('root-deletion regression', () => {
  // Mirrors the filtering done in BTCanvas's keydown handler so that a future
  // refactor of that handler can't silently re-introduce the bug where
  // Ctrl+A → Backspace removed the root.
  const buildDeleteSet = (
    nodes: Node[],
    selectedNodeIds: ReadonlySet<string>
  ): Set<string> => {
    const rootIds = new Set(nodes.filter(isRootNode).map((n) => n.id));
    return new Set(
      Array.from(selectedNodeIds).filter((id) => !rootIds.has(id))
    );
  };

  it('Ctrl+A on a tree excludes the root from the delete set', () => {
    const nodes: Node[] = [
      { id: 'r', type: 'btNode', position: { x: 0, y: 0 }, data: { isRoot: true, nodeType: 'ROOT' } },
      { id: 'a', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Sequence' } },
      { id: 'b', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Action' } },
    ];
    const selected = new Set(nodes.map((n) => n.id));
    const toDelete = buildDeleteSet(nodes, selected);

    expect(toDelete.has('r')).toBe(false);
    expect(toDelete.has('a')).toBe(true);
    expect(toDelete.has('b')).toBe(true);
  });

  it('a single-root-only selection produces an empty delete set', () => {
    const nodes: Node[] = [
      { id: 'r', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'ROOT' } },
    ];
    const selected = new Set(['r']);
    expect(buildDeleteSet(nodes, selected).size).toBe(0);
  });

  it('root kept when the data is missing the isRoot flag but has nodeType', () => {
    const nodes: Node[] = [
      { id: 'r', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'ROOT' } },
      { id: 'a', type: 'btNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const selected = new Set(['r', 'a']);
    const toDelete = buildDeleteSet(nodes, selected);
    expect(toDelete.has('r')).toBe(false);
    expect(toDelete.has('a')).toBe(true);
  });

  it('real BT root identified by having no incoming edges (sample-tree case)', () => {
    // The SAMPLE_XML tree's root is a <Sequence name="Root"> — not the virtual
    // ROOT type. Its data has nodeType: 'Sequence' and isRoot: false, but it
    // is the root of its tree because no edges point to it. The deletion
    // guard must catch this case via edge-based detection.
    const nodes: Node[] = [
      { id: 'r', type: 'btNode', position: { x: 0, y: 0 }, data: { nodeType: 'Sequence' } },
      { id: 'a', type: 'btNode', position: { x: 0, y: 100 }, data: { nodeType: 'Condition' } },
      { id: 'b', type: 'btNode', position: { x: 0, y: 200 }, data: { nodeType: 'Action' } },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'r', target: 'a' },
      { id: 'e2', source: 'r', target: 'b' },
    ];
    const selected = new Set(['r', 'a', 'b']);

    const targets = new Set(edges.map((e) => e.target));
    const rootIds = new Set(
      nodes
        .filter((n) => isRootNode(n) || !targets.has(n.id))
        .map((n) => n.id)
    );
    const toDelete = new Set(
      Array.from(selected).filter((id) => !rootIds.has(id))
    );
    expect(rootIds.has('r')).toBe(true);
    expect(toDelete.has('r')).toBe(false);
    expect(toDelete.has('a')).toBe(true);
    expect(toDelete.has('b')).toBe(true);
  });
});

import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import { BUILTIN_NODES } from '../types/bt-constants';

const DEFAULT_WIDTH = 200;
const ROOT_HEIGHT = 36;
const BASE_HEIGHT = 44; // padding + category badge + label + border
const PORT_SECTION_OVERHEAD = 8; // top margin + border + bottom margin
const PORT_ROW_HEIGHT = 18;
const CONDITION_ROW_HEIGHT = 14;

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export interface AutoLayoutOptions {
  /** Layout direction. Default: 'TB' (top-to-bottom) */
  rankdir?: LayoutDirection;
  /** Vertical (TB/BT) or horizontal (LR/RL) spacing between ranks. Default: 60 */
  ranksep?: number;
  /** Horizontal (TB/BT) or vertical (LR/RL) spacing between nodes in same rank. Default: 30 */
  nodesep?: number;
  /** Compact preset: tighter ranksep/nodesep (24/16). Overrides ranksep/nodesep when true. */
  compact?: boolean;
}

const STANDARD_DEFAULTS = {
  rankdir: 'TB' as LayoutDirection,
  ranksep: 60,
  nodesep: 30,
};

const COMPACT_DEFAULTS = {
  rankdir: 'TB' as LayoutDirection,
  ranksep: 24,
  nodesep: 16,
};

interface NodeSize {
  width: number;
  height: number;
}

/**
 * Estimate the rendered size of a node based on its data.
 * Mirrors the visual structure of BTFlowNode: a small base plus one row per
 * visible port entry, plus a row for pre/post condition icons when present.
 * Returning per-node dimensions lets dagre space siblings without overlap.
 */
function estimateNodeSize(node: Node): NodeSize {
  const data = node.data as
    | {
        isRoot?: boolean;
        nodeType?: string;
        ports?: Record<string, string>;
        preconditions?: Record<string, string>;
        postconditions?: Record<string, string>;
        description?: string;
      }
    | undefined;

  if (!data) return { width: DEFAULT_WIDTH, height: BASE_HEIGHT };
  if (data.isRoot === true) return { width: DEFAULT_WIDTH, height: ROOT_HEIGHT };

  // Count visible ports: non-empty instance values, plus defined ports not
  // already represented in the instance data. Matches BTFlowNode's grouping.
  const instancePorts = data.ports ?? {};
  const setInstanceKeys = Object.entries(instancePorts)
    .filter(([, v]) => v !== '')
    .map(([k]) => k);
  const def = BUILTIN_NODES.find((n) => n.type === data.nodeType);
  const definedPorts = def?.ports ?? [];
  const extraDefined = definedPorts.filter(
    (p) => !setInstanceKeys.includes(p.name) && p.name !== '__autoremap'
  );
  const portCount = setInstanceKeys.length + extraDefined.length;

  const hasPre = !!(
    data.preconditions && Object.values(data.preconditions).some((v) => v)
  );
  const hasPost = !!(
    data.postconditions && Object.values(data.postconditions).some((v) => v)
  );
  // description is shown only as a tooltip badge — does not add a body row
  const hasConditionRow = hasPre || hasPost;

  let height = BASE_HEIGHT;
  if (portCount > 0) {
    height += PORT_SECTION_OVERHEAD + portCount * PORT_ROW_HEIGHT;
  }
  if (hasConditionRow) {
    height += CONDITION_ROW_HEIGHT;
  }

  return { width: DEFAULT_WIDTH, height };
}

/**
 * Auto-layout nodes using Dagre.
 *
 * @example
 *   autoLayout(nodes, edges)
 *   autoLayout(nodes, edges, { compact: true })
 *   autoLayout(nodes, edges, { rankdir: 'LR', ranksep: 80, nodesep: 40 })
 */
export function autoLayout(
  nodes: Node[],
  edges: Edge[],
  options: AutoLayoutOptions = {}
): Node[] {
  const base = options.compact ? COMPACT_DEFAULTS : STANDARD_DEFAULTS;
  const cfg = {
    rankdir: options.rankdir ?? base.rankdir,
    ranksep: options.compact
      ? (options.ranksep ?? base.ranksep)
      : (options.ranksep ?? base.ranksep),
    nodesep: options.compact
      ? (options.nodesep ?? base.nodesep)
      : (options.nodesep ?? base.nodesep),
  };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: cfg.rankdir,
    ranksep: cfg.ranksep,
    nodesep: cfg.nodesep,
    acyclicer: 'greedy',
    ranker: 'tight-tree',
  });

  // Per-node dimensions so tall port-heavy nodes don't overlap their siblings.
  const sizes = new Map<string, NodeSize>();
  nodes.forEach((n) => {
    const size = estimateNodeSize(n);
    sizes.set(n.id, size);
    g.setNode(n.id, { width: size.width, height: size.height });
  });
  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    const size = sizes.get(n.id) ?? { width: DEFAULT_WIDTH, height: BASE_HEIGHT };
    return {
      ...n,
      position: {
        x: pos.x - size.width / 2,
        y: pos.y - size.height / 2,
      },
    };
  });
}

/**
 * Beautify-layout: a polished one-shot layout pass with extra breathing room,
 * network-simplex ranker for clean alignment, per-node sizing so port-heavy
 * nodes don't overlap, and post-layout centering so the tree is nicely framed
 * at the origin.
 */
export function beautifyLayout(
  nodes: Node[],
  edges: Edge[],
  options: { direction?: LayoutDirection } = {}
): Node[] {
  if (nodes.length === 0) return nodes;

  const direction = options.direction ?? 'TB';

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 80,
    nodesep: 50,
    acyclicer: 'greedy',
    ranker: 'network-simplex',
    marginx: 20,
    marginy: 20,
  });

  const sizes = new Map<string, NodeSize>();
  nodes.forEach((n) => {
    const size = estimateNodeSize(n);
    sizes.set(n.id, size);
    g.setNode(n.id, { width: size.width, height: size.height });
  });
  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const laidOut = nodes.map((n) => {
    const pos = g.node(n.id);
    const size = sizes.get(n.id) ?? { width: DEFAULT_WIDTH, height: BASE_HEIGHT };
    return {
      ...n,
      position: {
        x: pos.x - size.width / 2,
        y: pos.y - size.height / 2,
      },
    };
  });

  // Center the bounding box around the origin. Use per-node size so a tall
  // port-heavy node doesn't make the bounding box too small.
  const placedRects = laidOut.map((n) => {
    const size = sizes.get(n.id) ?? { width: DEFAULT_WIDTH, height: BASE_HEIGHT };
    return {
      right: n.position.x + size.width,
      bottom: n.position.y + size.height,
    };
  });
  const minX = Math.min(...laidOut.map((n) => n.position.x));
  const minY = Math.min(...laidOut.map((n) => n.position.y));
  const maxX = Math.max(...placedRects.map((r) => r.right));
  const maxY = Math.max(...placedRects.map((r) => r.bottom));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return laidOut.map((n) => ({
    ...n,
    position: { x: n.position.x - cx, y: n.position.y - cy },
  }));
}

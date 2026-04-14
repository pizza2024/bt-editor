import type { Edge, Node } from '@xyflow/react';

/**
 * Validate outgoing connection count by source node category.
 * - Action/Condition cannot have children
 * - ROOT can only have one child
 * - Decorator can only have one child
 */
export function isSourceNodeConnectionAllowed(sourceNode: Node, existingEdges: Edge[]): boolean {
  const sourceCategory = (sourceNode.data as { category?: string }).category;

  // Leaf nodes cannot have outgoing connections
  if (sourceCategory === 'Action' || sourceCategory === 'Condition') {
    return false;
  }

  // ROOT can only have a single child
  if (sourceCategory === 'ROOT') {
    const existingEdgesFromRoot = existingEdges.filter((e) => e.source === sourceNode.id);
    if (existingEdgesFromRoot.length > 0) {
      return false;
    }
  }

  // Decorator can only have a single child
  if (sourceCategory === 'Decorator') {
    const existingEdgesFromDecorator = existingEdges.filter((e) => e.source === sourceNode.id);
    if (existingEdgesFromDecorator.length > 0) {
      return false;
    }
  }

  return true;
}

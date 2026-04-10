import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

interface BTFlowEdgeData {
  onDelete?: (id: string) => void;
}

const BTFlowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = (data ?? {}) as BTFlowEdgeData;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      <EdgeLabelRenderer>
        <button
          type="button"
          className="bt-edge-delete"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            opacity: selected ? 1 : 0.75,
          }}
          onClick={(event) => {
            event.stopPropagation();
            edgeData.onDelete?.(id);
          }}
          title="Delete edge"
        >
          ×
        </button>
      </EdgeLabelRenderer>
    </>
  );
};

export default BTFlowEdge;
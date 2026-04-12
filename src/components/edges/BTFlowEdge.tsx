import React from 'react';
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

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
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX: sourceX ?? 0,
    sourceY: sourceY ?? 0,
    sourcePosition: sourcePosition ?? 0,
    targetX: targetX ?? 0,
    targetY: targetY ?? 0,
    targetPosition: targetPosition ?? 0,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        className="react-flow__edge bt-flow-edge"
      />
      {/* Delete button for edge */}
      <g transform={`translate(${(sourceX + targetX) / 2}, ${(sourceY + targetY) / 2})`}>
        <circle r={8} fill="#2a2a3e" stroke="#445" strokeWidth={1} />
        <text
          x={0}
          y={4}
          textAnchor="middle"
          fontSize={10}
          fill="#8899bb"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={handleDelete}
          className="bt-edge-delete"
        >
          ×
        </text>
      </g>
    </>
  );
};

export default BTFlowEdge;

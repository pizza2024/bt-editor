import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export interface BTFlowEdgeData {
  onDelete?: (edgeId: string) => void;
  /** Source port name (for type validation display) */
  sourcePort?: string;
  /** Target port name */
  targetPort?: string;
  /** Type mismatch warning message, if any */
  typeWarning?: string;
  /** Whether this connection is invalid (e.g., leaf→any) */
  invalid?: boolean;
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
  const edgeData = data as BTFlowEdgeData | undefined;
  const hasWarning = !!edgeData?.typeWarning;
  const isInvalid = !!edgeData?.invalid;

  // Determine edge styling based on state
  const strokeColor = selected
    ? '#c8e0ff'
    : isInvalid
    ? '#e04040'
    : hasWarning
    ? '#f0a020'
    : '#6888aa';
  const strokeWidth = selected ? 2.5 : isInvalid || hasWarning ? 2.5 : 2;

  // Use Bezier path for smooth, curved edges (was getSmoothStepPath)
  const [edgePath] = getBezierPath({
    sourceX: sourceX ?? 0,
    sourceY: sourceY ?? 0,
    sourcePosition: sourcePosition ?? 0,
    targetX: targetX ?? 0,
    targetY: targetY ?? 0,
    targetPosition: targetPosition ?? 0,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (edgeData?.onDelete) {
      edgeData.onDelete(id);
    }
  };

  // Midpoint for buttons and warning label
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Delete button group is hidden by default; CSS reveals it on hover.
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...style, stroke: strokeColor, strokeWidth }}
        className={`react-flow__edge bt-flow-edge${hasWarning ? ' bt-edge-warning' : ''}${isInvalid ? ' bt-edge-invalid' : ''}`}
      />
      {/* Warning icon + label for type mismatch */}
      {hasWarning && (
        <g transform={`translate(${midX}, ${midY - 14})`}>
          <rect
            x={-32}
            y={-10}
            width={64}
            height={18}
            rx={4}
            fill="rgba(240,160,32,0.15)"
            stroke="#f0a020"
            strokeWidth={1}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={9}
            fill="#f0a020"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            ⚠️ type mismatch
          </text>
        </g>
      )}
      {/* Delete button for edge — revealed on hover. The first transparent path
          extends the hit area to the whole edge stroke so hovering the line
          itself shows the button. */}
      <g
        className="bt-edge-delete-group"
        style={{ cursor: 'pointer' }}
        onClick={handleDelete}
      >
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={14}
          style={{ pointerEvents: 'stroke' }}
        />
        <g transform={`translate(${midX}, ${midY})`}>
          <circle r={9} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
          <path
            d="M -3.5 -3.5 L 3.5 3.5 M 3.5 -3.5 L -3.5 3.5"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            pointerEvents="none"
          />
        </g>
      </g>
    </>
  );
};

export default BTFlowEdge;

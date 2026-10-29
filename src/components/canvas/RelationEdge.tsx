import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { RelationEdgeData } from '../../types/canvas';

const TYPE_ICONS: Record<string, string> = {
  prerequisite: '➔',
  analogy: '≈',
  contrast: '≠',
  derivation: '↳',
  semantic: '∿',
  related: '🔗',
};

export const RelationEdge: React.FC<EdgeProps<any>> = React.memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
  markerEnd,
  markerStart,
}) => {
  const edgeData = data as RelationEdgeData;
  const relationType = edgeData?.relationType || 'related';
  const label = edgeData?.label || relationType;
  const icon = TYPE_ICONS[relationType] || '🔗';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          ...style,
          stroke: 'var(--br)',
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: '5 5',
          strokeOpacity: selected ? 0.95 : 0.65,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            backgroundColor: 'var(--sf2)',
            borderColor: selected ? 'var(--br)' : 'var(--bd)',
            color: 'var(--tx)',
          }}
          className="nodrag nopan flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-metric font-semibold border shadow-md backdrop-blur-md cursor-pointer transition-transform hover:scale-110"
        >
          <span className="text-[var(--br)] font-bold">{icon}</span>
          <span className="truncate max-w-[120px]">{label}</span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

RelationEdge.displayName = 'RelationEdge';

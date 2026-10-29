import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge } from '@xyflow/react';
import { HierarchyEdgeData } from '../../types/canvas';

export const HierarchyEdge: React.FC<EdgeProps<any>> = React.memo(({
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
}) => {
  const edgeData = data as HierarchyEdgeData;
  const childLang = edgeData?.childLang || 'de';

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const strokeColor =
    childLang === 'ar' ? 'var(--ar)' : childLang === 'de' ? 'var(--de)' : 'var(--en)';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={edgeData?.isNew ? 'anim-draw' : ''}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected ? 3.5 : 2,
          strokeOpacity: selected ? 1 : 0.75,
          transition: 'stroke-width 0.2s, stroke-opacity 0.2s',
        }}
      />
    </>
  );
});

HierarchyEdge.displayName = 'HierarchyEdge';

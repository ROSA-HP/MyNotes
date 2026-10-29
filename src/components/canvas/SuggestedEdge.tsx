import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { Check, X } from 'lucide-react';
import { SuggestedEdgeData } from '../../types/canvas';
import { useMapStore } from '../../store/useMapStore';

export const SuggestedEdge: React.FC<EdgeProps<any>> = React.memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}) => {
  const edgeData = data as SuggestedEdgeData;
  const label = edgeData?.label || 'suggested link';

  const acceptSuggestedEdge = useMapStore(s => s.acceptSuggestedEdge);
  const rejectSuggestedEdge = useMapStore(s => s.rejectSuggestedEdge);

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
        style={{
          ...style,
          stroke: 'var(--mu)',
          strokeWidth: 1.5,
          strokeDasharray: '3 4',
          strokeOpacity: 0.45,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            backgroundColor: 'var(--sf2)',
            borderColor: 'var(--bd)',
            color: 'var(--tx)',
          }}
          className="nodrag nopan flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-metric border shadow-md backdrop-blur-md"
        >
          <span className="text-[var(--mu)] truncate max-w-[100px]">{label}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              acceptSuggestedEdge(id);
            }}
            title="Accept link"
            className="w-4 h-4 rounded-full bg-[var(--ar)] text-white grid place-items-center hover:scale-110 transition-transform"
          >
            <Check size={10} strokeWidth={3} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              rejectSuggestedEdge(id);
            }}
            title="Reject link"
            className="w-4 h-4 rounded-full bg-[var(--sf)] text-[var(--mu)] hover:text-[var(--dg)] grid place-items-center hover:scale-110 transition-transform"
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

SuggestedEdge.displayName = 'SuggestedEdge';

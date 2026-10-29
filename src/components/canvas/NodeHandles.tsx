import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface NodeHandlesProps {
  isVisible: boolean;
}

export const NodeHandles: React.FC<NodeHandlesProps> = React.memo(({ isVisible }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Top Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ top: -6 }}
      />

      {/* Right Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ right: -6 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ right: -6 }}
      />

      {/* Bottom Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ bottom: -6 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ bottom: -6 }}
      />

      {/* Left Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-3 !h-3 !bg-[var(--br)] !border-2 !border-[var(--sf)] !rounded-full pointer-events-auto transition-transform hover:!scale-125 hover:!bg-white"
        style={{ left: -6 }}
      />
    </div>
  );
});

NodeHandles.displayName = 'NodeHandles';

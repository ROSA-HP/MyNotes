import React from 'react';
import {
  Plus,
  Edit2,
  Eye,
  Trash2,
  Copy,
  FolderTree,
  Maximize2,
  ArrowLeftRight,
} from 'lucide-react';

export type ContextMenuTarget =
  | { type: 'node'; nodeId: string; x: number; y: number }
  | { type: 'canvas'; x: number; y: number; canvasX: number; canvasY: number }
  | { type: 'edge'; edgeId: string; x: number; y: number };

interface ContextMenuProps {
  target: ContextMenuTarget | null;
  onClose: () => void;
  onAddChild?: (nodeId: string) => void;
  onAddSibling?: (nodeId: string) => void;
  onEditNode?: (nodeId: string) => void;
  onFocusBranch?: (nodeId: string) => void;
  onCollapseBranch?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onAddTopicCanvas?: (pos: { x: number; y: number }) => void;
  onAddSubtopicCanvas?: (pos: { x: number; y: number }) => void;
  onAutoArrange?: () => void;
  onFitView?: () => void;
  onToggleEdgeType?: (edgeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  target,
  onClose,
  onAddChild,
  onAddSibling,
  onEditNode,
  onFocusBranch,
  onCollapseBranch,
  onDuplicateNode,
  onDeleteNode,
  onAddTopicCanvas,
  onAddSubtopicCanvas,
  onAutoArrange,
  onFitView,
  onToggleEdgeType,
  onDeleteEdge,
}) => {
  if (!target) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        left: `${target.x}px`,
        top: `${target.y}px`,
        backgroundColor: 'var(--sf)',
        borderColor: 'var(--bd)',
      }}
      className="fixed z-50 min-w-44 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-0.5 text-xs anim-bl"
    >
      {target.type === 'node' && (
        <>
          <button
            onClick={() => {
              onClose();
              onAddChild?.(target.nodeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Plus size={13} className="text-[var(--br)]" />
            <span>Add Child</span>
            <kbd className="ml-auto text-[9px]">Tab</kbd>
          </button>

          <button
            onClick={() => {
              onClose();
              onAddSibling?.(target.nodeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Plus size={13} className="text-[var(--en)]" />
            <span>Add Sibling</span>
            <kbd className="ml-auto text-[9px]">↵</kbd>
          </button>

          <button
            onClick={() => {
              onClose();
              onEditNode?.(target.nodeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Edit2 size={13} className="text-[var(--ar)]" />
            <span>Edit / Rename</span>
            <kbd className="ml-auto text-[9px]">F2</kbd>
          </button>

          <button
            onClick={() => {
              onClose();
              onFocusBranch?.(target.nodeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Eye size={13} className="text-[var(--de)]" />
            <span>Focus Branch</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onCollapseBranch?.(target.nodeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <FolderTree size={13} className="text-[var(--mu)]" />
            <span>Collapse / Expand</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onDuplicateNode?.(target.nodeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Copy size={13} className="text-[var(--mu)]" />
            <span>Duplicate</span>
            <kbd className="ml-auto text-[9px]">⌘D</kbd>
          </button>

          <div className="h-px bg-[var(--bd)] my-1" />

          <button
            onClick={() => {
              onClose();
              onDeleteNode?.(target.nodeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--dg)] hover:text-white text-[var(--dg)] transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete Star</span>
            <kbd className="ml-auto text-[9px]">Del</kbd>
          </button>
        </>
      )}

      {target.type === 'canvas' && (
        <>
          <button
            onClick={() => {
              onClose();
              onAddTopicCanvas?.({ x: target.canvasX, y: target.canvasY });
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Plus size={13} className="text-[var(--br)]" />
            <span>Add Topic Here</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onAddSubtopicCanvas?.({ x: target.canvasX, y: target.canvasY });
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Plus size={13} className="text-[var(--en)]" />
            <span>Add Subtopic Here</span>
          </button>

          <div className="h-px bg-[var(--bd)] my-1" />

          <button
            onClick={() => {
              onClose();
              onAutoArrange?.();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <FolderTree size={13} className="text-[var(--ar)]" />
            <span>Auto-arrange Layout</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onFitView?.();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <Maximize2 size={13} className="text-[var(--mu)]" />
            <span>Fit View</span>
          </button>
        </>
      )}

      {target.type === 'edge' && (
        <>
          <button
            onClick={() => {
              onClose();
              onToggleEdgeType?.(target.edgeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
          >
            <ArrowLeftRight size={13} className="text-[var(--br)]" />
            <span>Toggle Structure / Relation</span>
          </button>

          <div className="h-px bg-[var(--bd)] my-1" />

          <button
            onClick={() => {
              onClose();
              onDeleteEdge?.(target.edgeId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[var(--dg)] hover:text-white text-[var(--dg)] transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete Link</span>
          </button>
        </>
      )}
    </div>
  );
};

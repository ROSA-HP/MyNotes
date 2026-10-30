import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  GitBranch,
  MoreHorizontal,
  Copy,
  FolderMinus,
  FolderPlus,
  Trash2,
  X,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import { MindLexFlowNode } from '../../types/canvas';

export const BottomNodeBar: React.FC = () => {
  const selectedNodeId = useMapStore(s => s.selectedNodeId);
  const openNodePageId = useMapStore(s => s.openNodePageId);
  const nodes = useMapStore(s => s.nodes);
  const edges = useMapStore(s => s.edges);
  const isConnectingMode = useMapStore(s => s.isConnectingMode);
  const connectingSourceId = useMapStore(s => s.connectingSourceId);

  const openPage = useMapStore(s => s.openPage);
  const addNode = useMapStore(s => s.addNode);
  const addEdge = useMapStore(s => s.addEdge);
  const deleteNodes = useMapStore(s => s.deleteNodes);
  const duplicateSelected = useMapStore(s => s.duplicateSelected);
  const toggleCollapseBranch = useMapStore(s => s.toggleCollapseBranch);
  const startConnecting = useMapStore(s => s.startConnecting);
  const cancelConnecting = useMapStore(s => s.cancelConnecting);

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // If no node selected or if the page panel is already open, do not show bar
  if (!selectedNodeId || openNodePageId) return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const { title, summary, lang, kind, collapsed } = node.data;
  const isArabic = lang === 'ar';
  const langColor = lang === 'ar' ? 'var(--ar)' : lang === 'de' ? 'var(--de)' : 'var(--en)';

  // Check if node has children
  const hasChildren = edges.some(e => e.source === node.id && (e.type === 'hierarchy' || !e.type));

  const handleAddChild = () => {
    const newId = `node_${Date.now()}`;
    const childNode: MindLexFlowNode = {
      id: newId,
      type: 'subtopic',
      position: { x: node.position.x + 340, y: node.position.y + 60 },
      data: {
        id: newId,
        mapId: node.data.mapId,
        title: 'New idea',
        kind: 'concept',
        lang: node.data.lang,
        parentId: node.id,
        depth: (node.data.depth || 0) + 1,
        pinned: true,
      },
    };
    addNode(childNode);
    addEdge({
      id: `e_${node.id}_${newId}`,
      source: node.id,
      target: newId,
      type: 'hierarchy',
      data: { childLang: childNode.data.lang, isNew: true },
    });
  };

  const isCurrentConnecting = isConnectingMode && connectingSourceId === node.id;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300 anim-bl max-w-[95vw]"
      style={{
        backgroundColor: 'var(--gl)',
        borderColor: 'var(--bd)',
        boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.45), 0 0 16px -2px var(--bd)',
      }}
    >
      {/* Node Info Segment */}
      <div className="flex items-center gap-2.5 pr-3 border-r border-[var(--bd)] max-w-[280px] sm:max-w-[360px]">
        {/* Language & Kind Badge */}
        <span
          className="font-metric text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
          style={{
            color: langColor,
            backgroundColor: `color-mix(in srgb, ${langColor} 18%, transparent)`,
            border: `1px solid color-mix(in srgb, ${langColor} 40%, transparent)`,
          }}
        >
          {lang}
        </span>

        {/* Title and summary */}
        <div className="flex flex-col min-w-0">
          <div
            className={`font-bold text-xs sm:text-sm text-[var(--tx)] truncate ${isArabic ? 'font-ar text-right' : ''}`}
            dir={isArabic ? 'rtl' : 'auto'}
          >
            {title || 'Untitled Node'}
          </div>
          <div
            className="text-[11px] text-[var(--mu)] truncate"
            dir="auto"
          >
            {summary && summary.trim() ? summary : 'No details yet'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Open (Primary button) */}
        <button
          onClick={() => openPage(node.id)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
          style={{
            backgroundColor: 'var(--br)',
            boxShadow: '0 0 14px -2px var(--br)',
          }}
          title="Open page (Shortcut: O or Space)"
        >
          <BookOpen size={13} />
          <span>Open</span>
          <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-white/20 font-mono">
            O
          </kbd>
        </button>

        {/* Add Child */}
        <button
          onClick={handleAddChild}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-xs bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--tx)] border border-[var(--bd)] transition-colors"
          title="Add child star (Shortcut: Tab)"
        >
          <Plus size={13} className="text-[var(--en)]" />
          <span className="hidden sm:inline">Add child</span>
        </button>

        {/* Connect Button */}
        {isCurrentConnecting ? (
          <button
            onClick={cancelConnecting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500/20 text-[var(--de)] border border-amber-500/40 animate-pulse"
            title="Click another node to connect, or click to cancel"
          >
            <X size={13} />
            <span>Click target</span>
          </button>
        ) : (
          <button
            onClick={() => startConnecting(node.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-xs bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--tx)] border border-[var(--bd)] transition-colors"
            title="Connect to another star"
          >
            <GitBranch size={13} className="text-[var(--ar)]" />
            <span className="hidden sm:inline">Connect</span>
          </button>
        )}

        {/* More Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--mu)] hover:text-[var(--tx)] border border-[var(--bd)] transition-colors"
            title="More actions"
          >
            <MoreHorizontal size={14} />
          </button>

          {isMoreOpen && (
            <div
              className="absolute right-0 bottom-10 w-44 p-1.5 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] shadow-2xl z-50 flex flex-col gap-1 text-xs anim-bl"
              onClick={() => setIsMoreOpen(false)}
            >
              {/* Duplicate */}
              <button
                onClick={duplicateSelected}
                className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Copy size={13} className="text-[var(--mu)]" />
                  <span>Duplicate</span>
                </span>
                <kbd className="text-[10px] text-[var(--mu)]">⌘D</kbd>
              </button>

              {/* Collapse/Expand */}
              {hasChildren && (
                <button
                  onClick={() => toggleCollapseBranch(node.id)}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {collapsed ? (
                      <FolderPlus size={13} className="text-[var(--de)]" />
                    ) : (
                      <FolderMinus size={13} className="text-[var(--de)]" />
                    )}
                    <span>{collapsed ? 'Expand branch' : 'Collapse branch'}</span>
                  </span>
                </button>
              )}

              <div className="h-[1px] bg-[var(--bd)] my-0.5" />

              {/* Delete */}
              <button
                onClick={() => deleteNodes([node.id])}
                className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={13} />
                  <span>Delete</span>
                </span>
                <kbd className="text-[10px] opacity-70">Del</kbd>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

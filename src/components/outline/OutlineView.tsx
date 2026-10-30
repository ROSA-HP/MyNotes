import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Plus,
  Trash2,
  FolderTree,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import { MindLexFlowNode } from '../../types/canvas';

export const OutlineView: React.FC = () => {
  const nodes = useMapStore(s => s.nodes);
  const edges = useMapStore(s => s.edges);
  const openPage = useMapStore(s => s.openPage);
  const addNode = useMapStore(s => s.addNode);
  const addEdge = useMapStore(s => s.addEdge);
  const deleteNodes = useMapStore(s => s.deleteNodes);
  const updateNodeData = useMapStore(s => s.updateNodeData);
  const changeNodeParent = useMapStore(s => s.changeNodeParent);

  // Collapsed state in outline
  const [collapsedInOutline, setCollapsedInOutline] = useState<Set<string>>(new Set());
  // Dragged node for changing parent
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const toggleCollapse = (id: string) => {
    setCollapsedInOutline(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Find root nodes: nodes without parentId or whose parent is not in the map
  const rootNodes = nodes.filter(
    n => !n.data.parentId || !nodes.some(other => other.id === n.data.parentId)
  );

  // Helper to add child in outline
  const handleAddChild = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const newId = `node_${Date.now()}`;
    const childNode: MindLexFlowNode = {
      id: newId,
      type: 'subtopic',
      position: { x: parent.position.x + 340, y: parent.position.y + 60 },
      data: {
        id: newId,
        mapId: parent.data.mapId,
        title: 'New idea',
        kind: 'concept',
        lang: parent.data.lang,
        parentId: parent.id,
        depth: (parent.data.depth || 0) + 1,
        pinned: true,
      },
    };
    addNode(childNode);
    addEdge({
      id: `e_${parent.id}_${newId}`,
      source: parent.id,
      target: newId,
      type: 'hierarchy',
      data: { childLang: childNode.data.lang, isNew: true },
    });
  };

  // Recursive outline item component
  const renderOutlineTree = (node: MindLexFlowNode, level: number = 0) => {
    const children = nodes.filter(n => n.data.parentId === node.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedInOutline.has(node.id);

    const { title, summary, lang, kind, blocks = [] } = node.data;
    const isArabic = lang === 'ar';
    const langColor = lang === 'ar' ? 'var(--ar)' : lang === 'de' ? 'var(--de)' : 'var(--en)';

    // First block preview
    const firstBlock = blocks[0];
    const previewText =
      summary ||
      (firstBlock?.content
        ? firstBlock.content.slice(0, 80)
        : firstBlock?.vocab
        ? `${firstBlock.vocab.de || ''} = ${firstBlock.vocab.en || ''}`
        : '');

    return (
      <div key={node.id} className="flex flex-col">
        {/* Node Row */}
        <div
          draggable
          onDragStart={() => setDraggedNodeId(node.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedNodeId && draggedNodeId !== node.id) {
              changeNodeParent(draggedNodeId, node.id);
              setDraggedNodeId(null);
            }
          }}
          className="group flex items-center gap-2 py-2 px-3 rounded-2xl hover:bg-[var(--sf)]/70 transition-colors border border-transparent hover:border-[var(--bd)]"
          style={{ paddingLeft: `${Math.max(12, level * 28 + 12)}px` }}
        >
          {/* Reorder drag handle */}
          <span
            className="text-[var(--mu)] opacity-0 group-hover:opacity-100 cursor-grab hover:text-[var(--tx)] transition-opacity"
            title="Drag onto another node to change parent"
          >
            <GripVertical size={13} />
          </span>

          {/* Chevron expand/collapse */}
          {hasChildren ? (
            <button
              onClick={() => toggleCollapse(node.id)}
              className="w-5 h-5 rounded grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] transition-colors"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <span className="w-5 h-5 flex items-center justify-center text-[var(--mu)]/30 text-xs">
              •
            </span>
          )}

          {/* Language Badge */}
          <span
            className="font-metric text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0"
            style={{
              color: langColor,
              backgroundColor: `color-mix(in srgb, ${langColor} 18%, transparent)`,
              border: `1px solid color-mix(in srgb, ${langColor} 35%, transparent)`,
            }}
          >
            {lang}
          </span>

          {/* Title and inline editor */}
          <input
            dir={isArabic ? 'rtl' : 'auto'}
            type="text"
            value={title}
            onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
            className={`flex-1 bg-transparent font-bold text-xs sm:text-sm text-[var(--tx)] outline-none border-b border-transparent focus:border-[var(--br)] ${
              isArabic ? 'font-ar text-right' : ''
            }`}
          />

          {/* Short Block Preview */}
          {previewText && (
            <span
              dir="auto"
              className="hidden md:inline-block max-w-[220px] truncate text-[11px] text-[var(--mu)] font-normal italic"
            >
              {previewText}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Open page */}
            <button
              onClick={() => openPage(node.id)}
              className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--br)] hover:bg-[var(--sf2)] transition-colors"
              title="Open RemNote page"
            >
              <BookOpen size={13} />
            </button>

            {/* Add child */}
            <button
              onClick={() => handleAddChild(node.id)}
              className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--en)] hover:bg-[var(--sf2)] transition-colors"
              title="Add child idea"
            >
              <Plus size={13} />
            </button>

            {/* Change Parent Dropdown */}
            <select
              value={node.data.parentId || ''}
              onChange={(e) => changeNodeParent(node.id, e.target.value ? e.target.value : null)}
              className="bg-[var(--sf)] text-[10px] text-[var(--mu)] rounded px-1 py-0.5 border border-[var(--bd)] outline-none"
              title="Change parent hierarchy"
            >
              <option value="">(Root)</option>
              {nodes
                .filter(n => n.id !== node.id)
                .map(n => (
                  <option key={n.id} value={n.id}>
                    ↳ {n.data.title}
                  </option>
                ))}
            </select>

            {/* Delete */}
            <button
              onClick={() => deleteNodes([node.id])}
              className="p-1.5 rounded-lg text-[var(--mu)] hover:text-red-400 hover:bg-[var(--sf2)] transition-colors"
              title="Delete node"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Render Children Recursively */}
        {!isCollapsed && hasChildren && (
          <div className="flex flex-col border-l border-[var(--bd)]/40 ml-6">
            {children.map(child => renderOutlineTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 top-14 bg-[var(--bg)] text-[var(--tx)] overflow-y-auto px-6 sm:px-12 py-8 flex flex-col gap-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Header summary */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--bd)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--sf2)] border border-[var(--bd)] grid place-items-center text-[var(--br)]">
              <FolderTree size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-[var(--tx)]">
                Outline Document View
              </h2>
              <p className="text-xs text-[var(--mu)]">
                Nested concept tree synchronized in real-time with your constellation map. Drag rows to change parents.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const root = rootNodes[0];
              if (root) handleAddChild(root.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110"
            style={{ backgroundColor: 'var(--br)' }}
          >
            <Plus size={13} />
            <span>Add Star</span>
          </button>
        </div>

        {/* Outline Nodes List */}
        <div className="flex flex-col gap-1 bg-[var(--sf2)]/30 p-4 rounded-3xl border border-[var(--bd)]">
          {rootNodes.map(root => renderOutlineTree(root, 0))}
        </div>
      </div>
    </div>
  );
};

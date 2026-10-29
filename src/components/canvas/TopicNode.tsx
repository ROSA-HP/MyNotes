import React, { useState, useEffect, useRef } from 'react';
import { NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight, Plus, Volume2 } from 'lucide-react';
import { MindLexNodeData } from '../../types/canvas';
import { NodeHandles } from './NodeHandles';
import { useMapStore } from '../../store/useMapStore';
import { speak } from '../../utils/speech';

const KIND_LABELS: Record<string, { en: string; ar: string }> = {
  topic: { en: 'Topic', ar: 'موضوع' },
  concept: { en: 'Concept', ar: 'مفهوم' },
  rule: { en: 'Rule', ar: 'قاعدة' },
  vocab: { en: 'Word', ar: 'كلمة' },
  example: { en: 'Example', ar: 'مثال' },
};

export const TopicNode: React.FC<NodeProps<any>> = React.memo(({ id, data, selected }) => {
  const nodeData = data as MindLexNodeData;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(nodeData.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateNodeData = useMapStore(s => s.updateNodeData);
  const toggleCollapseBranch = useMapStore(s => s.toggleCollapseBranch);
  const addNode = useMapStore(s => s.addNode);
  const addEdge = useMapStore(s => s.addEdge);
  const activeLangs = useMapStore(s => s.activeLangs);
  const focusedBranchIds = useMapStore(s => s.focusedBranchIds);
  const highlightedNodeId = useMapStore(s => s.highlightedNodeId);

  useEffect(() => {
    setTitleDraft(nodeData.title);
  }, [nodeData.title]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isEditing]);

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (titleDraft.trim() && titleDraft !== nodeData.title) {
      updateNodeData(id, { title: titleDraft.trim() });
    } else {
      setTitleDraft(nodeData.title);
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `node_${Date.now()}`;
    const parentPos = { x: 100, y: 100 }; // fallback
    const childNode = {
      id: newId,
      type: 'subtopic',
      position: { x: parentPos.x + 360, y: parentPos.y + 60 },
      data: {
        id: newId,
        mapId: nodeData.mapId,
        title: 'New idea',
        kind: 'concept' as const,
        lang: nodeData.lang,
        parentId: id,
        childIds: [],
        depth: (nodeData.depth || 0) + 1,
        pinned: true,
      },
    };

    addNode(childNode as any);
    addEdge({
      id: `e_${id}_${newId}`,
      source: id,
      target: newId,
      type: 'hierarchy',
      data: { childLang: nodeData.lang, isNew: true },
    });
  };

  const isArabic = nodeData.lang === 'ar';
  const kindText = KIND_LABELS[nodeData.kind]?.[isArabic ? 'ar' : 'en'] || nodeData.kind;

  const isDimmed =
    !activeLangs.has(nodeData.lang) ||
    (focusedBranchIds !== null && !focusedBranchIds.has(id));

  const isHighlighted = highlightedNodeId === id;

  const colorVar =
    nodeData.lang === 'ar' ? 'var(--ar)' : nodeData.lang === 'de' ? 'var(--de)' : 'var(--en)';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{
        width: '360px',
        backgroundColor: 'var(--sf)', // Solid background, NO backdrop-filter!
        borderLeft: `4px solid ${colorVar}`,
        borderColor: `color-mix(in srgb, ${colorVar} 45%, var(--bd))`,
        boxShadow: selected
          ? `0 0 28px -2px color-mix(in srgb, ${colorVar} 60%, transparent)`
          : isHighlighted
          ? '0 0 24px -2px var(--br)'
          : '0 4px 16px -2px rgba(0, 0, 0, 0.45)',
      }}
      className={`relative p-4 rounded-3xl border text-[var(--tx)] transition-all duration-150 select-none l-${nodeData.lang} ${
        selected ? 'ring-2 ring-[var(--br)] ring-offset-2 ring-offset-[var(--bg)]' : ''
      } ${isDimmed ? 'opacity-20' : 'opacity-100'} ${isHighlighted ? 'scale-105 ring-2 ring-[var(--br)]' : ''}`}
    >
      <NodeHandles isVisible={isHovered || !!selected} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {/* Collapse/Expand chevron if has children */}
          {(nodeData.blocksCount || 0) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapseBranch(id);
              }}
              title={nodeData.collapsed ? 'Expand branch' : 'Collapse branch'}
              className="w-5 h-5 rounded-md grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
            >
              {nodeData.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          <span
            lang={isArabic ? 'ar' : 'en'}
            className={`font-semibold uppercase tracking-wider text-[var(--mu)] text-xs ${
              isArabic ? 'font-arabic capitalize text-[13px]' : ''
            }`}
          >
            {kindText}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Collapsed +N chip */}
          {nodeData.collapsed && (nodeData.collapsedChildCount || 0) > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapseBranch(id);
              }}
              className="px-2 py-0.5 rounded-full text-[11px] font-metric font-bold bg-[var(--br)] text-white shadow-sm cursor-pointer hover:brightness-110"
              title="Click to expand branch"
            >
              +{nodeData.collapsedChildCount}
            </span>
          )}

          <span className="bdg font-metric">
            {nodeData.lang.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="my-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            dir={isArabic ? 'rtl' : 'auto'}
            lang={nodeData.lang}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTitleDraft(nodeData.title);
                setIsEditing(false);
              }
            }}
            className="w-full font-extrabold text-lg bg-[var(--sf2)] border border-[var(--br)] rounded-lg px-2 py-0.5 outline-none text-[var(--tx)]"
          />
        ) : (
          <div
            dir={isArabic ? 'rtl' : 'auto'}
            lang={nodeData.lang}
            className={`font-extrabold text-lg text-[var(--tx)] leading-tight flex items-center justify-between gap-2 ${
              isArabic ? 'font-arabic text-xl' : ''
            }`}
          >
            <span className="truncate">{nodeData.title}</span>
            {nodeData.rows && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(nodeData.title, nodeData.lang);
                }}
                className="w-6 h-6 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] bg-[var(--sf2)] transition-colors shrink-0"
                title="Pronounce"
              >
                <Volume2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional One-Line Summary */}
      {nodeData.summary && (
        <p
          dir={isArabic ? 'rtl' : 'auto'}
          lang={nodeData.lang}
          className={`text-xs text-[var(--mu)] mt-1 truncate ${
            isArabic ? 'font-arabic text-[13px]' : ''
          }`}
        >
          {nodeData.summary}
        </p>
      )}

      {/* Neutral Footer Chips (blocks, cards, due) */}
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[var(--bd)] text-[11px] font-metric text-[var(--mu)]">
        <span className="px-2 py-0.5 rounded-md bg-[var(--sf2)]">
          {nodeData.blocksCount || 0} blocks
        </span>
        <span className="px-2 py-0.5 rounded-md bg-[var(--sf2)]">
          {nodeData.cardsCount || 0} cards
        </span>
        <span className="px-2 py-0.5 rounded-md bg-[var(--sf2)] text-[var(--tx)] font-semibold">
          {nodeData.dueCount || 0} due
        </span>
      </div>

      {/* Add Child '+' Button on hover or selection */}
      {(isHovered || selected) && (
        <button
          onClick={handleAddChild}
          title="Add child node"
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[var(--br)] text-white grid place-items-center shadow-lg transition-transform hover:scale-125 z-20"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});

TopicNode.displayName = 'TopicNode';

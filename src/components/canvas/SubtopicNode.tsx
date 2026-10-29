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

export const SubtopicNode: React.FC<NodeProps<any>> = React.memo(({ id, data, selected }) => {
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
    const childNode = {
      id: newId,
      type: 'subtopic',
      position: { x: 400, y: 150 },
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
        width: '280px',
        backgroundColor: 'var(--sf)', // Solid background, NO backdrop-filter!
        borderLeft: `3px solid ${colorVar}`,
        borderColor: `color-mix(in srgb, ${colorVar} 40%, var(--bd))`,
        boxShadow: selected
          ? `0 0 24px -2px color-mix(in srgb, ${colorVar} 55%, transparent)`
          : isHighlighted
          ? '0 0 20px -2px var(--br)'
          : '0 4px 14px -3px rgba(0, 0, 0, 0.4)',
      }}
      className={`relative p-3.5 rounded-2xl border text-[var(--tx)] transition-all duration-150 select-none l-${nodeData.lang} ${
        selected ? 'ring-2 ring-[var(--br)] ring-offset-2 ring-offset-[var(--bg)]' : ''
      } ${isDimmed ? 'opacity-20' : 'opacity-100'} ${isHighlighted ? 'scale-105 ring-2 ring-[var(--br)]' : ''}`}
    >
      <NodeHandles isVisible={isHovered || !!selected} />

      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 mb-2 text-xs">
        <div className="flex items-center gap-1">
          {/* Collapse/Expand chevron if has children */}
          {(nodeData.blocksCount || 0) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapseBranch(id);
              }}
              title={nodeData.collapsed ? 'Expand branch' : 'Collapse branch'}
              className="w-4 h-4 rounded grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
            >
              {nodeData.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          <span
            lang={isArabic ? 'ar' : 'en'}
            className={`font-semibold uppercase tracking-wider text-[var(--mu)] text-[11px] ${
              isArabic ? 'font-arabic capitalize text-[12px]' : ''
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
              className="px-1.5 py-0.2 rounded-full text-[10px] font-metric font-bold bg-[var(--br)] text-white shadow-sm cursor-pointer hover:brightness-110"
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

      {/* Vocab Multi-Row Mode or Standard Title */}
      {nodeData.rows ? (
        <div className="flex flex-col gap-1 my-1">
          {(['de', 'en', 'ar'] as const).map((l) => {
            const val = nodeData.rows?.[l];
            if (!val) return null;
            return (
              <div
                key={l}
                className={`flex items-center gap-1.5 py-0.5 px-1 rounded-md l-${l}`}
              >
                <span className="bdg font-metric shrink-0 text-[10px]">
                  {l.toUpperCase()}
                </span>
                <span
                  dir={l === 'ar' ? 'rtl' : 'auto'}
                  lang={l}
                  className={`flex-1 font-semibold text-[13px] truncate text-[var(--tx)] ${
                    l === 'ar' ? 'arx font-arabic text-[14px]' : ''
                  }`}
                >
                  {val}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(val, l);
                  }}
                  className="w-6 h-6 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--c)] bg-[var(--sf2)] transition-colors shrink-0"
                  title={`Speak ${l.toUpperCase()}`}
                >
                  <Volume2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
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
              className="w-full font-bold text-sm bg-[var(--sf2)] border border-[var(--br)] rounded px-1.5 py-0.5 outline-none text-[var(--tx)]"
            />
          ) : (
            <div
              dir={isArabic ? 'rtl' : 'auto'}
              lang={nodeData.lang}
              className={`font-bold text-sm text-[var(--tx)] leading-snug truncate ${
                isArabic ? 'font-arabic text-base' : ''
              }`}
            >
              {nodeData.title}
            </div>
          )}

          {nodeData.summary && (
            <p
              dir={isArabic ? 'rtl' : 'auto'}
              lang={nodeData.lang}
              className={`text-xs text-[var(--mu)] mt-1 truncate ${
                isArabic ? 'font-arabic text-[12.5px]' : ''
              }`}
            >
              {nodeData.summary}
            </p>
          )}
        </div>
      )}

      {/* Neutral Footer Chips (blocks, cards, due) */}
      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--bd)] text-[10px] font-metric text-[var(--mu)]">
        <span className="px-1.5 py-0.2 rounded bg-[var(--sf2)]">
          {nodeData.blocksCount || 0} blocks
        </span>
        <span className="px-1.5 py-0.2 rounded bg-[var(--sf2)]">
          {nodeData.cardsCount || (nodeData.rows ? 1 : 0)} cards
        </span>
        <span className="px-1.5 py-0.2 rounded bg-[var(--sf2)] text-[var(--tx)] font-medium">
          {nodeData.dueCount || 1} due
        </span>
      </div>

      {/* Add Child '+' Button on hover or selection */}
      {(isHovered || selected) && (
        <button
          onClick={handleAddChild}
          title="Add child node"
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--br)] text-white grid place-items-center shadow-lg transition-transform hover:scale-125 z-20"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});

SubtopicNode.displayName = 'SubtopicNode';

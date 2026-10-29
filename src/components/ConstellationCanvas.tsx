import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Volume2, Edit2, Eye, Trash2, Plus, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { MindNode, Edge, LanguageCode, NodeKind } from '../types';
import { speak } from '../utils/speech';

interface ConstellationCanvasProps {
  nodes: MindNode[];
  edges: Edge[];
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onEditNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onAddChildNode: (parentId: string) => void;
  activeLangs: Set<LanguageCode>;
  focusedBranchIds: Set<string> | null;
  setFocusedBranchIds: (ids: Set<string> | null) => void;
  freshNodeIds: string[];
}

const KIND_LABELS: Record<NodeKind, { en: string; ar: string }> = {
  topic: { en: 'Topic', ar: 'موضوع' },
  rule: { en: 'Rule', ar: 'قاعدة' },
  concept: { en: 'Concept', ar: 'مفهوم' },
  vocab: { en: 'Word', ar: 'كلمة' },
  example: { en: 'Example', ar: 'مثال' },
};

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  nodes,
  edges,
  selectedId,
  onSelectNode,
  onUpdateNodePosition,
  onEditNode,
  onDeleteNode,
  onAddChildNode,
  activeLangs,
  focusedBranchIds,
  setFocusedBranchIds,
  freshNodeIds,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const dragNodeRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; hasMoved: boolean } | null>(null);

  // Compute canvas dimensions based on outermost nodes
  const maxX = Math.max(1600, ...nodes.map(n => n.x + 360));
  const maxY = Math.max(1100, ...nodes.map(n => n.y + 320));

  const selectedNode = nodes.find(n => n.id === selectedId);

  // Focus branch helper
  const handleFocusBranch = (nodeId: string) => {
    const branch = new Set<string>([nodeId]);
    // add all connected children
    const queue = [nodeId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const [src, tgt] of edges) {
        if (src === cur && !branch.has(tgt)) {
          branch.add(tgt);
          queue.push(tgt);
        }
      }
    }
    setFocusedBranchIds(branch);
  };

  // Canvas pan handling
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.mind-node') || target.closest('.node-action-bar') || target.closest('.hud-controls')) {
      return;
    }

    if (containerRef.current) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      };
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning && panStartRef.current && containerRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      try {
        containerRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Node Dragging Handling
  const handleNodePointerDown = (e: React.PointerEvent<HTMLDivElement>, node: MindNode) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // let buttons click normally

    e.stopPropagation();
    onSelectNode(node.id);

    dragNodeRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
      hasMoved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragNodeRef.current) return;
    const { id, startX, startY, origX, origY } = dragNodeRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.hypot(dx, dy) > 3) {
      dragNodeRef.current.hasMoved = true;
    }

    const newX = Math.max(20, Math.round(origX + dx / zoom));
    const newY = Math.max(20, Math.round(origY + dy / zoom));
    onUpdateNodePosition(id, newX, newY);
  };

  const handleNodePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragNodeRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      dragNodeRef.current = null;
    }
  };

  // Fit View
  const handleFitView = useCallback(() => {
    setZoom(1);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerCancel={handleCanvasPointerUp}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.id === 'canvas-wrapper' || target.id === 'canvas-container') {
          onSelectNode(null);
          setFocusedBranchIds(null);
        }
      }}
      id="canvas-container"
      className={`absolute inset-0 top-14 overflow-auto canvas-bg select-none transition-cursor ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      <div
        id="canvas-wrapper"
        style={{
          width: `${maxX}px`,
          height: `${maxY}px`,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="relative"
      >
        {/* SVG Connector Lines */}
        <svg
          width={maxX}
          height={maxY}
          className="absolute inset-0 pointer-events-none z-0"
        >
          <defs>
            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {edges.map(([sourceId, targetId]) => {
            const source = nodes.find(n => n.id === sourceId);
            const target = nodes.find(n => n.id === targetId);
            if (!source || !target) return null;

            const isRight = source.x + 140 <= target.x;
            const x1 = isRight ? source.x + 280 : source.x;
            const x2 = isRight ? target.x : target.x + 280;
            const y1 = source.y + 70;
            const y2 = target.y + 70;
            const curvature = isRight ? 70 : -70;

            const isFresh = freshNodeIds.includes(targetId);
            const isHighlighted = selectedId === sourceId || selectedId === targetId;

            // Language color for stroke
            const strokeColor =
              target.lang === 'ar'
                ? 'var(--ar)'
                : target.lang === 'de'
                ? 'var(--de)'
                : 'var(--en)';

            return (
              <path
                key={`${sourceId}->${targetId}`}
                d={`M ${x1} ${y1} C ${x1 + curvature} ${y1}, ${x2 - curvature} ${y2}, ${x2} ${y2}`}
                pathLength="1"
                fill="none"
                stroke={strokeColor}
                strokeWidth={isHighlighted ? 3 : 2}
                strokeOpacity={isHighlighted ? 0.95 : 0.65}
                filter={isHighlighted ? 'url(#line-glow)' : undefined}
                className={isFresh ? 'anim-draw' : undefined}
                style={{
                  transition: 'stroke-width 0.2s, stroke-opacity 0.2s',
                }}
              />
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isSelected = selectedId === node.id;
          const isFresh = freshNodeIds.includes(node.id);
          const isLangDimmed = !activeLangs.has(node.lang);
          const isBranchDimmed = focusedBranchIds !== null && !focusedBranchIds.has(node.id);
          const isDimmed = isLangDimmed || isBranchDimmed;

          const kindTitle = KIND_LABELS[node.kind]?.[node.lang === 'ar' ? 'ar' : 'en'] || node.kind;

          return (
            <div
              key={node.id}
              data-id={node.id}
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onPointerMove={handleNodePointerMove}
              onPointerUp={handleNodePointerUp}
              onPointerCancel={handleNodePointerUp}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onEditNode(node.id);
              }}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '280px',
                backgroundColor: 'var(--nd)',
                borderLeftWidth: '3px',
                borderColor: `color-mix(in srgb, var(--${node.lang === 'ar' ? 'ar' : node.lang === 'de' ? 'de' : 'en'}) 40%, transparent)`,
                borderLeftColor: `var(--${node.lang === 'ar' ? 'ar' : node.lang === 'de' ? 'de' : 'en'})`,
                boxShadow: isSelected
                  ? `0 0 24px -2px color-mix(in srgb, var(--${node.lang === 'ar' ? 'ar' : node.lang === 'de' ? 'de' : 'en'}) 60%, transparent)`
                  : '0 4px 14px -3px rgba(0, 0, 0, 0.4)',
              }}
              className={`mind-node absolute p-3.5 rounded-2xl border cursor-grab active:cursor-grabbing transition-all duration-200 z-10 l-${node.lang} ${
                isSelected ? 'ring-2 ring-[var(--br)] ring-offset-2 ring-offset-[var(--bg)] scale-[1.01]' : 'hover:-translate-y-0.5'
              } ${isDimmed ? 'opacity-20 pointer-events-none' : 'opacity-100'} ${
                isFresh ? 'anim-pop' : ''
              }`}
            >
              {/* Node Header */}
              <div className="flex items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--mu)]">
                <span
                  lang={node.lang === 'ar' ? 'ar' : 'en'}
                  className={`flex items-center gap-1.5 ${node.lang === 'ar' ? 'text-xs capitalize font-arabic' : 'text-[11px]'}`}
                >
                  {kindTitle}
                  {isFresh && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--br)] text-white anim-tag font-metric">
                      NEW
                    </span>
                  )}
                </span>
                <span className="bdg font-metric">
                  {node.lang.toUpperCase()}
                </span>
              </div>

              {/* Node Body */}
              {node.rows ? (
                /* Vocab Trilingual Rows */
                <div className="flex flex-col gap-1 my-1">
                  {(['de', 'en', 'ar'] as LanguageCode[]).map((lang) => {
                    const val = node.rows?.[lang];
                    if (!val) return null;
                    return (
                      <div
                        key={lang}
                        className={`flex items-center gap-2 py-1 px-1 rounded-lg transition-colors l-${lang}`}
                      >
                        <span className="bdg font-metric shrink-0">
                          {lang.toUpperCase()}
                        </span>
                        <span
                          dir={lang === 'ar' ? 'rtl' : 'auto'}
                          lang={lang}
                          className={`flex-1 font-semibold text-[13.5px] truncate text-[var(--tx)] ${
                            lang === 'ar' ? 'arx font-arabic text-[14.5px]' : ''
                          }`}
                        >
                          {val}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(val, lang);
                          }}
                          aria-label={`Listen to ${val}`}
                          title={`Listen (${lang.toUpperCase()})`}
                          className="w-7 h-7 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--c)] bg-[var(--sf2)] hover:bg-[var(--sf)] transition-all shrink-0"
                        >
                          <Volume2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Label & Description */
                <div>
                  <div
                    dir={node.lang === 'ar' ? 'rtl' : 'auto'}
                    lang={node.lang}
                    className={`font-bold text-[14.5px] text-[var(--tx)] leading-snug ${
                      node.lang === 'ar' ? 'arx font-arabic text-[16px]' : ''
                    }`}
                  >
                    {node.label}
                  </div>
                  {node.desc && (
                    <div
                      dir={node.lang === 'ar' ? 'rtl' : 'auto'}
                      lang={node.lang}
                      className={`text-xs text-[var(--mu)] mt-1 line-clamp-3 leading-relaxed ${
                        node.lang === 'ar' ? 'font-arabic text-[13px]' : ''
                      }`}
                    >
                      {node.desc}
                    </div>
                  )}
                </div>
              )}

              {/* Footer Badges */}
              {node.foot && node.foot.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-[var(--bd)]">
                  {node.foot.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-metric text-[var(--mu)] px-2 py-0.5 rounded-md bg-[var(--sf2)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Node Toolbar (#tb) */}
        {selectedNode && (
          <div
            className="node-action-bar absolute z-20 flex items-center gap-1 p-1 rounded-full border shadow-xl backdrop-blur-md anim-bl"
            style={{
              left: `${selectedNode.x + 140}px`,
              top: `${selectedNode.y - 48}px`,
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--sf2)',
              borderColor: 'var(--bd)',
            }}
          >
            <button
              onClick={() => onEditNode(selectedNode.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--tx)] hover:bg-[var(--br)] hover:text-white transition-colors"
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                const textToSpeak = selectedNode.rows
                  ? selectedNode.rows[selectedNode.lang] || selectedNode.rows.de || selectedNode.rows.en || ''
                  : selectedNode.label || '';
                speak(textToSpeak, selectedNode.lang);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--tx)] hover:bg-[var(--br)] hover:text-white transition-colors"
            >
              <Volume2 size={12} />
              <span>Speak</span>
            </button>

            <button
              onClick={() => handleFocusBranch(selectedNode.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--tx)] hover:bg-[var(--br)] hover:text-white transition-colors"
            >
              <Eye size={12} />
              <span>Focus</span>
            </button>

            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--dg)] hover:bg-[var(--dg)] hover:text-white transition-colors"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Quick Add Child Node Pin (#pl) */}
        {selectedNode && (
          <button
            onClick={() => onAddChildNode(selectedNode.id)}
            title="Add connected star node"
            aria-label="Add child node"
            className="absolute z-20 w-7 h-7 rounded-full text-white grid place-items-center shadow-lg transition-transform hover:scale-125 anim-bl"
            style={{
              left: `${selectedNode.x + 280 - 14}px`,
              top: `${selectedNode.y + 60}px`,
              backgroundColor: 'var(--br)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Floating Canvas Navigation HUD Controls */}
      <div className="hud-controls fixed left-4 bottom-4 flex items-center gap-1 p-1 rounded-2xl border shadow-lg backdrop-blur-md z-20"
        style={{
          backgroundColor: 'var(--sf)',
          borderColor: 'var(--bd)',
        }}
      >
        <button
          onClick={handleFitView}
          title="Fit View"
          aria-label="Fit View"
          className="w-8 h-8 rounded-xl grid place-items-center text-xs font-bold text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
        >
          <Maximize2 size={14} />
        </button>
        <button
          onClick={() => setZoom(z => Math.min(1.4, +(z + 0.1).toFixed(1)))}
          title="Zoom In"
          aria-label="Zoom In"
          className="w-8 h-8 rounded-xl grid place-items-center text-xs font-bold text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.6, +(z - 0.1).toFixed(1)))}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="w-8 h-8 rounded-xl grid place-items-center text-xs font-bold text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-[11px] font-metric text-[var(--mu)] px-2">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Interactive Helper Hint */}
      <div className="hidden sm:block fixed left-40 bottom-6 text-xs text-[var(--mu)] pointer-events-none z-20 select-none">
        Drag stars to arrange · drag background to pan · double-click to edit · press <b>⌘K</b> to search
      </div>
    </div>
  );
};

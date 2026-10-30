import React, { useState, useMemo } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Link as LinkIcon,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Zap,
  Plus,
  MessageSquare,
  FileQuestion,
  HelpCircle,
  FileText,
  Volume2,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import { BlockEditor } from './BlockEditor';
import { Block, LanguageCode, NodeKind } from '../../../shared';
import { RelationType } from '../../types/canvas';

export const NodePagePanel: React.FC = () => {
  const openNodePageId = useMapStore(s => s.openNodePageId);
  const isPageExpanded = useMapStore(s => s.isPageExpanded);
  const map = useMapStore(s => s.map);
  const nodes = useMapStore(s => s.nodes);
  const edges = useMapStore(s => s.edges);

  const closePage = useMapStore(s => s.closePage);
  const togglePageExpanded = useMapStore(s => s.togglePageExpanded);
  const openPage = useMapStore(s => s.openPage);
  const updateNodeData = useMapStore(s => s.updateNodeData);
  const updateNodeBlocks = useMapStore(s => s.updateNodeBlocks);
  const addEdge = useMapStore(s => s.addEdge);

  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState<RelationType>('related');
  const [relLabel, setRelLabel] = useState('related');

  // Active node lookup
  const node = useMemo(
    () => (openNodePageId ? nodes.find(n => n.id === openNodePageId) : null),
    [nodes, openNodePageId]
  );

  if (!openNodePageId || !node) return null;

  const { title, summary, lang, kind, blocks = [] } = node.data;
  const isArabic = lang === 'ar';
  const langColor = lang === 'ar' ? 'var(--ar)' : lang === 'de' ? 'var(--de)' : 'var(--en)';

  // 1. Breadcrumbs calculation: climb up parentId chain
  const breadcrumbs: { id: string; title: string }[] = [];
  let currParentId = node.data.parentId;
  while (currParentId) {
    const pNode = nodes.find(n => n.id === currParentId);
    if (!pNode) break;
    breadcrumbs.unshift({ id: pNode.id, title: pNode.data.title || 'Star' });
    currParentId = pNode.data.parentId;
  }

  // 2. Connections calculation
  // Parents (via hierarchy edges or parentId)
  const parents = nodes.filter(
    n => n.id === node.data.parentId || edges.some(e => e.target === node.id && e.source === n.id && (e.type === 'hierarchy' || !e.type))
  );

  // Children
  const children = nodes.filter(
    n => n.data.parentId === node.id || edges.some(e => e.source === node.id && e.target === n.id && (e.type === 'hierarchy' || !e.type))
  );

  // Relations (outgoing & incoming relation edges)
  const outgoingRelations = edges
    .filter(e => e.source === node.id && e.type === 'relation')
    .map(e => ({
      edge: e,
      target: nodes.find(n => n.id === e.target),
      data: e.data as any,
    }));

  const incomingRelations = edges
    .filter(e => e.target === node.id && e.type === 'relation')
    .map(e => ({
      edge: e,
      source: nodes.find(n => n.id === e.source),
      data: e.data as any,
    }));

  // Backlinks: other nodes whose blocks mention [[node.title]]
  const backlinkNodes = nodes.filter(n => {
    if (n.id === node.id) return false;
    const titleToken = `[[${title}]]`;
    const inBlocks = (n.data.blocks || []).some(b => {
      const c = b.content || '';
      const s = b.example?.sentence || '';
      const t = b.example?.translation || '';
      return c.includes(titleToken) || s.includes(titleToken) || t.includes(titleToken);
    });
    const inContent = (n.data.content || '').includes(titleToken);
    return inBlocks || inContent;
  });

  // Cards summary
  const cardBlocks = blocks.filter(b => b.isCard);

  // AI Tool Actions
  const handleRunAiTool = async (action: 'explain' | 'examples' | 'drill' | 'summarize') => {
    if (!map) return;
    setIsAiLoading(action);

    try {
      if (action === 'summarize') {
        // Summarize blocks into a clean 1-line summary
        const textParts = blocks.map(b => b.content || b.example?.sentence || b.vocab?.de || '').filter(Boolean);
        const combined = textParts.join('; ');
        let conciseSummary = combined.slice(0, 140);
        if (conciseSummary.length === 140) conciseSummary += '...';
        if (!conciseSummary) conciseSummary = `Essential core rules and vocabulary for ${title}.`;

        updateNodeData(node.id, { summary: conciseSummary });
        setIsAiLoading(null);
        return;
      }

      // Call server node tools endpoint
      const res = await fetch(`/api/maps/${map.id}/nodes/${node.id}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetLang: 'en' }),
      });

      if (!res.ok) throw new Error('AI Tool call failed');
      const data = await res.json();

      const newSuggestedBlocks: Block[] = [];

      if (action === 'explain') {
        newSuggestedBlocks.push({
          id: `blk_ai_exp_${Date.now()}`,
          type: 'text',
          content: data.resultMarkdown || `Pedagogical breakdown for ${title}`,
          aiSuggested: true,
        });
      } else if (action === 'examples') {
        newSuggestedBlocks.push(
          {
            id: `blk_ai_ex1_${Date.now()}`,
            type: 'example',
            content: '',
            example: {
              sentence: lang === 'ar' ? `هذا مثال واضح على ${title}.` : `Hier ist ein klares Beispiel für ${title}.`,
              translation: `This is a clear usage example of ${title}.`,
            },
            aiSuggested: true,
          },
          {
            id: `blk_ai_ex2_${Date.now()}`,
            type: 'example',
            content: '',
            example: {
              sentence: lang === 'ar' ? `يتغير المعنى عند استخدام ${title} مع حرف الجر.` : `Die Bedeutung ändert sich mit ${title}.`,
              translation: `The meaning transforms when used in this context.`,
            },
            aiSuggested: true,
          }
        );
      } else if (action === 'drill') {
        newSuggestedBlocks.push(
          {
            id: `blk_ai_q1_${Date.now()}`,
            type: 'question',
            content: '',
            question: {
              front: `What is the primary function of ${title}?`,
              back: `Refer to core morphological and syntactic rules in your map notes.`,
            },
            isCard: true,
            box: 1,
            aiSuggested: true,
          },
          {
            id: `blk_ai_cloze_${Date.now()}`,
            type: 'cloze',
            content: `In standard grammar, ==${title}== governs the structure of the clause.`,
            isCard: true,
            box: 1,
            aiSuggested: true,
          }
        );
      }

      updateNodeBlocks(node.id, [...blocks, ...newSuggestedBlocks]);
    } catch (err) {
      console.warn('AI tool error:', err);
    } finally {
      setIsAiLoading(null);
    }
  };

  // Create relation edge from picker
  const handleCreateRelation = () => {
    if (!relTargetId || relTargetId === node.id) return;
    addEdge({
      id: `rel_${node.id}_${relTargetId}_${Date.now()}`,
      source: node.id,
      target: relTargetId,
      type: 'relation',
      data: {
        relationType: relType,
        label: relLabel || relType,
        direction: 'forward',
      },
    });
    setShowAddRelation(false);
    setRelTargetId('');
  };

  return (
    <div
      className={`fixed z-40 flex flex-col bg-[var(--sf)] border-l border-[var(--bd)] shadow-2xl transition-all duration-300 ease-out ${
        isPageExpanded
          ? 'inset-0 top-0 w-full'
          : 'top-14 right-0 bottom-0 w-[560px] max-md:w-full'
      }`}
      style={{
        boxShadow: '-12px 0 36px -4px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--bd)] bg-[var(--sf2)]/40 shrink-0">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs text-[var(--mu)] min-w-0 pr-3">
          <span
            onClick={() => closePage()}
            className="hover:text-[var(--tx)] cursor-pointer truncate shrink-0"
          >
            {map?.title || 'Map'}
          </span>
          {breadcrumbs.map(bc => (
            <React.Fragment key={bc.id}>
              <ChevronRight size={12} className="shrink-0 text-[var(--mu)]/60" />
              <button
                onClick={() => openPage(bc.id)}
                className="hover:text-[var(--tx)] font-semibold truncate shrink-0"
              >
                {bc.title}
              </button>
            </React.Fragment>
          ))}
          <ChevronRight size={12} className="shrink-0 text-[var(--mu)]/60" />
          <span className="font-bold text-[var(--tx)] truncate shrink-0">
            {title || 'Current'}
          </span>
        </div>

        {/* Action Controls: Expand/Contract + Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={togglePageExpanded}
            className="w-8 h-8 rounded-xl grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
            title={isPageExpanded ? 'Contract to panel' : 'Expand full page'}
          >
            {isPageExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={closePage}
            className="w-8 h-8 rounded-xl grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
            title="Close page (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        {/* Title & Metadata Segment */}
        <div className="flex flex-col gap-2">
          {/* Language & Kind badge */}
          <div className="flex items-center gap-2">
            {/* Language Picker */}
            <div className="flex rounded-lg overflow-hidden border border-[var(--bd)] bg-[var(--sf2)] text-[10px] font-metric font-bold">
              {(['en', 'de', 'ar'] as LanguageCode[]).map(l => (
                <button
                  key={l}
                  onClick={() => updateNodeData(node.id, { lang: l })}
                  className={`px-2 py-0.5 uppercase transition-colors ${
                    lang === l
                      ? 'bg-[var(--br)] text-white'
                      : 'text-[var(--mu)] hover:text-[var(--tx)]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Kind badge */}
            <span className="font-metric text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--sf2)] text-[var(--mu)] uppercase border border-[var(--bd)]">
              {kind}
            </span>
          </div>

          {/* Title Input */}
          <input
            dir={isArabic ? 'rtl' : 'auto'}
            type="text"
            value={title}
            onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
            placeholder="Node Title..."
            className={`w-full bg-transparent font-extrabold text-2xl sm:text-3xl text-[var(--tx)] outline-none placeholder:text-[var(--mu)]/40 ${
              isArabic ? 'font-ar text-right' : ''
            }`}
          />

          {/* Short Summary (Syncs to node chip on canvas) */}
          <div className="relative">
            <input
              dir="auto"
              type="text"
              value={summary || ''}
              onChange={(e) => updateNodeData(node.id, { summary: e.target.value })}
              placeholder="Add a one-line summary (shown on canvas star)..."
              className="w-full bg-[var(--sf2)]/60 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] text-[var(--tx)] outline-none border border-[var(--bd)] placeholder:text-[var(--mu)]/50 focus:border-[var(--br)]"
            />
          </div>
        </div>

        {/* AI Tools Section */}
        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[var(--sf2)]/30 border border-[var(--bd)]">
          <div className="flex items-center justify-between text-[11px] font-metric font-bold text-[var(--mu)]">
            <span className="flex items-center gap-1.5 text-[var(--tx)]">
              <Sparkles size={13} className="text-[var(--br)]" />
              <span>AI Linguistic Tools</span>
            </span>
            <span>Gemini 2.5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleRunAiTool('explain')}
              disabled={!!isAiLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[var(--sf)] hover:bg-[var(--sf2)] text-[var(--tx)] border border-[var(--bd)] transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <MessageSquare size={13} className="text-[var(--en)]" />
              <span>{isAiLoading === 'explain' ? 'Generating...' : 'Explain'}</span>
            </button>

            <button
              onClick={() => handleRunAiTool('examples')}
              disabled={!!isAiLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[var(--sf)] hover:bg-[var(--sf2)] text-[var(--tx)] border border-[var(--bd)] transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <FileText size={13} className="text-[var(--de)]" />
              <span>{isAiLoading === 'examples' ? 'Generating...' : 'Add examples'}</span>
            </button>

            <button
              onClick={() => handleRunAiTool('drill')}
              disabled={!!isAiLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[var(--sf)] hover:bg-[var(--sf2)] text-[var(--tx)] border border-[var(--bd)] transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Zap size={13} className="text-amber-400" />
              <span>{isAiLoading === 'drill' ? 'Generating...' : 'Make questions'}</span>
            </button>

            <button
              onClick={() => handleRunAiTool('summarize')}
              disabled={!!isAiLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[var(--sf)] hover:bg-[var(--sf2)] text-[var(--tx)] border border-[var(--bd)] transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <FileQuestion size={13} className="text-[var(--ar)]" />
              <span>Summarize</span>
            </button>
          </div>
        </div>

        {/* RemNote Style Block Editor */}
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-metric font-bold text-[var(--mu)] uppercase tracking-wider">
            Notes & Content
          </div>
          <BlockEditor
            nodeId={node.id}
            nodeLang={lang}
            blocks={blocks}
            onChange={(newBlocks) => updateNodeBlocks(node.id, newBlocks)}
          />
        </div>

        {/* Connections Section */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--bd)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-metric font-bold text-[var(--mu)] uppercase tracking-wider">
              Connections & Graph Links
            </span>
            <button
              onClick={() => setShowAddRelation(!showAddRelation)}
              className="flex items-center gap-1 text-xs text-[var(--br)] hover:underline font-semibold"
            >
              <Plus size={12} />
              <span>Add relation</span>
            </button>
          </div>

          {/* Add Relation Inline Picker */}
          {showAddRelation && (
            <div className="p-3 rounded-2xl bg-[var(--sf2)] border border-[var(--bd)] flex flex-col gap-2.5 anim-bl text-xs">
              <div className="font-bold text-[var(--tx)]">Link to another star:</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={relTargetId}
                  onChange={(e) => setRelTargetId(e.target.value)}
                  className="flex-1 bg-[var(--sf)] text-[var(--tx)] px-2.5 py-1.5 rounded-xl border border-[var(--bd)] outline-none"
                >
                  <option value="">Select target node...</option>
                  {nodes
                    .filter(n => n.id !== node.id)
                    .map(n => (
                      <option key={n.id} value={n.id}>
                        {n.data.title} ({n.data.lang})
                      </option>
                    ))}
                </select>

                <select
                  value={relType}
                  onChange={(e) => {
                    setRelType(e.target.value as RelationType);
                    setRelLabel(e.target.value);
                  }}
                  className="bg-[var(--sf)] text-[var(--tx)] px-2.5 py-1.5 rounded-xl border border-[var(--bd)] outline-none"
                >
                  <option value="related">Related</option>
                  <option value="prerequisite">Prerequisite</option>
                  <option value="analogy">Analogy</option>
                  <option value="contrast">Contrast</option>
                  <option value="derivation">Derivation</option>
                  <option value="semantic">Semantic</option>
                </select>

                <button
                  onClick={handleCreateRelation}
                  disabled={!relTargetId}
                  className="px-3 py-1.5 rounded-xl bg-[var(--br)] text-white font-bold hover:brightness-110 disabled:opacity-40"
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          {/* Parents Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[var(--mu)] font-semibold w-16">Parent:</span>
            {parents.length === 0 ? (
              <span className="text-[var(--mu)] italic">Root node (no parent)</span>
            ) : (
              parents.map(p => (
                <button
                  key={p.id}
                  onClick={() => openPage(p.id)}
                  className="px-2.5 py-1 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf)] border border-[var(--bd)] text-[var(--tx)] font-semibold transition-colors"
                >
                  {p.data.title}
                </button>
              ))
            )}
          </div>

          {/* Children Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[var(--mu)] font-semibold w-16">Children:</span>
            {children.length === 0 ? (
              <span className="text-[var(--mu)] italic">No child stars yet</span>
            ) : (
              children.map(c => (
                <button
                  key={c.id}
                  onClick={() => openPage(c.id)}
                  className="px-2.5 py-1 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf)] border border-[var(--bd)] text-[var(--tx)] font-semibold transition-colors"
                >
                  {c.data.title}
                </button>
              ))
            )}
          </div>

          {/* Outgoing & Incoming Relations */}
          {(outgoingRelations.length > 0 || incomingRelations.length > 0) && (
            <div className="flex flex-col gap-1.5 text-xs pt-1">
              <span className="text-[var(--mu)] font-semibold">Cross Relations:</span>
              <div className="flex flex-wrap gap-2">
                {outgoingRelations.map(({ edge, target, data }) => (
                  <button
                    key={edge.id}
                    onClick={() => target && openPage(target.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[var(--tx)] hover:bg-purple-500/20 transition-colors"
                  >
                    <span className="text-[10px] font-metric text-purple-300 font-bold uppercase">
                      {data?.label || data?.relationType || 'related'} →
                    </span>
                    <span className="font-semibold">{target?.data?.title || 'Unknown'}</span>
                  </button>
                ))}
                {incomingRelations.map(({ edge, source, data }) => (
                  <button
                    key={edge.id}
                    onClick={() => source && openPage(source.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[var(--tx)] hover:bg-blue-500/20 transition-colors"
                  >
                    <span className="text-[10px] font-metric text-blue-300 font-bold uppercase">
                      ← {data?.label || data?.relationType || 'related'}
                    </span>
                    <span className="font-semibold">{source?.data?.title || 'Unknown'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Backlinks */}
          {backlinkNodes.length > 0 && (
            <div className="flex flex-col gap-1.5 text-xs pt-1">
              <span className="text-[var(--mu)] font-semibold">Backlinks (referenced by):</span>
              <div className="flex flex-wrap gap-2">
                {backlinkNodes.map(bn => (
                  <button
                    key={bn.id}
                    onClick={() => openPage(bn.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--ar)] hover:bg-emerald-500/20 font-semibold transition-colors"
                  >
                    <LinkIcon size={11} />
                    <span>{bn.data.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cards Section */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[var(--bd)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-metric font-bold text-[var(--mu)] uppercase tracking-wider">
              Flashcard Review ({cardBlocks.length})
            </span>
            <span className="font-metric text-[11px] text-amber-400 font-bold">
              Leitner Box 1
            </span>
          </div>
          {cardBlocks.length === 0 ? (
            <p className="text-xs text-[var(--mu)] italic">
              Toggle the lightning bolt (⚡) on vocab, question, cloze, or formula blocks to turn them into active recall flashcards.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cardBlocks.map(cb => (
                <div
                  key={cb.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-xs"
                >
                  <span className="truncate font-semibold text-[var(--tx)]">
                    {cb.type === 'vocab'
                      ? `${cb.vocab?.de || 'Word'} (${cb.vocab?.en || ''})`
                      : cb.type === 'question'
                      ? cb.question?.front
                      : cb.content}
                  </span>
                  <span className="font-metric text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold uppercase shrink-0">
                    Box 1 · Ready
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

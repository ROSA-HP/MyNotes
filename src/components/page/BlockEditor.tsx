import React, { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  Trash2,
  Volume2,
  Zap,
  Check,
  X,
  Plus,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import katex from 'katex';
import { Block, BlockType, LanguageCode } from '../../../shared';
import { speakText } from '../../utils/speech';
import { useMapStore } from '../../store/useMapStore';

interface BlockEditorProps {
  nodeId: string;
  nodeLang: LanguageCode;
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  nodeId,
  nodeLang,
  blocks,
  onChange,
}) => {
  const storeNodes = useMapStore(s => s.nodes);
  const addEdge = useMapStore(s => s.addEdge);

  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  const [activeNodePicker, setActiveNodePicker] = useState<{
    blockId: string;
    field?: string;
    search: string;
  } | null>(null);

  // Drag reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Helper to update a single block
  const updateBlock = (id: string, patch: Partial<Block>) => {
    const updated = blocks.map(b => (b.id === id ? { ...b, ...patch } : b));
    onChange(updated);
  };

  // Helper to remove a block
  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  // Helper to insert a block
  const insertBlock = (type: BlockType, afterIndex?: number) => {
    const newBlock: Block = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      content: '',
      isCard: ['vocab', 'question', 'cloze'].includes(type),
      box: ['vocab', 'question', 'cloze'].includes(type) ? 1 : undefined,
    };

    if (type === 'vocab') {
      newBlock.vocab = { de: '', en: '', ar: '' };
    } else if (type === 'example') {
      newBlock.example = { sentence: '', translation: '' };
    } else if (type === 'formula') {
      newBlock.formula = {
        latex: 'E = mc^2',
        variables: [{ name: 'E', desc: 'Energy' }, { name: 'm', desc: 'Mass' }, { name: 'c', desc: 'Speed of light' }],
        isVerified: false,
      };
      newBlock.content = 'E = mc^2';
    } else if (type === 'question') {
      newBlock.question = { front: '', back: '' };
    } else if (type === 'cloze') {
      newBlock.content = 'Die Sonne geht im ==Osten== auf.';
    }

    if (typeof afterIndex === 'number' && afterIndex >= 0) {
      const copy = [...blocks];
      copy.splice(afterIndex + 1, 0, newBlock);
      onChange(copy);
    } else {
      onChange([...blocks, newBlock]);
    }

    setActiveSlashBlockId(null);
  };

  // Accept/Reject AI-suggested blocks
  const acceptBlock = (id: string) => {
    updateBlock(id, { aiSuggested: false });
  };

  const acceptAllSuggested = () => {
    onChange(blocks.map(b => (b.aiSuggested ? { ...b, aiSuggested: false } : b)));
  };

  const hasAiSuggested = blocks.some(b => b.aiSuggested);

  // Drag and drop handlers
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIndex(targetIdx);
    onChange(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle typing [[ for node picker
  const handleTextChange = (
    blockId: string,
    val: string,
    field?: string
  ) => {
    if (val.endsWith('[[')) {
      setActiveNodePicker({ blockId, field, search: '' });
    } else if (activeNodePicker && activeNodePicker.blockId === blockId) {
      const match = val.match(/\[\[([^\]]*)$/);
      if (match) {
        setActiveNodePicker({ blockId, field, search: match[1] });
      } else {
        setActiveNodePicker(null);
      }
    }

    if (field === 'sentence') {
      const block = blocks.find(b => b.id === blockId);
      updateBlock(blockId, {
        example: { sentence: val, translation: block?.example?.translation || '' },
      });
    } else if (field === 'translation') {
      const block = blocks.find(b => b.id === blockId);
      updateBlock(blockId, {
        example: { sentence: block?.example?.sentence || '', translation: val },
      });
    } else if (field === 'front') {
      const block = blocks.find(b => b.id === blockId);
      updateBlock(blockId, {
        question: { front: val, back: block?.question?.back || '' },
      });
    } else if (field === 'back') {
      const block = blocks.find(b => b.id === blockId);
      updateBlock(blockId, {
        question: { front: block?.question?.front || '', back: val },
      });
    } else {
      updateBlock(blockId, { content: val });
    }
  };

  // Node picker selection handler
  const handleSelectPickerNode = (pickedNode: { id: string; title: string }) => {
    if (!activeNodePicker) return;
    const { blockId, field } = activeNodePicker;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const targetTitle = pickedNode.title;
    const replacement = `[[${targetTitle}]]`;

    if (field === 'sentence' && block.example) {
      const newSentence = block.example.sentence.replace(/\[\[[^\]]*$/, replacement);
      updateBlock(blockId, { example: { ...block.example, sentence: newSentence } });
    } else if (field === 'translation' && block.example) {
      const newTrans = (block.example.translation || '').replace(/\[\[[^\]]*$/, replacement);
      updateBlock(blockId, { example: { ...block.example, translation: newTrans } });
    } else {
      const newContent = (block.content || '').replace(/\[\[[^\]]*$/, replacement);
      updateBlock(blockId, { content: newContent });
    }

    // Automatically create a 'related' relation edge from this node to picked node!
    addEdge({
      id: `rel_${nodeId}_${pickedNode.id}_${Date.now()}`,
      source: nodeId,
      target: pickedNode.id,
      type: 'relation',
      data: {
        relationType: 'related',
        label: 'related',
        direction: 'forward',
      },
    });

    setActiveNodePicker(null);
  };

  // Filtered nodes for [[ picker
  const filteredPickerNodes = activeNodePicker
    ? storeNodes
        .filter(n => n.id !== nodeId)
        .filter(n =>
          (n.data.title || '').toLowerCase().includes(activeNodePicker.search.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Header with Accept All if AI suggestions exist */}
      {hasAiSuggested && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs anim-bl">
          <div className="flex items-center gap-2 text-purple-300 font-semibold">
            <Sparkles size={14} className="animate-pulse" />
            <span>AI suggested blocks are ready for review</span>
          </div>
          <button
            onClick={acceptAllSuggested}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--br)] hover:brightness-110 text-white font-bold text-xs shadow-sm"
          >
            <Check size={12} />
            <span>Accept All</span>
          </button>
        </div>
      )}

      {/* Blocks List */}
      <div className="flex flex-col gap-2">
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`group relative flex items-start gap-2 p-2.5 rounded-2xl transition-all border ${
              block.aiSuggested
                ? 'border-dashed border-purple-400/60 bg-purple-950/20'
                : 'border-transparent hover:border-[var(--bd)] bg-[var(--sf2)]/50 hover:bg-[var(--sf2)]'
            }`}
          >
            {/* Drag Handle */}
            <button
              className="mt-1 cursor-grab active:cursor-grabbing text-[var(--mu)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--tx)]"
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </button>

            {/* Block Type Content Body */}
            <div className="flex-1 min-w-0">
              {/* AI Generated Label Badge */}
              {block.aiSuggested && (
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-purple-500/20">
                  <span className="flex items-center gap-1 text-[10px] font-metric font-bold text-purple-300">
                    <Sparkles size={11} />
                    <span>AI-generated</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => acceptBlock(block.id)}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[var(--ar)] font-bold text-[10px] flex items-center gap-1"
                      title="Accept block"
                    >
                      <Check size={10} />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-[10px] flex items-center gap-1"
                      title="Reject block"
                    >
                      <X size={10} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 1. TEXT BLOCK */}
              {block.type === 'text' && (
                <textarea
                  dir="auto"
                  rows={Math.max(1, (block.content || '').split('\n').length)}
                  value={block.content || ''}
                  onChange={(e) => handleTextChange(block.id, e.target.value)}
                  placeholder="Type notes or '/' for commands, '[[' to link..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[var(--tx)] outline-none resize-none leading-relaxed placeholder:text-[var(--mu)]/60"
                />
              )}

              {/* 2. BULLET BLOCK */}
              {block.type === 'bullet' && (
                <div
                  className="flex items-start gap-2"
                  style={{ marginLeft: `${(block.indent || 0) * 16}px` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--br)] mt-1.5 shrink-0" />
                  <textarea
                    dir="auto"
                    rows={1}
                    value={block.content || ''}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const currentIndent = block.indent || 0;
                        if (e.shiftKey) {
                          updateBlock(block.id, { indent: Math.max(0, currentIndent - 1) });
                        } else {
                          updateBlock(block.id, { indent: Math.min(4, currentIndent + 1) });
                        }
                      }
                    }}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    placeholder="Bullet note (Tab indents, Shift+Tab outdents)..."
                    className="w-full bg-transparent text-xs sm:text-sm text-[var(--tx)] outline-none resize-none leading-relaxed placeholder:text-[var(--mu)]/60"
                  />
                </div>
              )}

              {/* 3. EXAMPLE BLOCK */}
              {block.type === 'example' && (
                <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-[var(--sf)]/70 border border-[var(--bd)]">
                  <div className="flex items-center justify-between text-[10px] font-metric text-[var(--mu)]">
                    <span className="font-bold text-[var(--tx)]">Example Sentence</span>
                    {(nodeLang === 'de' || nodeLang === 'ar') && (
                      <span className="text-amber-400/90 italic">
                        Check with a dictionary or teacher
                      </span>
                    )}
                  </div>
                  <input
                    dir="auto"
                    type="text"
                    value={block.example?.sentence || ''}
                    onChange={(e) => handleTextChange(block.id, e.target.value, 'sentence')}
                    placeholder="Sentence in target language..."
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[var(--tx)] outline-none placeholder:text-[var(--mu)]/60"
                  />
                  <input
                    dir="auto"
                    type="text"
                    value={block.example?.translation || ''}
                    onChange={(e) => handleTextChange(block.id, e.target.value, 'translation')}
                    placeholder="Translation (English / Arabic)..."
                    className="w-full bg-transparent text-xs text-[var(--mu)] outline-none placeholder:text-[var(--mu)]/50"
                  />
                </div>
              )}

              {/* 4. VOCAB BLOCK */}
              {block.type === 'vocab' && (
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[var(--sf)]/80 border border-[var(--bd)]">
                  <div className="flex items-center justify-between text-[10px] font-metric text-[var(--mu)] font-bold">
                    <span>Multilingual Vocabulary</span>
                    <span className="text-[var(--br)]">DE · EN · AR</span>
                  </div>

                  {/* DE Row */}
                  <div className="flex items-center gap-2">
                    <span className="font-metric text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-[var(--de)] border border-amber-500/30">
                      DE
                    </span>
                    <input
                      type="text"
                      value={block.vocab?.de || ''}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          vocab: { ...block.vocab, de: e.target.value },
                        })
                      }
                      placeholder="German word/phrase..."
                      className="flex-1 bg-transparent text-xs font-semibold text-[var(--tx)] outline-none"
                    />
                    <button
                      onClick={() => speakText(block.vocab?.de || '', 'de')}
                      disabled={!block.vocab?.de}
                      className="p-1 rounded text-[var(--mu)] hover:text-[var(--de)] hover:bg-[var(--sf2)] transition-colors disabled:opacity-30"
                      title="Pronounce in German"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>

                  {/* EN Row */}
                  <div className="flex items-center gap-2">
                    <span className="font-metric text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-[var(--en)] border border-sky-500/30">
                      EN
                    </span>
                    <input
                      type="text"
                      value={block.vocab?.en || ''}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          vocab: { ...block.vocab, en: e.target.value },
                        })
                      }
                      placeholder="English meaning..."
                      className="flex-1 bg-transparent text-xs text-[var(--tx)] outline-none"
                    />
                    <button
                      onClick={() => speakText(block.vocab?.en || '', 'en')}
                      disabled={!block.vocab?.en}
                      className="p-1 rounded text-[var(--mu)] hover:text-[var(--en)] hover:bg-[var(--sf2)] transition-colors disabled:opacity-30"
                      title="Pronounce in English"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>

                  {/* AR Row */}
                  <div className="flex items-center gap-2">
                    <span className="font-metric text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-[var(--ar)] border border-emerald-500/30">
                      AR
                    </span>
                    <input
                      dir="rtl"
                      type="text"
                      value={block.vocab?.ar || ''}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          vocab: { ...block.vocab, ar: e.target.value },
                        })
                      }
                      placeholder="المعنى بالعربية..."
                      className="flex-1 bg-transparent text-xs font-ar text-[var(--tx)] outline-none text-right"
                    />
                    <button
                      onClick={() => speakText(block.vocab?.ar || '', 'ar')}
                      disabled={!block.vocab?.ar}
                      className="p-1 rounded text-[var(--mu)] hover:text-[var(--ar)] hover:bg-[var(--sf2)] transition-colors disabled:opacity-30"
                      title="Pronounce in Arabic"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* 5. FORMULA (LaTeX) BLOCK */}
              {block.type === 'formula' && (
                <div
                  dir="ltr"
                  className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--sf)]/80 border border-[var(--bd)]"
                >
                  <div className="flex items-center justify-between text-[10px] font-metric text-[var(--mu)] font-bold">
                    <span>LaTeX Formula & Preview</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={block.formula?.isVerified || false}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            formula: {
                              ...block.formula,
                              latex: block.formula?.latex || block.content || '',
                              isVerified: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-[var(--bd)] accent-[var(--ar)]"
                      />
                      <span className={block.formula?.isVerified ? 'text-[var(--ar)] font-bold' : ''}>
                        Looks right?
                      </span>
                    </label>
                  </div>

                  {/* KaTeX Live Rendered Box */}
                  <div
                    className="p-3 rounded-xl bg-black/30 border border-white/5 text-center text-sm sm:text-base font-serif overflow-x-auto min-h-[44px] flex items-center justify-center text-white"
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(
                        block.formula?.latex || block.content || 'x',
                        { throwOnError: false }
                      ),
                    }}
                  />

                  {/* Raw LaTeX input */}
                  <input
                    type="text"
                    dir="ltr"
                    value={block.formula?.latex || block.content || ''}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        content: e.target.value,
                        formula: {
                          ...block.formula,
                          latex: e.target.value,
                        },
                      })
                    }
                    placeholder="LaTeX code (e.g., E = mc^2)..."
                    className="w-full bg-[var(--sf2)] px-2.5 py-1.5 rounded-lg text-xs font-mono text-[var(--tx)] outline-none border border-[var(--bd)]"
                  />

                  {/* Variables list */}
                  {block.formula?.variables && block.formula.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                      {block.formula.variables.map((v: { name: string; desc: string }, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[var(--sf2)] border border-[var(--bd)] text-[var(--mu)]"
                        >
                          <b className="text-[var(--tx)] font-mono">{v.name}</b>: {v.desc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. QUESTION BLOCK */}
              {block.type === 'question' && (
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[var(--sf)]/80 border border-[var(--bd)]">
                  <div className="flex items-center justify-between text-[10px] font-metric text-[var(--mu)] font-bold">
                    <span>Flashcard Question</span>
                    <span className="text-amber-400">Front / Back</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[var(--mu)] block mb-0.5">FRONT (PROMPT)</span>
                    <input
                      dir="auto"
                      type="text"
                      value={block.question?.front || ''}
                      onChange={(e) => handleTextChange(block.id, e.target.value, 'front')}
                      placeholder="Prompt / question..."
                      className="w-full bg-transparent text-xs font-semibold text-[var(--tx)] outline-none"
                    />
                  </div>
                  <div className="border-t border-[var(--bd)] pt-1.5">
                    <span className="text-[10px] font-bold text-[var(--mu)] block mb-0.5">BACK (ANSWER)</span>
                    <input
                      dir="auto"
                      type="text"
                      value={block.question?.back || ''}
                      onChange={(e) => handleTextChange(block.id, e.target.value, 'back')}
                      placeholder="Answer / explanation..."
                      className="w-full bg-transparent text-xs text-[var(--ar)] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 7. CLOZE BLOCK */}
              {block.type === 'cloze' && (
                <ClozeBlockPreview
                  block={block}
                  onChange={(val) => handleTextChange(block.id, val)}
                />
              )}
            </div>

            {/* Block Action Tools (Right side) */}
            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
              {/* Lightning Card Toggle on vocab, question, cloze, formula */}
              {['vocab', 'question', 'cloze', 'formula'].includes(block.type) && (
                <button
                  onClick={() => updateBlock(block.id, { isCard: !block.isCard, box: 1 })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    block.isCard
                      ? 'text-amber-400 bg-amber-500/15'
                      : 'text-[var(--mu)] hover:text-amber-400 hover:bg-[var(--sf)]'
                  }`}
                  title={block.isCard ? 'Marked as Leitner Card (Box 1)' : 'Make into Flashcard'}
                >
                  <Zap size={13} fill={block.isCard ? 'currentColor' : 'none'} />
                </button>
              )}

              {/* Remove block */}
              <button
                onClick={() => removeBlock(block.id)}
                className="p-1.5 rounded-lg text-[var(--mu)] hover:text-red-400 hover:bg-[var(--sf)] transition-colors"
                title="Delete block"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Node Picker Popover triggered by '[[' */}
      {activeNodePicker && (
        <div
          className="absolute left-6 z-50 w-64 p-2 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] shadow-2xl flex flex-col gap-1 text-xs anim-bl"
          style={{ bottom: '40px' }}
        >
          <div className="flex items-center justify-between pb-1 px-1 border-b border-[var(--bd)] text-[10px] text-[var(--mu)] font-bold">
            <span className="flex items-center gap-1">
              <LinkIcon size={11} className="text-[var(--br)]" />
              <span>Link to star node</span>
            </span>
            <button onClick={() => setActiveNodePicker(null)}>
              <X size={12} />
            </button>
          </div>
          {filteredPickerNodes.length === 0 ? (
            <div className="p-2 text-center text-[var(--mu)] text-xs">No matching nodes</div>
          ) : (
            filteredPickerNodes.map(n => (
              <button
                key={n.id}
                onClick={() => handleSelectPickerNode({ id: n.id, title: n.data.title })}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-left text-[var(--tx)] transition-colors"
              >
                <span className="truncate font-semibold">{n.data.title}</span>
                <span className="font-metric text-[9px] px-1.5 py-0.2 rounded uppercase bg-[var(--sf2)] text-[var(--mu)]">
                  {n.data.lang}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Insert New Block Toolbar / Slash Menu Button */}
      <div className="relative pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSlashBlockId(activeSlashBlockId ? null : 'menu')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--tx)] border border-[var(--bd)] transition-colors"
          >
            <Plus size={13} className="text-[var(--br)]" />
            <span>Add Block</span>
            <span className="text-[10px] text-[var(--mu)]">(/)</span>
          </button>
        </div>

        {/* Slash Command Dropdown Menu */}
        {activeSlashBlockId && (
          <div
            className="absolute left-0 bottom-11 w-56 p-1.5 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] shadow-2xl z-50 flex flex-col gap-0.5 text-xs anim-bl"
          >
            <div className="px-2 py-1 text-[10px] font-metric text-[var(--mu)] font-bold">
              INSERT BLOCK TYPE
            </div>
            <button
              onClick={() => insertBlock('text')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left"
            >
              <span className="w-5 text-center font-bold text-[var(--br)]">T</span>
              <span>Text Note</span>
            </button>
            <button
              onClick={() => insertBlock('bullet')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left"
            >
              <span className="w-5 text-center font-bold text-[var(--en)]">•</span>
              <span>Bullet Point (Tab indents)</span>
            </button>
            <button
              onClick={() => insertBlock('example')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left"
            >
              <span className="w-5 text-center font-bold text-[var(--de)]">Ex</span>
              <span>Example Sentence</span>
            </button>
            <button
              onClick={() => insertBlock('vocab')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left"
            >
              <span className="w-5 text-center font-bold text-[var(--ar)]">Aa</span>
              <span>Multilingual Vocab (DE/EN/AR)</span>
            </button>
            <button
              onClick={() => insertBlock('formula')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left"
            >
              <span className="w-5 text-center font-serif font-bold text-pink-400">∑</span>
              <span>LaTeX Formula</span>
            </button>
            <button
              onClick={() => insertBlock('question')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left"
            >
              <Zap size={13} className="text-amber-400" />
              <span>Question Card (Front/Back)</span>
            </button>
            <button
              onClick={() => insertBlock('cloze')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left"
            >
              <span className="w-5 text-center font-mono font-bold text-emerald-400">[..]</span>
              <span>Cloze Card (==hidden==)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for Cloze Block preview & editing
const ClozeBlockPreview: React.FC<{
  block: Block;
  onChange: (val: string) => void;
}> = ({ block, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [revealedIdxs, setRevealedIdxs] = useState<Set<number>>(new Set());

  const content = block.content || '';
  const parts = content.split(/(==[^=]+==)/g);

  const toggleReveal = (idx: number) => {
    const next = new Set(revealedIdxs);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setRevealedIdxs(next);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 p-2 rounded-xl bg-[var(--sf)]/80 border border-[var(--bd)]">
        <div className="flex items-center justify-between text-[10px] font-metric text-[var(--mu)]">
          <span className="font-bold text-emerald-400">Cloze Syntax</span>
          <button
            onClick={() => setIsEditing(false)}
            className="text-[var(--br)] hover:underline font-semibold"
          >
            Done
          </button>
        </div>
        <input
          dir="auto"
          type="text"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Wrap hidden answers like ==this== ..."
          className="w-full bg-transparent text-xs sm:text-sm text-[var(--tx)] outline-none font-mono"
        />
      </div>
    );
  }

  return (
    <div
      dir="auto"
      onClick={() => setIsEditing(true)}
      className="p-2 rounded-xl bg-[var(--sf)]/80 border border-[var(--bd)] text-xs sm:text-sm leading-relaxed cursor-text"
      title="Click to edit cloze text"
    >
      {parts.map((p: string, i: number) => {
        if (p.startsWith('==') && p.endsWith('==') && p.length > 4) {
          const hiddenWord = p.slice(2, -2);
          const isRevealed = revealedIdxs.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleReveal(i);
              }}
              className={`inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-xs font-bold transition-all ${
                isRevealed
                  ? 'bg-emerald-500/20 text-[var(--ar)] border border-emerald-500/40'
                  : 'bg-[var(--sf2)] text-transparent border border-dashed border-[var(--bd)] hover:border-[var(--br)] select-none'
              }`}
              title="Click to reveal/hide cloze"
            >
              {isRevealed ? hiddenWord : '••••••'}
            </button>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </div>
  );
};

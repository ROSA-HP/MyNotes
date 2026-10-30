import React, { useState, useId } from 'react';
import { X, Sparkles } from 'lucide-react';
import { MindNode, NodeKind, LanguageCode } from '../types';
import { detectLanguageMix, synthesizeNotesLocally } from '../utils/languageDetection';

interface NoteComposerDockProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  selectedNode: MindNode | null;
  defaultAnchorNode: MindNode;
  onNodesSynthesized: (newNodes: MindNode[], parentId: string) => void;
}

export const NoteComposerDock: React.FC<NoteComposerDockProps> = ({
  isOpen,
  onOpen,
  onClose,
  selectedNode,
  defaultAnchorNode,
  onNodesSynthesized,
}) => {
  const [notesText, setNotesText] = useState(
    'Gestern habe ich ein Buch gekauft (I bought a book). الفعل verstehen يعني يفهم. Ich habe das Buch gekauft. الماضي التام يُكوَّن بالفعل المساعد haben.'
  );
  const [mode, setMode] = useState<'Auto' | 'Grammar' | 'Vocabulary only'>('Auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // 0 = idle, 1 = reading, 2 = extracting, 3 = adding

  const anchor = selectedNode || defaultAnchorNode;
  const mix = detectLanguageMix(notesText);
  const charLimit = 20000;
  const isOverLimit = notesText.length > charLimit;

  const handleRunSynthesis = async () => {
    if (!notesText.trim() || isOverLimit || isProcessing) return;

    setIsProcessing(true);
    setStepIndex(1); // Reading

    // Advance step 1
    await new Promise(r => setTimeout(r, 650));
    setStepIndex(2); // Extracting

    let synthesizedNodes: MindNode[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('/api/synthesize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesText,
          mode,
          anchorLabel: anchor.rows?.de || anchor.label || 'Topic',
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (res.ok) {
        const data = await res.json();
        if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          const baseX = anchor.x + 340;
          const baseY = anchor.y;
          synthesizedNodes = data.nodes.map((n: any, idx: number) => ({
            id: `ai_${Date.now()}_${idx}`,
            kind: (n.kind as NodeKind) || 'concept',
            lang: (n.lang as LanguageCode) || 'de',
            x: baseX + (idx > 1 ? 340 : 0),
            y: baseY + (idx % 2 === 0 ? idx * 80 : -idx * 80),
            label: n.label,
            desc: n.desc,
            rows: n.rows,
            foot: n.foot || ['AI Extracted'],
            box: n.rows ? 1 : undefined,
            dueDays: n.rows ? 1 : undefined,
            mastery: 0,
          }));
        }
      }
    } catch (err) {
      console.warn('API route fallback:', err);
    }

    // Advance step 2
    await new Promise(r => setTimeout(r, 650));
    setStepIndex(3); // Adding

    // If API returned nothing or had fallback, use our smart local multilingual extractor
    if (synthesizedNodes.length === 0) {
      synthesizedNodes = synthesizeNotesLocally(notesText, mode, anchor);
    }

    await new Promise(r => setTimeout(r, 500));

    onNodesSynthesized(synthesizedNodes, anchor.id);
    setIsProcessing(false);
    setStepIndex(0);
    onClose();
  };

  const anchorLabel = anchor.rows?.de || anchor.rows?.en || anchor.label || 'Root Star';

  const isNodeSelected = !!selectedNode;

  if (!isOpen) {
    if (isNodeSelected) {
      return (
        <button
          onClick={onOpen}
          id="pill-round"
          className="fixed right-6 bottom-6 z-20 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full backdrop-blur-xl border shadow-2xl transition-all duration-300 hover:scale-105 font-bold text-xs text-white anim-bl"
          style={{
            backgroundColor: 'var(--br)',
            borderColor: 'var(--bd)',
            boxShadow: '0 0 20px -2px var(--br)',
          }}
          title="Synthesize notes with Gemini"
        >
          <Sparkles size={14} />
          <span>+ Notes</span>
        </button>
      );
    }

    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300">
        <button
          onClick={onOpen}
          id="pill"
          className="flex items-center justify-between gap-4 py-2 px-3 pl-5 w-[520px] max-w-[92vw] rounded-full backdrop-blur-md border shadow-2xl transition-all duration-200 hover:scale-[1.01]"
          style={{
            backgroundColor: 'var(--gl)',
            borderColor: 'var(--bd)',
            color: 'var(--mu)',
          }}
        >
          <span className="text-xs font-medium text-[var(--tx)]">
            Paste notes to grow this map
          </span>
          <span
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110"
            style={{
              backgroundColor: 'var(--br)',
              boxShadow: '0 0 16px -2px var(--br)',
            }}
          >
            <Sparkles size={13} />
            <span>Add notes</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300">
      <div
        className="w-[460px] max-w-[94vw] p-4.5 rounded-3xl backdrop-blur-xl border shadow-2xl flex flex-col gap-3 anim-bl"
        style={{
          backgroundColor: 'var(--gl)',
          borderColor: 'var(--bd)',
        }}
      >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--tx)]">Add notes</span>
              <span className="text-[11px] font-metric px-2 py-0.5 rounded-full bg-[var(--sf2)] text-[var(--mu)]">
                Gemini Synthesizer
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              dir="auto"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Paste German, Arabic, or English notes here..."
              disabled={isProcessing}
              rows={4}
              className="w-full text-xs sm:text-[13px] text-[var(--tx)] bg-[var(--sf2)] border rounded-2xl p-3 outline-none resize-none transition-all placeholder:text-[var(--mu)] focus:border-[var(--br)]"
              style={{
                borderColor: 'var(--bd)',
              }}
            />
          </div>

          {/* Character count & Language Mixture Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-metric text-[var(--mu)]">
              <span>
                Detected: AR {mix.ar}% · DE {mix.de}% · EN {mix.en}%
              </span>
              <span className={isOverLimit ? 'text-[var(--dg)] font-bold' : ''}>
                {notesText.length.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>

            {/* Segmented color bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--sf2)]">
              <div
                style={{
                  width: `${mix.ar}%`,
                  backgroundColor: 'var(--ar)',
                  transition: 'width 0.3s ease',
                }}
                title={`Arabic: ${mix.ar}%`}
              />
              <div
                style={{
                  width: `${mix.de}%`,
                  backgroundColor: 'var(--de)',
                  transition: 'width 0.3s ease',
                }}
                title={`German: ${mix.de}%`}
              />
              <div
                style={{
                  width: `${mix.en}%`,
                  backgroundColor: 'var(--en)',
                  transition: 'width 0.3s ease',
                }}
                title={`English: ${mix.en}%`}
              />
            </div>
          </div>

          {/* Mode Selector Segment */}
          <div
            className="flex p-1 rounded-xl bg-[var(--sf2)]"
            role="group"
            aria-label="Extraction mode"
          >
            {(['Auto', 'Grammar', 'Vocabulary only'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={isProcessing}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === m
                    ? 'bg-[var(--br)] text-white shadow-sm'
                    : 'text-[var(--mu)] hover:text-[var(--tx)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Anchor Node Indicator */}
          <div className="flex items-center justify-between text-xs text-[var(--mu)]">
            <span>
              Attach to star:{' '}
              <b className="text-[var(--tx)] font-semibold truncate inline-block max-w-[200px] align-bottom">
                {anchorLabel}
              </b>
            </span>
          </div>

          {/* Multi-step Loading Animation during processing */}
          {isProcessing && (
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[var(--sf2)] border border-[var(--bd)] anim-bl">
              <div
                className="w-10 h-10 rounded-full anim-orb"
                style={{
                  background: 'radial-gradient(circle, #ffffff, var(--br) 55%, transparent 72%)',
                }}
              />
              <div className="flex flex-col gap-1 text-xs text-center">
                <span className={stepIndex === 1 ? 'font-bold text-[var(--tx)]' : stepIndex > 1 ? 'text-[var(--ar)] font-medium' : 'text-[var(--mu)]'}>
                  {stepIndex > 1 ? '✓ ' : ''}Reading notes
                </span>
                <span className={stepIndex === 2 ? 'font-bold text-[var(--tx)]' : stepIndex > 2 ? 'text-[var(--ar)] font-medium' : 'text-[var(--mu)]'}>
                  {stepIndex > 2 ? '✓ ' : ''}Extracting concepts & vocabulary
                </span>
                <span className={stepIndex === 3 ? 'font-bold text-[var(--tx)]' : 'text-[var(--mu)]'}>
                  Adding stars to your map
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleRunSynthesis}
            disabled={isProcessing || !notesText.trim() || isOverLimit}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            style={{
              backgroundColor: 'var(--br)',
              boxShadow: '0 0 18px -2px var(--br)',
            }}
          >
            <Sparkles size={15} />
            <span>{isProcessing ? 'Synthesizing...' : 'Add to map ✨'}</span>
          </button>
        </div>
    </div>
  );
};

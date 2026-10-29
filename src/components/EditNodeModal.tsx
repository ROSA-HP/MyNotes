import React, { useState, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import { MindNode, LanguageCode } from '../types';

interface EditNodeModalProps {
  node: MindNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: MindNode) => void;
  onDelete: (id: string) => void;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');
  const [deRow, setDeRow] = useState('');
  const [enRow, setEnRow] = useState('');
  const [arRow, setArRow] = useState('');
  const [note, setNote] = useState('');
  const [kind, setKind] = useState<MindNode['kind']>('concept');

  useEffect(() => {
    if (!node) return;
    setLabel(node.label || '');
    setDesc(node.desc || '');
    setDeRow(node.rows?.de || '');
    setEnRow(node.rows?.en || '');
    setArRow(node.rows?.ar || '');
    setNote(node.note || '');
    setKind(node.kind);
  }, [node]);

  if (!isOpen || !node) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  const isVocab = !!node.rows || kind === 'vocab';

  const handleSave = () => {
    let detectedLang: LanguageCode = node.lang;
    const testText = isVocab ? deRow || enRow || arRow : label;

    if (/[\u0600-\u06FF]/.test(testText)) {
      detectedLang = 'ar';
    } else if (/[äöüß]/i.test(testText)) {
      detectedLang = 'de';
    }

    const updated: MindNode = {
      ...node,
      kind,
      lang: detectedLang,
      label: isVocab ? undefined : label.trim() || 'Untitled',
      desc: isVocab ? undefined : desc.trim(),
      rows: isVocab
        ? {
            de: deRow.trim(),
            en: enRow.trim(),
            ar: arRow.trim(),
          }
        : undefined,
      note: note.trim() || undefined,
    };

    onSave(updated);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-bl"
    >
      <div
        className="w-full max-w-[560px] p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--sf)',
          borderColor: 'var(--bd)',
          color: 'var(--tx)',
        }}
      >
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">Edit star node</h2>
            <span className="bdg font-metric">
              {node.lang.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Node Kind selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--mu)]">Type:</label>
          <div className="flex p-0.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-xs font-semibold">
            {(['concept', 'vocab', 'rule', 'example', 'topic'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  kind === k ? 'bg-[var(--br)] text-white' : 'text-[var(--mu)] hover:text-[var(--tx)]'
                }`}
              >
                {k === 'vocab' ? 'Word' : k}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Fields */}
        {isVocab ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5 l-de">
              <label className="text-xs font-semibold text-[var(--de)]">
                Deutsch · DE
              </label>
              <input
                type="text"
                lang="de"
                dir="auto"
                value={deRow}
                onChange={(e) => setDeRow(e.target.value)}
                placeholder="z.B. verstehen"
                className="w-full text-sm bg-[var(--sf2)] border rounded-xl p-2.5 outline-none text-[var(--tx)] focus:border-[var(--de)]"
                style={{ borderColor: 'color-mix(in srgb, var(--de) 40%, transparent)' }}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5 l-en">
              <label className="text-xs font-semibold text-[var(--en)]">
                English · EN
              </label>
              <input
                type="text"
                lang="en"
                dir="auto"
                value={enRow}
                onChange={(e) => setEnRow(e.target.value)}
                placeholder="e.g. to understand"
                className="w-full text-sm bg-[var(--sf2)] border rounded-xl p-2.5 outline-none text-[var(--tx)] focus:border-[var(--en)]"
                style={{ borderColor: 'color-mix(in srgb, var(--en) 40%, transparent)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5 l-ar">
              <label className="text-xs font-semibold text-[var(--ar)]">
                العربية · AR
              </label>
              <input
                type="text"
                lang="ar"
                dir="rtl"
                value={arRow}
                onChange={(e) => setArRow(e.target.value)}
                placeholder="مثال: يفهم"
                className="w-full text-sm font-arabic bg-[var(--sf2)] border rounded-xl p-2.5 outline-none text-[var(--tx)] focus:border-[var(--ar)]"
                style={{ borderColor: 'color-mix(in srgb, var(--ar) 40%, transparent)' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--mu)]">Label</label>
              <input
                type="text"
                dir="auto"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Concept or Rule title"
                className="w-full text-sm bg-[var(--sf2)] border rounded-xl p-2.5 outline-none text-[var(--tx)] focus:border-[var(--br)]"
                style={{ borderColor: 'var(--bd)' }}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--mu)]">Description</label>
              <textarea
                dir="auto"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="Explain the grammar rule or relationship..."
                className="w-full text-sm bg-[var(--sf2)] border rounded-xl p-2.5 outline-none text-[var(--tx)] resize-none focus:border-[var(--br)]"
                style={{ borderColor: 'var(--bd)' }}
              />
            </div>
          </div>
        )}

        {/* Collapsible More Section */}
        <details className="text-xs text-[var(--mu)] cursor-pointer">
          <summary className="font-semibold hover:text-[var(--tx)] transition-colors py-1 select-none">
            Additional Memory Note / Leitner Details
          </summary>
          <div className="pt-2 flex flex-col gap-1">
            <textarea
              dir="auto"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Private mnemonic, memory trigger or notes (max 500 characters)..."
              className="w-full text-xs bg-[var(--sf2)] border rounded-xl p-2.5 outline-none text-[var(--tx)] resize-none focus:border-[var(--br)]"
              style={{ borderColor: 'var(--bd)' }}
            />
            <span className="text-[10px] text-right text-[var(--mu)] font-metric">
              {note.length} / 500
            </span>
          </div>
        </details>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--bd)] mt-1">
          <button
            onClick={() => {
              onDelete(node.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--dg)] bg-[var(--sf2)] hover:bg-[var(--dg)] hover:text-white transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--tx)] bg-[var(--sf2)] hover:brightness-110 transition-colors flex items-center gap-1"
            >
              Cancel <kbd className="text-[9px]">Esc</kbd>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--br)',
                boxShadow: '0 0 14px -2px var(--br)',
              }}
            >
              Save changes <kbd className="text-[9px] text-white/90 bg-white/20">{isMac ? '⌘↵' : 'Ctrl+↵'}</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

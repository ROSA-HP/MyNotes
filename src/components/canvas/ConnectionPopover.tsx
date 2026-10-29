import React, { useState, useEffect, useRef } from 'react';
import { RelationType } from '../../types/canvas';

interface ConnectionPopoverProps {
  position: { x: number; y: number };
  sourceNodeTitle: string;
  targetNodeTitle: string;
  onConfirm: (config: {
    kind: 'hierarchy' | 'relation';
    relationType?: RelationType;
    label?: string;
    direction?: 'forward' | 'backward' | 'bi';
  }) => void;
  onCancel: () => void;
}

export const ConnectionPopover: React.FC<ConnectionPopoverProps> = ({
  position,
  sourceNodeTitle,
  targetNodeTitle,
  onConfirm,
  onCancel,
}) => {
  const [connectionKind, setConnectionKind] = useState<'hierarchy' | 'relation'>('hierarchy');
  const [relationType, setRelationType] = useState<RelationType>('semantic');
  const [label, setLabel] = useState('');
  const [direction, setDirection] = useState<'forward' | 'backward' | 'bi'>('forward');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm({
          kind: connectionKind,
          relationType,
          label: label.trim() || undefined,
          direction,
        });
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectionKind, relationType, label, direction, onConfirm, onCancel]);

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: 'var(--sf)',
        borderColor: 'var(--bd)',
      }}
      className="fixed z-50 p-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 w-64 text-xs anim-bl"
    >
      <div className="flex items-center justify-between text-[11px] font-metric text-[var(--mu)]">
        <span>Connect link</span>
        <span>↵ Confirm</span>
      </div>

      {/* Kind Selector: Structure vs Relation */}
      <div className="flex p-0.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] font-semibold">
        <button
          type="button"
          onClick={() => setConnectionKind('hierarchy')}
          className={`flex-1 py-1 rounded-lg transition-colors ${
            connectionKind === 'hierarchy' ? 'bg-[var(--br)] text-white' : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
        >
          Structure
        </button>
        <button
          type="button"
          onClick={() => setConnectionKind('relation')}
          className={`flex-1 py-1 rounded-lg transition-colors ${
            connectionKind === 'relation' ? 'bg-[var(--br)] text-white' : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
        >
          Relation
        </button>
      </div>

      {connectionKind === 'hierarchy' ? (
        <p className="text-[11px] text-[var(--mu)]">
          &ldquo;{sourceNodeTitle}&rdquo; becomes parent of &ldquo;{targetNodeTitle}&rdquo;.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Relation Type */}
          <select
            value={relationType}
            onChange={(e) => setRelationType(e.target.value as RelationType)}
            className="w-full bg-[var(--sf2)] border border-[var(--bd)] rounded-xl px-2 py-1 outline-none text-[var(--tx)]"
          >
            <option value="semantic">Semantic / Related</option>
            <option value="prerequisite">Prerequisite</option>
            <option value="analogy">Analogy</option>
            <option value="contrast">Contrast</option>
            <option value="derivation">Derivation</option>
          </select>

          {/* Direction */}
          <div className="flex items-center justify-between gap-1 text-[11px] font-metric">
            <span className="text-[var(--mu)]">Direction:</span>
            <div className="flex gap-1">
              {(['forward', 'backward', 'bi'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`px-1.5 py-0.5 rounded border text-[10px] ${
                    direction === d
                      ? 'border-[var(--br)] bg-[var(--sf2)] text-[var(--br)] font-bold'
                      : 'border-[var(--bd)] text-[var(--mu)]'
                  }`}
                >
                  {d === 'forward' ? '➔' : d === 'backward' ? '⬅' : '⇄'}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Label */}
          <input
            ref={inputRef}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. prefix instance)"
            className="w-full bg-[var(--sf2)] border border-[var(--bd)] rounded-xl px-2 py-1 outline-none text-[var(--tx)] placeholder:text-[var(--mu)]"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--bd)]">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 rounded-lg text-[var(--mu)] hover:text-[var(--tx)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onConfirm({
              kind: connectionKind,
              relationType,
              label: label.trim() || undefined,
              direction,
            })
          }
          className="px-3 py-1 rounded-lg font-bold text-white shadow-sm hover:brightness-110"
          style={{ backgroundColor: 'var(--br)' }}
        >
          Create
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

interface EmptyMapFirstRunProps {
  rootTitle: string;
  onOpenComposer: () => void;
  onAddFirstChild: () => void;
}

export const EmptyMapFirstRun: React.FC<EmptyMapFirstRunProps> = ({
  rootTitle,
  onOpenComposer,
  onAddFirstChild,
}) => {
  return (
    <div className="absolute inset-0 top-14 pointer-events-none flex flex-col items-center justify-center p-6 z-10 select-none">
      <div className="flex flex-col items-center gap-6 max-w-md text-center pointer-events-auto anim-bl">
        {/* Glowing Root Star Representation */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full grid place-items-center text-white font-extrabold text-xl shadow-2xl relative z-10 anim-pop"
            style={{
              backgroundColor: 'var(--br)',
              boxShadow: '0 0 35px 8px color-mix(in srgb, var(--br) 65%, transparent)',
            }}
          >
            ★
          </div>
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-25"
            style={{ backgroundColor: 'var(--br)' }}
          />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[var(--tx)]">
            {rootTitle || 'Your Constellation Begins'}
          </h2>
          <p className="text-xs text-[var(--mu)] mt-1.5 leading-relaxed">
            Every concept starts as an illuminated star. Paste your language study notes, or double-click anywhere on the canvas to manually craft your map.
          </p>
        </div>

        {/* Primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenComposer}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-xl hover:brightness-110 transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--br)',
              boxShadow: '0 0 20px -2px var(--br)',
            }}
          >
            <Sparkles size={15} />
            <span>Paste Notes to Grow Map</span>
          </button>

          <button
            onClick={onAddFirstChild}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[var(--sf2)] hover:bg-[var(--sf)] border border-[var(--bd)] text-[var(--tx)] transition-colors"
          >
            <Plus size={14} />
            <span>Add First Star</span>
          </button>
        </div>
      </div>
    </div>
  );
};

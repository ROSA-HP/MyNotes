import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="absolute inset-0 top-14 bg-[var(--bg)] flex items-center justify-center p-8 z-30 select-none">
      <div className="w-full max-w-4xl flex flex-col gap-8 opacity-70 animate-pulse">
        {/* Header bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--sf2)]" />
            <div className="flex flex-col gap-2">
              <div className="w-48 h-5 rounded-lg bg-[var(--sf2)]" />
              <div className="w-32 h-3.5 rounded-lg bg-[var(--sf2)]" />
            </div>
          </div>
          <div className="w-28 h-8 rounded-full bg-[var(--sf2)]" />
        </div>

        {/* Node cards skeleton constellation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="h-44 rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-4 flex flex-col justify-between">
            <div className="w-20 h-4 rounded-full bg-[var(--sf2)]" />
            <div className="flex flex-col gap-2">
              <div className="w-40 h-5 rounded-lg bg-[var(--sf2)]" />
              <div className="w-56 h-3.5 rounded-lg bg-[var(--sf2)]" />
            </div>
            <div className="w-full h-4 rounded bg-[var(--sf2)]" />
          </div>

          <div className="h-44 rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-4 flex flex-col justify-between translate-y-6">
            <div className="w-20 h-4 rounded-full bg-[var(--sf2)]" />
            <div className="flex flex-col gap-2">
              <div className="w-36 h-5 rounded-lg bg-[var(--sf2)]" />
              <div className="w-48 h-3.5 rounded-lg bg-[var(--sf2)]" />
            </div>
            <div className="w-full h-4 rounded bg-[var(--sf2)]" />
          </div>

          <div className="h-44 rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-4 flex flex-col justify-between -translate-y-4">
            <div className="w-20 h-4 rounded-full bg-[var(--sf2)]" />
            <div className="flex flex-col gap-2">
              <div className="w-44 h-5 rounded-lg bg-[var(--sf2)]" />
              <div className="w-52 h-3.5 rounded-lg bg-[var(--sf2)]" />
            </div>
            <div className="w-full h-4 rounded bg-[var(--sf2)]" />
          </div>
        </div>

        <div className="text-center text-xs font-metric text-[var(--mu)] pt-4">
          Loading celestial constellation…
        </div>
      </div>
    </div>
  );
};

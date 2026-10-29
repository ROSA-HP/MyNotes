import React from 'react';
import { Sparkles, MapPin, Play, BookOpen, Flame, Compass, Plus } from 'lucide-react';
import { MindMapData } from '../types';

interface HomeViewProps {
  maps: MindMapData[];
  activeMapId: string;
  onOpenMap: (mapId: string) => void;
  onOpenStudy: () => void;
  onOpenNewMapModal: () => void;
  streakDays: number;
  xp: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  maps,
  activeMapId,
  onOpenMap,
  onOpenStudy,
  onOpenNewMapModal,
  streakDays,
  xp,
}) => {
  const currentMap = maps.find(m => m.id === activeMapId) || maps[0];
  const totalStars = maps.reduce((acc, m) => acc + m.nodes.length, 0);
  const totalVocab = maps.reduce(
    (acc, m) => acc + m.nodes.filter(n => !!n.rows).length,
    0
  );

  return (
    <div className="absolute inset-0 top-14 overflow-y-auto p-4 sm:p-8 bg-[var(--bg)] text-[var(--tx)] flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-8 pb-16">
        {/* Hero Section */}
        <div
          className="relative p-6 sm:p-8 rounded-3xl border shadow-xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            backgroundColor: 'var(--sf)',
            borderColor: 'var(--bd)',
          }}
        >
          {/* Subtle cosmic glow in the background */}
          <div
            className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full pointer-events-none opacity-20 blur-3xl"
            style={{ backgroundColor: 'var(--br)' }}
          />

          <div className="flex flex-col gap-2 z-10">
            <div className="flex items-center gap-2 text-xs font-metric text-[var(--mu)]">
              <span className="w-2 h-2 rounded-full bg-[var(--ar)]" />
              <span>Cognitive Workspace Active</span>
              <span>·</span>
              <span>Celestial MindLex Cartography</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-purple-300 to-indigo-200 bg-clip-text text-transparent">Sara</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--mu)] max-w-xl leading-relaxed">
              Continue forging interconnected constellations across German, Arabic, and English.
              Every illuminated star reinforces deep semantic retention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
            <button
              onClick={() => onOpenMap(currentMap.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'var(--br)',
                boxShadow: '0 0 20px -2px var(--br)',
              }}
            >
              <Compass size={16} />
              <span>Open &ldquo;{currentMap.title}&rdquo;</span>
            </button>

            <button
              onClick={onOpenStudy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-[var(--sf2)] hover:brightness-110 border border-[var(--bd)] transition-all"
            >
              <Play size={14} className="text-[var(--rw)]" />
              <span>Review Flashcards</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div
            className="p-4 rounded-2xl border shadow-sm flex flex-col gap-1"
            style={{ backgroundColor: 'var(--sf)', borderColor: 'var(--bd)' }}
          >
            <span className="text-[11px] font-metric text-[var(--mu)] flex items-center gap-1">
              <Flame size={12} className="text-[var(--rw)]" /> Daily Streak
            </span>
            <span className="font-metric text-2xl font-bold text-[var(--rw)]">
              {streakDays} <span className="text-xs text-[var(--mu)]">days</span>
            </span>
          </div>

          <div
            className="p-4 rounded-2xl border shadow-sm flex flex-col gap-1"
            style={{ backgroundColor: 'var(--sf)', borderColor: 'var(--bd)' }}
          >
            <span className="text-[11px] font-metric text-[var(--mu)] flex items-center gap-1">
              <Sparkles size={12} className="text-[var(--br)]" /> Total XP
            </span>
            <span className="font-metric text-2xl font-bold text-[var(--tx)]">
              {xp} <span className="text-xs text-[var(--mu)]">XP</span>
            </span>
          </div>

          <div
            className="p-4 rounded-2xl border shadow-sm flex flex-col gap-1"
            style={{ backgroundColor: 'var(--sf)', borderColor: 'var(--bd)' }}
          >
            <span className="text-[11px] font-metric text-[var(--mu)] flex items-center gap-1">
              <Compass size={12} className="text-[var(--en)]" /> Star Nodes
            </span>
            <span className="font-metric text-2xl font-bold text-[var(--en)]">
              {totalStars} <span className="text-xs text-[var(--mu)]">stars</span>
            </span>
          </div>

          <div
            className="p-4 rounded-2xl border shadow-sm flex flex-col gap-1"
            style={{ backgroundColor: 'var(--sf)', borderColor: 'var(--bd)' }}
          >
            <span className="text-[11px] font-metric text-[var(--mu)] flex items-center gap-1">
              <BookOpen size={12} className="text-[var(--ar)]" /> Words Indexed
            </span>
            <span className="font-metric text-2xl font-bold text-[var(--ar)]">
              {totalVocab} <span className="text-xs text-[var(--mu)]">words</span>
            </span>
          </div>
        </div>

        {/* Constellation Maps Library Showcase */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <MapPin size={18} className="text-[var(--br)]" />
              <span>Your Constellation Maps</span>
            </h2>
            <button
              onClick={onOpenNewMapModal}
              className="flex items-center gap-1 text-xs font-bold text-[var(--br)] hover:underline"
            >
              <Plus size={14} />
              <span>Create Map</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maps.map((map) => {
              const isActive = map.id === activeMapId;
              const vocabCount = map.nodes.filter(n => !!n.rows).length;

              return (
                <div
                  key={map.id}
                  onClick={() => onOpenMap(map.id)}
                  className={`p-5 rounded-3xl border shadow-md flex flex-col justify-between gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                    isActive
                      ? 'border-[var(--br)] ring-1 ring-[var(--br)]'
                      : 'border-[var(--bd)]'
                  }`}
                  style={{ backgroundColor: 'var(--sf)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[var(--tx)]">{map.title}</h3>
                        {isActive && (
                          <span className="text-[10px] font-metric px-2 py-0.5 rounded-full bg-[var(--br)] text-white font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      {map.subtitle && (
                        <p className="text-xs text-[var(--mu)] mt-0.5">{map.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs font-metric font-bold text-[var(--ar)]">
                      {map.streakDays}d streak
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-metric text-[var(--mu)] pt-3 border-t border-[var(--bd)]">
                    <div className="flex items-center gap-3">
                      <span>{map.nodes.length} stars</span>
                      <span>·</span>
                      <span>{vocabCount} vocab</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMap(map.id);
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: 'var(--br)' }}
                    >
                      Open
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Create New Map Card */}
            <div
              onClick={onOpenNewMapModal}
              className="p-5 rounded-3xl border border-dashed border-[var(--bd)] flex flex-col items-center justify-center gap-2 cursor-pointer text-center hover:bg-[var(--sf2)] transition-colors min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--sf2)] grid place-items-center text-[var(--br)]">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold text-[var(--tx)]">Create New Constellation Map</span>
              <span className="text-[11px] text-[var(--mu)]">Synthesize new topics or language branches</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

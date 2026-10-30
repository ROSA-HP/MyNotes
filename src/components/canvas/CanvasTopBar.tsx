import React, { useState } from 'react';
import {
  Search,
  Undo2,
  Redo2,
  Grid,
  Sparkles,
  LayoutTemplate,
  Plus,
  Compass,
} from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import { LanguageCode } from '../../../shared';

interface CanvasTopBarProps {
  currentRoute: 'home' | 'map';
  onNavigateRoute: (route: 'home' | 'map') => void;
  onOpenSearch: () => void;
  onOpenExport: () => void;
  onOpenComposer: () => void;
  onAddTopicClick: () => void;
  onAddSubtopicClick: () => void;
}

export const CanvasTopBar: React.FC<CanvasTopBarProps> = ({
  currentRoute,
  onNavigateRoute,
  onOpenSearch,
  onOpenExport,
  onOpenComposer,
  onAddTopicClick,
  onAddSubtopicClick,
}) => {
  const map = useMapStore(s => s.map);
  const saveStatus = useMapStore(s => s.saveStatus);
  const activeLangs = useMapStore(s => s.activeLangs);
  const theme = useMapStore(s => s.theme);
  const snapToGrid = useMapStore(s => s.snapToGrid);
  const history = useMapStore(s => s.history);
  const future = useMapStore(s => s.future);

  const undo = useMapStore(s => s.undo);
  const redo = useMapStore(s => s.redo);
  const autoArrange = useMapStore(s => s.autoArrange);
  const toggleLang = useMapStore(s => s.toggleLang);
  const toggleTheme = useMapStore(s => s.toggleTheme);
  const toggleSnapToGrid = useMapStore(s => s.toggleSnapToGrid);
  const viewMode = useMapStore(s => s.viewMode);
  const setViewMode = useMapStore(s => s.setViewMode);

  const [showAutoArrangeModal, setShowAutoArrangeModal] = useState(false);
  const [unpinAllCheck, setUnpinAllCheck] = useState(false);

  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  return (
    <header
      className="fixed top-0 inset-x-0 h-14 z-30 flex items-center gap-3 px-4 backdrop-blur-md border-b transition-colors select-none"
      style={{
        backgroundColor: 'var(--gl)',
        borderColor: 'var(--bd)',
        color: 'var(--tx)',
      }}
    >
      {/* Brand & Route Links */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigateRoute('home')}
          className="font-extrabold flex items-center gap-2 cursor-pointer text-[15px] tracking-tight group"
        >
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="group-hover:scale-105 transition-transform">
            <circle cx="6" cy="18" r="3" fill="#2DD4A0" />
            <circle cx="13" cy="7" r="3.5" fill="#7C5CFF" />
            <circle cx="21" cy="16" r="3" fill="#FFB04D" />
            <path d="M6 18L13 7L21 16" stroke="#4DA3FF" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="bg-gradient-to-r from-purple-300 via-indigo-200 to-white bg-clip-text text-transparent font-bold">
            MindLex
          </span>
        </div>

        {/* Route switcher navigation */}
        <nav className="flex items-center gap-1 ml-1" aria-label="Routes">
          <button
            onClick={() => onNavigateRoute('home')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              currentRoute === 'home'
                ? 'bg-[var(--br)] text-white shadow-sm'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigateRoute('map')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              currentRoute === 'map'
                ? 'bg-[var(--br)] text-white shadow-sm'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Canvas
          </button>
        </nav>

        {/* Map / Outline View Toggle */}
        {currentRoute === 'map' && (
          <div className="flex items-center bg-[var(--sf2)] rounded-full p-0.5 border border-[var(--bd)] ml-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                viewMode === 'map'
                  ? 'bg-[var(--br)] text-white shadow-sm'
                  : 'text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode('outline')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                viewMode === 'outline'
                  ? 'bg-[var(--br)] text-white shadow-sm'
                  : 'text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              Outline
            </button>
          </div>
        )}
      </div>

      {/* Map Title and Save Status Chip */}
      {currentRoute === 'map' && map && (
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--bd)]">
          <span className="font-bold text-sm max-w-[180px] sm:max-w-[240px] truncate text-[var(--tx)]">
            {map.title}
          </span>

          {/* Save Status Chip: Saving / Saved / Offline */}
          <span
            className={`font-metric text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold transition-all ${
              saveStatus === 'Saving'
                ? 'text-[var(--de)] bg-amber-500/10'
                : saveStatus === 'Offline'
                ? 'text-[var(--dg)] bg-red-500/10'
                : 'text-[var(--ar)] bg-emerald-500/10'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'Saving'
                  ? 'bg-[var(--de)] animate-pulse'
                  : saveStatus === 'Offline'
                  ? 'bg-[var(--dg)]'
                  : 'bg-[var(--ar)]'
              }`}
            />
            <span>{saveStatus}</span>
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Canvas Editing Affordances (when in map view) */}
      {currentRoute === 'map' && (
        <div className="hidden lg:flex items-center gap-1.5">
          {/* Add topic button */}
          <button
            onClick={onAddTopicClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--tx)] transition-colors border border-[var(--bd)]"
            title="Add a new root topic star"
          >
            <Plus size={13} className="text-[var(--br)]" />
            <span>Add topic</span>
          </button>

          {/* Add subtopic button */}
          <button
            onClick={onAddSubtopicClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--tx)] transition-colors border border-[var(--bd)]"
            title="Click to place a concept star"
          >
            <Plus size={13} className="text-[var(--en)]" />
            <span>Add subtopic</span>
          </button>

          {/* Auto-arrange button */}
          <div className="relative">
            <button
              onClick={() => setShowAutoArrangeModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--tx)] transition-colors border border-[var(--bd)]"
              title="Dagre hierarchy auto-arrange"
            >
              <LayoutTemplate size={13} className="text-[var(--ar)]" />
              <span>Auto-arrange</span>
            </button>

            {showAutoArrangeModal && (
              <div
                className="absolute right-0 top-10 w-56 p-3 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] shadow-2xl z-50 flex flex-col gap-2.5 text-xs anim-bl"
              >
                <div className="font-bold text-[var(--tx)]">Hierarchy Layout</div>
                <p className="text-[11px] text-[var(--mu)]">
                  Re-lays out unpinned nodes using Dagre left-to-right hierarchy.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={unpinAllCheck}
                    onChange={(e) => setUnpinAllCheck(e.target.checked)}
                    className="rounded border-[var(--bd)] accent-[var(--br)]"
                  />
                  <span>Unpin all nodes before layout</span>
                </label>
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[var(--bd)]">
                  <button
                    onClick={() => setShowAutoArrangeModal(false)}
                    className="px-2 py-0.5 rounded text-[var(--mu)] hover:text-[var(--tx)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      autoArrange(unpinAllCheck);
                      setShowAutoArrangeModal(false);
                    }}
                    className="px-3 py-1 rounded-lg font-bold text-white shadow-sm hover:brightness-110"
                    style={{ backgroundColor: 'var(--br)' }}
                  >
                    Apply Layout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Snap-to-grid toggle */}
          <button
            onClick={toggleSnapToGrid}
            title={`Snap to 16px Grid: ${snapToGrid ? 'ON' : 'OFF'}`}
            className={`w-7 h-7 rounded-xl grid place-items-center transition-colors border ${
              snapToGrid
                ? 'bg-[var(--br)] text-white border-[var(--br)]'
                : 'bg-[var(--sf2)] text-[var(--mu)] border-[var(--bd)]'
            }`}
          >
            <Grid size={13} />
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)]">
            <button
              onClick={undo}
              disabled={history.length === 0}
              title={`Undo (${isMac ? '⌘Z' : 'Ctrl+Z'})`}
              className="w-6 h-6 rounded-lg grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] disabled:opacity-30 disabled:pointer-events-none"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              title={`Redo (${isMac ? '⌘⇧Z' : 'Ctrl+Y'})`}
              className="w-6 h-6 rounded-lg grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] disabled:opacity-30 disabled:pointer-events-none"
            >
              <Redo2 size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Search trigger */}
      <button
        onClick={onOpenSearch}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--sf2)] text-[var(--mu)] hover:text-[var(--tx)] transition-colors border border-[var(--bd)]"
        aria-label="Search nodes"
      >
        <Search size={13} />
        <span>Search</span>
        <kbd className="text-[10px]">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
      </button>

      {/* Language filter chips */}
      <div className="hidden sm:flex items-center gap-1.5" role="group" aria-label="Filter by language">
        {(['en', 'ar', 'de'] as LanguageCode[]).map((lang) => {
          const isActive = activeLangs.has(lang);
          const color = lang === 'ar' ? 'var(--ar)' : lang === 'de' ? 'var(--de)' : 'var(--en)';
          return (
            <button
              key={lang}
              onClick={() => toggleLang(lang)}
              aria-pressed={isActive}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-metric font-bold transition-all border"
              style={{
                color,
                borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                backgroundColor: isActive ? `color-mix(in srgb, ${color} 18%, transparent)` : 'transparent',
                opacity: isActive ? 1 : 0.4,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
              />
              {lang.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* AI Note Synthesizer Trigger Button */}
      <button
        onClick={onOpenComposer}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 transition-colors"
        style={{
          backgroundColor: 'var(--br)',
          boxShadow: '0 0 14px -2px var(--br)',
        }}
      >
        <Sparkles size={13} />
        <span className="hidden sm:inline">AI Notes</span>
      </button>

      {/* Export Button */}
      <button
        onClick={onOpenExport}
        className="px-3 py-1.5 rounded-xl font-semibold text-xs bg-[var(--sf2)] text-[var(--tx)] hover:brightness-110 transition-colors border border-[var(--bd)]"
      >
        Export
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 rounded-xl grid place-items-center text-sm font-bold bg-[var(--sf2)] text-[var(--tx)] hover:bg-[var(--sf)] transition-colors border border-[var(--bd)]"
        title="Toggle Theme"
      >
        {theme === 'dark' ? '◐' : '☼'}
      </button>

      {/* User Avatar */}
      <div
        className="w-8 h-8 rounded-full grid place-items-center font-bold text-xs text-white shadow-sm"
        style={{ backgroundColor: 'var(--br)' }}
        title="Sara's Profile"
      >
        S
      </div>
    </header>
  );
};

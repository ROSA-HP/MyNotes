import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { LanguageCode } from '../types';

interface HeaderProps {
  currentTitle: string;
  onTitleChange: (newTitle: string) => void;
  activeNav: 'home' | 'maps' | 'study' | 'words';
  setActiveNav: (nav: 'home' | 'maps' | 'study' | 'words') => void;
  activeLangs: Set<LanguageCode>;
  onToggleLang: (lang: LanguageCode) => void;
  onOpenSearch: () => void;
  onOpenExport: () => void;
  onOpenMapsDirectory: () => void;
  streakDays: number;
  xp: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  saveStatus: 'saved' | 'saving';
  studyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTitle,
  onTitleChange,
  activeNav,
  setActiveNav,
  activeLangs,
  onToggleLang,
  onOpenSearch,
  onOpenExport,
  onOpenMapsDirectory,
  streakDays,
  xp,
  theme,
  onToggleTheme,
  saveStatus,
  studyCount,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(currentTitle);
  const [displayXp, setDisplayXp] = useState(xp);
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  useEffect(() => {
    setTitleDraft(currentTitle);
  }, [currentTitle]);

  // Smooth XP count-up animation
  useEffect(() => {
    if (displayXp === xp) return;
    const start = displayXp;
    const diff = xp - start;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      setDisplayXp(Math.round(start + diff * progress));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [xp]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleDraft.trim()) {
      onTitleChange(titleDraft.trim());
    } else {
      setTitleDraft(currentTitle);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 h-14 z-30 flex items-center gap-3 px-4 backdrop-blur-md border-b transition-colors"
      style={{
        backgroundColor: 'var(--gl)',
        borderColor: 'var(--bd)',
        color: 'var(--tx)',
      }}
    >
      {/* Brand Logo */}
      <div 
        onClick={() => setActiveNav('maps')}
        className="font-extrabold flex items-center gap-2 cursor-pointer select-none text-[15px] tracking-tight group"
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

      {/* Main Navigation */}
      <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Main Navigation">
        <button
          onClick={() => setActiveNav('home')}
          className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-colors ${
            activeNav === 'home'
              ? 'text-white'
              : 'hover:text-[var(--tx)]'
          }`}
          style={{
            backgroundColor: activeNav === 'home' ? 'var(--br)' : 'transparent',
            color: activeNav === 'home' ? '#ffffff' : 'var(--mu)',
          }}
        >
          Home
        </button>
        <button
          onClick={() => setActiveNav('maps')}
          className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-colors ${
            activeNav === 'maps'
              ? 'text-white shadow-sm'
              : 'hover:text-[var(--tx)]'
          }`}
          style={{
            backgroundColor: activeNav === 'maps' ? 'var(--br)' : 'transparent',
            color: activeNav === 'maps' ? '#ffffff' : 'var(--mu)',
          }}
        >
          Maps
        </button>
        <button
          onClick={() => setActiveNav('study')}
          className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-colors relative flex items-center gap-1.5 ${
            activeNav === 'study'
              ? 'text-white'
              : 'hover:text-[var(--tx)]'
          }`}
          style={{
            backgroundColor: activeNav === 'study' ? 'var(--br)' : 'transparent',
            color: activeNav === 'study' ? '#ffffff' : 'var(--mu)',
          }}
        >
          Study
          {studyCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[var(--rw)] text-white text-[10px] font-bold grid place-items-center font-metric">
              {studyCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveNav('words')}
          className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-colors ${
            activeNav === 'words'
              ? 'text-white'
              : 'hover:text-[var(--tx)]'
          }`}
          style={{
            backgroundColor: activeNav === 'words' ? 'var(--br)' : 'transparent',
            color: activeNav === 'words' ? '#ffffff' : 'var(--mu)',
          }}
        >
          Words
        </button>
      </nav>

      {/* Map Switcher / Title */}
      <div className="flex items-center gap-2 ml-1">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="text-sm font-bold bg-[var(--sf2)] px-2 py-0.5 rounded border border-[var(--br)] outline-none text-[var(--tx)]"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            title="Click to rename map"
            className="font-bold text-sm hover:underline cursor-text text-left max-w-[180px] sm:max-w-[260px] truncate"
          >
            {currentTitle}
          </button>
        )}

        <button
          onClick={onOpenMapsDirectory}
          title="Switch Mind Map"
          className="text-xs px-2 py-0.5 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors border border-[var(--bd)]"
        >
          Switch ▾
        </button>

        {/* Saved Status Indicator */}
        <span
          className={`font-metric text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all ${
            saveStatus === 'saving' ? 'opacity-70 scale-95' : 'anim-flash'
          }`}
          style={{
            color: 'var(--ar)',
            backgroundColor: 'color-mix(in srgb, var(--ar) 14%, transparent)',
          }}
        >
          {saveStatus === 'saving' ? 'Saving…' : 'Saved ✓'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Search trigger */}
      <button
        onClick={onOpenSearch}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        style={{
          backgroundColor: 'var(--sf2)',
          color: 'var(--mu)',
        }}
        aria-label="Open Command Search"
      >
        <Search size={14} />
        <span>Search</span>
        <kbd className="text-[10px]">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
      </button>

      {/* Language filter chips */}
      <div className="hidden lg:flex items-center gap-1.5" role="group" aria-label="Filter by language">
        <button
          onClick={() => onToggleLang('en')}
          aria-pressed={activeLangs.has('en')}
          className="l-en flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-metric font-bold transition-all border"
          style={{
            color: 'var(--en)',
            borderColor: 'color-mix(in srgb, var(--en) 40%, transparent)',
            backgroundColor: activeLangs.has('en') ? 'color-mix(in srgb, var(--en) 18%, transparent)' : 'transparent',
            opacity: activeLangs.has('en') ? 1 : 0.45,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--en)] inline-block shadow-[0_0_6px_var(--en)]" />
          EN
        </button>

        <button
          onClick={() => onToggleLang('ar')}
          aria-pressed={activeLangs.has('ar')}
          className="l-ar flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-metric font-bold transition-all border"
          style={{
            color: 'var(--ar)',
            borderColor: 'color-mix(in srgb, var(--ar) 40%, transparent)',
            backgroundColor: activeLangs.has('ar') ? 'color-mix(in srgb, var(--ar) 18%, transparent)' : 'transparent',
            opacity: activeLangs.has('ar') ? 1 : 0.45,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ar)] inline-block shadow-[0_0_6px_var(--ar)]" />
          AR
        </button>

        <button
          onClick={() => onToggleLang('de')}
          aria-pressed={activeLangs.has('de')}
          className="l-de flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-metric font-bold transition-all border"
          style={{
            color: 'var(--de)',
            borderColor: 'color-mix(in srgb, var(--de) 40%, transparent)',
            backgroundColor: activeLangs.has('de') ? 'color-mix(in srgb, var(--de) 18%, transparent)' : 'transparent',
            opacity: activeLangs.has('de') ? 1 : 0.45,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--de)] inline-block shadow-[0_0_6px_var(--de)]" />
          DE
        </button>
      </div>

      {/* Export Action */}
      <button
        onClick={onOpenExport}
        className="px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors hover:brightness-110"
        style={{
          backgroundColor: 'var(--sf2)',
          color: 'var(--tx)',
        }}
      >
        Export
      </button>

      {/* Streak & XP Gamification Pill */}
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full font-metric text-xs font-bold whitespace-nowrap shadow-sm"
        style={{
          backgroundColor: 'var(--sf2)',
        }}
      >
        <span>🔥</span>
        <span style={{ color: 'var(--rw)' }}>{streakDays}</span>
        <span className="text-[var(--mu)]">days ·</span>
        <span className="text-[var(--tx)]">{displayXp}</span>
        <span className="text-[var(--mu)] text-[10px]">XP</span>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={onToggleTheme}
        className="w-8 h-8 rounded-xl grid place-items-center text-sm font-bold transition-colors hover:bg-[var(--sf)]"
        style={{
          backgroundColor: 'var(--sf2)',
          color: 'var(--tx)',
        }}
        aria-label="Toggle Theme"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      >
        {theme === 'dark' ? '◐' : '☼'}
      </button>

      {/* User Avatar */}
      <div
        className="w-8 h-8 rounded-full grid place-items-center font-bold text-xs text-white shadow-sm"
        style={{
          backgroundColor: 'var(--br)',
        }}
        title="Sara's Profile"
      >
        S
      </div>
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { MindNode, PaletteItem, LanguageCode } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MindNode[];
  onSelectNode: (id: string) => void;
  onOpenStudy: () => void;
  onOpenComposer: () => void;
  onToggleTheme: () => void;
  onOpenMapsDirectory: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onSelectNode,
  onOpenStudy,
  onOpenComposer,
  onToggleTheme,
  onOpenMapsDirectory,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build items list
  const baseActions: PaletteItem[] = [
    {
      t: 'Start review session',
      k: 'Study',
      f: onOpenStudy,
    },
    {
      t: 'Add notes with Gemini AI',
      k: 'Action',
      f: onOpenComposer,
    },
    {
      t: 'Toggle theme (Dark / Light)',
      k: 'Action',
      f: onToggleTheme,
    },
    {
      t: 'Switch or create Mind Map',
      k: 'Maps',
      f: onOpenMapsDirectory,
    },
  ];

  const nodeItems: PaletteItem[] = nodes.map((n) => {
    const title = n.rows
      ? `${n.rows.de || ''} · ${n.rows.en || ''} · ${n.rows.ar || ''}`.replace(/^ · | · $/g, '')
      : n.label || 'Untitled';
    return {
      t: title,
      k: n.kind.toUpperCase(),
      l: n.lang,
      f: () => onSelectNode(n.id),
    };
  });

  const allItems = [...baseActions, ...nodeItems];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? allItems.filter(item => item.t.toLowerCase().includes(q) || item.k.toLowerCase().includes(q))
    : allItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => Math.min(filtered.length - 1, idx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => Math.max(0, idx - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filtered[selectedIndex];
      if (current) {
        onClose();
        current.f();
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm anim-bl"
    >
      <div
        className="w-full max-w-[560px] p-3 rounded-2xl border shadow-2xl flex flex-col gap-2"
        style={{
          backgroundColor: 'var(--sf)',
          borderColor: 'var(--bd)',
          color: 'var(--tx)',
        }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--sf2)] border border-[var(--bd)]">
          <Search size={16} className="text-[var(--mu)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            dir="auto"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes, translations, or actions…"
            className="w-full bg-transparent text-sm text-[var(--tx)] outline-none placeholder:text-[var(--mu)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[var(--mu)] hover:text-[var(--tx)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[340px] overflow-y-auto flex flex-col gap-1 py-1"
        >
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--mu)]">
              No matching star nodes or actions found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.k}_${idx}`}
                  onClick={() => {
                    onClose();
                    item.f();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[var(--sf2)] text-[var(--tx)] font-medium' : 'text-[var(--tx)]'
                  }`}
                >
                  <span
                    className={`bdg font-metric shrink-0 ${
                      item.l ? `l-${item.l}` : 'text-[var(--mu)] bg-[var(--sf2)]'
                    }`}
                  >
                    {item.k}
                  </span>
                  <span
                    dir="auto"
                    lang={item.l}
                    className={`flex-1 truncate ${item.l === 'ar' ? 'font-arabic text-[13px]' : ''}`}
                  >
                    {item.t}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between px-2 pt-1 border-t border-[var(--bd)] text-[11px] font-metric text-[var(--mu)]">
          <span>↑↓ navigate · ↵ select · Esc close</span>
          <span>{filtered.length} entries</span>
        </div>
      </div>
    </div>
  );
};

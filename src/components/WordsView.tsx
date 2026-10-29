import React, { useState } from 'react';
import { Search, Volume2, ArrowLeft, BookOpen, Sparkles, Edit2 } from 'lucide-react';
import { MindNode, LanguageCode } from '../types';
import { speak } from '../utils/speech';

interface WordsViewProps {
  nodes: MindNode[];
  onBackToMap: () => void;
  onOpenStudy: () => void;
  onEditNode: (id: string) => void;
}

export const WordsView: React.FC<WordsViewProps> = ({
  nodes,
  onBackToMap,
  onOpenStudy,
  onEditNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangFilter, setSelectedLangFilter] = useState<'all' | LanguageCode>('all');

  const vocabNodes = nodes.filter(n => !!n.rows);

  const filtered = vocabNodes.filter((n) => {
    const q = searchQuery.toLowerCase();
    const deMatch = n.rows?.de?.toLowerCase().includes(q);
    const enMatch = n.rows?.en?.toLowerCase().includes(q);
    const arMatch = n.rows?.ar?.toLowerCase().includes(q);
    const matchesSearch = !q || deMatch || enMatch || arMatch;

    const matchesLang =
      selectedLangFilter === 'all' || n.lang === selectedLangFilter;

    return matchesSearch && matchesLang;
  });

  return (
    <div className="absolute inset-0 top-14 overflow-y-auto p-4 sm:p-8 bg-[var(--bg)] text-[var(--tx)] flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--bd)]">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMap}
              className="w-9 h-9 rounded-xl grid place-items-center bg-[var(--sf2)] hover:bg-[var(--sf)] border border-[var(--bd)] transition-colors"
              title="Back to Constellation Map"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                <BookOpen size={20} className="text-[var(--br)]" />
                <span>Vocabulary Lexicon</span>
              </h1>
              <p className="text-xs text-[var(--mu)] font-metric">
                {vocabNodes.length} active word stars extracted across languages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStudy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 transition-colors"
              style={{
                backgroundColor: 'var(--br)',
                boxShadow: '0 0 16px -2px var(--br)',
              }}
            >
              <Sparkles size={14} />
              <span>Practice Flashcards</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--sf)] border border-[var(--bd)]">
            <Search size={14} className="text-[var(--mu)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words in German, English, Arabic..."
              className="w-full bg-transparent text-xs text-[var(--tx)] outline-none placeholder:text-[var(--mu)]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[var(--mu)] mr-1">Filter:</span>
            {(['all', 'de', 'en', 'ar'] as const).map((code) => (
              <button
                key={code}
                onClick={() => setSelectedLangFilter(code)}
                className={`px-3 py-1 rounded-full text-xs font-metric font-semibold border transition-all ${
                  selectedLangFilter === code
                    ? 'bg-[var(--br)] text-white border-[var(--br)]'
                    : 'bg-[var(--sf2)] text-[var(--mu)] border-[var(--bd)] hover:text-[var(--tx)]'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Vocabulary Grid / Table */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--sf)] border border-[var(--bd)] text-xs text-[var(--mu)]">
            No vocabulary matches found in this map.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const rows = item.rows || {};
              const boxNumber = item.box || 1;
              const mastery = item.mastery || 50;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border shadow-sm flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--sf)',
                    borderColor: 'var(--bd)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-metric px-2 py-0.5 rounded-full bg-[var(--sf2)] text-[var(--mu)]">
                      Leitner Box {boxNumber}
                    </span>
                    <button
                      onClick={() => onEditNode(item.id)}
                      className="text-[var(--mu)] hover:text-[var(--tx)] transition-colors p-1"
                      title="Edit word"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>

                  {/* Languages display */}
                  <div className="flex flex-col gap-2 my-1">
                    {/* German */}
                    {rows.de && (
                      <div className="flex items-center justify-between gap-2 l-de">
                        <span className="bdg font-metric">DE</span>
                        <span className="flex-1 font-bold text-base text-[var(--tx)]">
                          {rows.de}
                        </span>
                        <button
                          onClick={() => speak(rows.de || '', 'de')}
                          className="w-7 h-7 rounded-full grid place-items-center bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--de)] transition-colors"
                          title="Speak German"
                        >
                          <Volume2 size={13} />
                        </button>
                      </div>
                    )}

                    {/* English */}
                    {rows.en && (
                      <div className="flex items-center justify-between gap-2 l-en">
                        <span className="bdg font-metric">EN</span>
                        <span className="flex-1 text-sm font-medium text-[var(--tx)]">
                          {rows.en}
                        </span>
                        <button
                          onClick={() => speak(rows.en || '', 'en')}
                          className="w-7 h-7 rounded-full grid place-items-center bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--en)] transition-colors"
                          title="Speak English"
                        >
                          <Volume2 size={13} />
                        </button>
                      </div>
                    )}

                    {/* Arabic */}
                    {rows.ar && (
                      <div className="flex items-center justify-between gap-2 l-ar">
                        <span className="bdg font-metric">AR</span>
                        <span
                          dir="rtl"
                          lang="ar"
                          className="flex-1 font-arabic font-bold text-lg text-[var(--tx)]"
                        >
                          {rows.ar}
                        </span>
                        <button
                          onClick={() => speak(rows.ar || '', 'ar')}
                          className="w-7 h-7 rounded-full grid place-items-center bg-[var(--sf2)] hover:bg-[var(--sf)] text-[var(--ar)] transition-colors"
                          title="Speak Arabic"
                        >
                          <Volume2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="pt-2 border-t border-[var(--bd)] flex items-center justify-between text-[11px] font-metric text-[var(--mu)]">
                    <span>Mastery</span>
                    <span className="text-[var(--tx)] font-semibold">{mastery}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

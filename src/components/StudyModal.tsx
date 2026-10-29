import React, { useState, useEffect } from 'react';
import { X, Volume2, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { MindNode } from '../types';
import { speak } from '../utils/speech';

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: MindNode[];
  onCompleteSession: (knownCount: number, xpGained: number) => void;
  streakDays: number;
}

export const StudyModal: React.FC<StudyModalProps> = ({
  isOpen,
  onClose,
  cards,
  onCompleteSession,
  streakDays,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Filter only vocab nodes or nodes with rows
  const studyDeck = cards.filter(c => !!c.rows);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setKnownCount(0);
      setIsFinished(studyDeck.length === 0);
    }
  }, [isOpen, studyDeck.length]);

  if (!isOpen) return null;

  const currentCard = studyDeck[currentIndex];
  const progressPercent = studyDeck.length > 0 ? (currentIndex / studyDeck.length) * 100 : 100;

  const handleFlip = () => {
    setIsFlipped(f => !f);
  };

  const handleAnswer = (knewIt: boolean) => {
    if (isFinished) return;

    const nextKnown = knewIt ? knownCount + 1 : knownCount;
    if (knewIt) setKnownCount(nextKnown);

    const nextIdx = currentIndex + 1;
    if (nextIdx >= studyDeck.length) {
      setIsFinished(true);
      const xpEarned = nextKnown * 5;
      onCompleteSession(nextKnown, xpEarned);
    } else {
      setCurrentIndex(nextIdx);
      setIsFlipped(false);
    }
  };

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    } else if (e.key === '1') {
      e.preventDefault();
      handleAnswer(false);
    } else if (e.key === '2') {
      e.preventDefault();
      handleAnswer(true);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/75 backdrop-blur-md anim-bl outline-none"
    >
      <div className="w-full max-w-[560px] flex flex-col items-center gap-5">
        {/* Top bar with count & streak */}
        <div className="w-full flex items-center justify-between text-xs text-[var(--mu)] font-medium">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
          >
            <X size={18} />
          </button>

          <span className="font-metric text-sm font-bold text-[var(--tx)]">
            {isFinished ? 'Session Complete' : `${currentIndex + 1} / ${studyDeck.length}`}
          </span>

          <span className="font-metric font-semibold flex items-center gap-1 text-[var(--rw)] bg-[var(--sf2)] px-2.5 py-1 rounded-full border border-[var(--bd)]">
            🔥 {streakDays} days
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--sf2)] border border-[var(--bd)]">
          <div
            className="h-full bg-[var(--br)] transition-all duration-300"
            style={{ width: `${isFinished ? 100 : progressPercent}%` }}
          />
        </div>

        {/* Flashcard Body */}
        {!isFinished && currentCard && currentCard.rows ? (
          <>
            <div
              onClick={handleFlip}
              className={`flip-card w-full max-w-[420px] h-[270px] cursor-pointer select-none ${
                isFlipped ? 'flipped' : ''
              }`}
            >
              <div className="flip-card-inner">
                {/* Front Side */}
                <div
                  className="flip-card-front p-6 flex flex-col items-center justify-center gap-3 border shadow-2xl"
                  style={{
                    backgroundColor: 'var(--sf)',
                    borderColor: 'var(--bd)',
                  }}
                >
                  <span className="bdg l-de font-metric">DE</span>

                  <div
                    lang="de"
                    className="font-extrabold text-3xl sm:text-4xl text-[var(--tx)] tracking-tight text-center my-1"
                  >
                    {currentCard.rows.de || '—'}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentCard.rows?.de || '', 'de');
                    }}
                    className="w-9 h-9 rounded-full grid place-items-center text-[var(--de)] bg-[var(--sf2)] hover:bg-[var(--sf)] border border-[var(--bd)] shadow-sm transition-transform hover:scale-110"
                    title="Pronounce"
                  >
                    <Volume2 size={16} />
                  </button>

                  <span className="text-[11px] text-[var(--mu)] font-medium mt-2">
                    Tap card or press <kbd>Space</kbd> to flip
                  </span>
                </div>

                {/* Back Side */}
                <div
                  className="flip-card-back p-6 flex flex-col items-center justify-center gap-4 border shadow-2xl"
                  style={{
                    backgroundColor: 'var(--sf)',
                    borderColor: 'var(--bd)',
                  }}
                >
                  {/* English row */}
                  {currentCard.rows.en && (
                    <div className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] l-en">
                      <span className="bdg font-metric">EN</span>
                      <span className="flex-1 text-center font-bold text-lg text-[var(--tx)]">
                        {currentCard.rows.en}
                      </span>
                    </div>
                  )}

                  {/* Arabic row */}
                  {currentCard.rows.ar && (
                    <div className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] l-ar">
                      <span className="bdg font-metric">AR</span>
                      <span
                        dir="rtl"
                        lang="ar"
                        className="flex-1 text-center font-arabic font-bold text-2xl text-[var(--tx)]"
                      >
                        {currentCard.rows.ar}
                      </span>
                    </div>
                  )}

                  <span className="text-[11px] text-[var(--mu)] font-medium">
                    Did you know this word?
                  </span>
                </div>
              </div>
            </div>

            {/* Answer Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAnswer(false)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-semibold text-[var(--tx)] bg-[var(--sf2)] hover:brightness-110 border border-[var(--bd)] shadow-md transition-all active:scale-95"
              >
                <RotateCcw size={14} className="text-[var(--rw)]" />
                <span>Review again</span>
                <kbd className="text-[9px]">1</kbd>
              </button>

              <button
                onClick={() => handleAnswer(true)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: 'var(--br)',
                  boxShadow: '0 0 16px -2px var(--br)',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Knew it</span>
                <kbd className="text-[9px] bg-white/20 text-white">2</kbd>
              </button>
            </div>
          </>
        ) : (
          /* Finished summary */
          <div
            className="w-full max-w-[420px] p-8 rounded-3xl border shadow-2xl flex flex-col items-center gap-4 text-center anim-bl"
            style={{
              backgroundColor: 'var(--sf)',
              borderColor: 'var(--bd)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full grid place-items-center text-white shadow-lg"
              style={{
                backgroundColor: 'var(--br)',
                boxShadow: '0 0 24px -2px var(--br)',
              }}
            >
              <Sparkles size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--tx)]">Nice session!</h2>
              <p className="text-xs text-[var(--mu)] mt-1 font-metric">
                {knownCount} / {studyDeck.length} known · +{knownCount * 5} XP earned
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:brightness-110 transition-colors mt-2"
              style={{
                backgroundColor: 'var(--br)',
              }}
            >
              Back to map
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

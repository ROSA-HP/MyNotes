import { Progress, NodePage } from '../../shared';

const BOX_INTERVALS: Record<number, number> = {
  1: 1,   // 1 day
  2: 3,   // 3 days
  3: 7,   // 7 days
  4: 14,  // 14 days
  5: 30,  // 30 days
};

export interface ReviewResult {
  updatedProgress: Progress;
  xpEarned: number;
}

export function initializeProgress(mapId: string, nodeId: string): Progress {
  return {
    id: `prog_${nodeId}`,
    mapId,
    nodeId,
    box: 1,
    intervalDays: BOX_INTERVALS[1],
    easeFactor: 2.5,
    repetitions: 0,
    dueAt: new Date().toISOString(),
    lastReviewedAt: null,
    reviewsCount: 0,
    lapsesCount: 0,
  };
}

export function processCardReview(
  current: Progress,
  knewIt: boolean
): ReviewResult {
  const now = new Date();
  let nextBox = current.box;
  let nextInterval = current.intervalDays;
  let nextEase = current.easeFactor;
  let nextLapses = current.lapsesCount;
  let nextReps = current.repetitions;
  let xpEarned = 0;

  if (knewIt) {
    nextBox = Math.min(5, current.box + 1);
    nextInterval = BOX_INTERVALS[nextBox] || Math.round(current.intervalDays * current.easeFactor);
    nextEase = Math.min(3.0, current.easeFactor + 0.1);
    nextReps = current.repetitions + 1;
    xpEarned = nextBox * 5; // e.g., Box 2 = 10 XP, Box 5 = 25 XP
  } else {
    nextBox = 1;
    nextInterval = 1;
    nextEase = Math.max(1.3, current.easeFactor - 0.2);
    nextLapses = current.lapsesCount + 1;
    nextReps = 0;
    xpEarned = 1; // encouragement XP
  }

  const dueDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  const updatedProgress: Progress = {
    ...current,
    box: nextBox,
    intervalDays: nextInterval,
    easeFactor: Number(nextEase.toFixed(2)),
    repetitions: nextReps,
    dueAt: dueDate.toISOString(),
    lastReviewedAt: now.toISOString(),
    reviewsCount: current.reviewsCount + 1,
    lapsesCount: nextLapses,
  };

  return {
    updatedProgress,
    xpEarned,
  };
}

export function isCardDue(progress: Progress): boolean {
  return new Date(progress.dueAt).getTime() <= Date.now();
}

/**
 * Extracts or generates flashcards for a NodePage if not explicitly set
 */
export function ensureNodeFlashcards(node: NodePage): NodePage {
  if (node.flashcards && node.flashcards.length > 0) {
    return node;
  }

  const flashcards = [];

  if (node.rows) {
    // Vocab card
    const front = node.rows.de || node.rows.ar || node.title;
    const backParts = [];
    if (node.rows.en) backParts.push(`EN: ${node.rows.en}`);
    if (node.rows.ar && node.rows.ar !== front) backParts.push(`AR: ${node.rows.ar}`);
    if (node.rows.de && node.rows.de !== front) backParts.push(`DE: ${node.rows.de}`);

    flashcards.push({
      id: `fc_${node.id}`,
      front,
      back: backParts.join(' · ') || node.summary || 'Word translation',
      notes: (node.tags || []).join(', '),
    });
  } else if (node.title) {
    // Concept / Rule card
    flashcards.push({
      id: `fc_${node.id}`,
      front: node.title,
      back: node.summary || node.content.slice(0, 140) || 'Concept rule',
      notes: node.kind,
    });
  }

  return {
    ...node,
    flashcards,
  };
}

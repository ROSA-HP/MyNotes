import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/store';
import { processCardReview, initializeProgress, isCardDue } from '../services/cardsService';

const router = Router();

// GET map study & retention progress
router.get(
  '/:id/progress',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapId = req.params.id;
      const map = await dbStore.getMap(mapId);
      if (!map) {
        return res.status(404).json({ error: 'Map not found' });
      }

      const allProgress = await dbStore.getProgressByMap(mapId);
      const nodes = await dbStore.getNodesByMap(mapId);

      const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let dueCount = 0;

      for (const p of allProgress) {
        const box = (p.box >= 1 && p.box <= 5 ? p.box : 1) as 1 | 2 | 3 | 4 | 5;
        boxCounts[box]++;
        if (isCardDue(p)) {
          dueCount++;
        }
      }

      const masteredCount = boxCounts[5];
      const totalCards = allProgress.length;
      const masteryRate = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

      res.json({
        mapId,
        streakDays: map.streakDays,
        xp: map.xp,
        totalNodes: nodes.length,
        totalTrackedCards: totalCards,
        masteredCount,
        masteryRate,
        dueCount,
        boxBreakdown: boxCounts,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET due cards for study session
router.get(
  '/:id/study/due',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapId = req.params.id;
      const nodes = await dbStore.getNodesByMap(mapId);
      const allProgress = await dbStore.getProgressByMap(mapId);

      const progressMap = new Map<string, any>();
      allProgress.forEach(p => progressMap.set(p.nodeId, p));

      // Find due cards or uninitialized cards
      const dueNodes: any[] = [];
      for (const node of nodes) {
        if (!node.rows && (!node.flashcards || node.flashcards.length === 0)) {
          continue; // skip non-study nodes
        }

        let p = progressMap.get(node.id);
        if (!p) {
          p = initializeProgress(mapId, node.id);
          await dbStore.saveProgress(p);
        }

        if (isCardDue(p)) {
          dueNodes.push({
            node,
            progress: p,
          });
        }
      }

      res.json({
        mapId,
        dueCount: dueNodes.length,
        dueItems: dueNodes,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST submit review response
router.post(
  '/:id/study/review',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapId = req.params.id;
      const { nodeId, knewIt } = req.body;

      if (!nodeId || typeof knewIt !== 'boolean') {
        return res.status(400).json({ error: 'nodeId (string) and knewIt (boolean) are required' });
      }

      const map = await dbStore.getMap(mapId);
      if (!map) {
        return res.status(404).json({ error: 'Map not found' });
      }

      let progress = await dbStore.getProgressByNode(nodeId);
      if (!progress) {
        progress = initializeProgress(mapId, nodeId);
      }

      const reviewResult = processCardReview(progress, knewIt);
      await dbStore.saveProgress(reviewResult.updatedProgress);

      // Award XP to Map
      map.xp += reviewResult.xpEarned;
      map.updatedAt = new Date().toISOString();
      await dbStore.saveMap(map);

      res.json({
        success: true,
        progress: reviewResult.updatedProgress,
        xpEarned: reviewResult.xpEarned,
        totalXp: map.xp,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const progressRouter = router;

import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/store';
import { preParseText } from '../services/preParser';
import { callGeminiSynthesizer } from '../services/gemini';
import { mergeExtractedNodes } from '../services/mergeService';
import { ensureNodeFlashcards, initializeProgress } from '../services/cardsService';
import { Ingestion, IngestionSchema } from '../../shared';
import { rateLimitMiddleware } from '../middleware';

const router = Router();

// Ingestion rate limit: max 20 ingestion calls per minute per session
router.post(
  '/:id/ingest',
  rateLimitMiddleware(20),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapId = req.params.id;
      const map = await dbStore.getMap(mapId);
      if (!map) {
        return res.status(404).json({ error: 'Map not found' });
      }

      const { rawText, mode = 'Auto', anchorNodeId } = req.body;
      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({ error: 'rawText must be a non-empty string' });
      }

      // 1. Run Pre-Parser
      const preParsed = preParseText(rawText);

      // Determine anchor node
      const existingNodes = await dbStore.getNodesByMap(mapId);
      const anchorNode = anchorNodeId
        ? existingNodes.find(n => n.id === anchorNodeId) || existingNodes[0]
        : existingNodes[0];

      const anchorTitle = anchorNode ? anchorNode.title : map.title;

      // 2. Create Ingestion log entry
      const ingestionId = `ing_${Date.now()}`;
      const ingestionRecord: Ingestion = {
        id: ingestionId,
        mapId,
        rawText,
        mode,
        status: 'processing',
        detectedLanguages: preParsed.languages,
        extractedCount: 0,
        createdNodeIds: [],
        createdAt: new Date().toISOString(),
      };
      IngestionSchema.parse(ingestionRecord);
      await dbStore.saveIngestion(ingestionRecord);

      // 3. Call Gemini Synthesizer Service
      const geminiResponse = await callGeminiSynthesizer(
        preParsed.cleanedText,
        mode as 'Auto' | 'Grammar' | 'Vocabulary only',
        anchorTitle
      );

      // 4. Run Merge Service
      const mergeResult = mergeExtractedNodes(
        existingNodes,
        geminiResponse.nodes,
        geminiResponse.edges,
        map.rootNodeId,
        {
          defaultMapId: mapId,
          inboxNodeId: map.rootNodeId,
        }
      );

      // 5. Ensure flashcards & initialize progress for created nodes
      for (const node of mergeResult.allNodes) {
        const enrichedNode = ensureNodeFlashcards(node);
        await dbStore.saveNode(enrichedNode);

        if (mergeResult.createdNodeIds.includes(node.id)) {
          const progress = initializeProgress(mapId, node.id);
          await dbStore.saveProgress(progress);
        }
      }

      // 6. Award XP and update Map
      map.xp += 10;
      map.version += 1;
      map.updatedAt = new Date().toISOString();
      await dbStore.saveMap(map);

      // 7. Complete Ingestion Record
      ingestionRecord.status = 'completed';
      ingestionRecord.extractedCount = geminiResponse.nodes.length;
      ingestionRecord.createdNodeIds = mergeResult.createdNodeIds;
      await dbStore.saveIngestion(ingestionRecord);

      res.status(200).json({
        success: true,
        ingestionId,
        stats: {
          charCount: preParsed.charCount,
          languages: preParsed.languages,
          extracted: geminiResponse.nodes.length,
          created: mergeResult.createdNodeIds.length,
          reused: mergeResult.reusedNodeIds.length,
        },
        nodes: mergeResult.allNodes,
        edges: mergeResult.edges,
        createdNodeIds: mergeResult.createdNodeIds,
        reusedNodeIds: mergeResult.reusedNodeIds,
        map,
      });
    } catch (err: any) {
      next(err);
    }
  }
);

export const ingestRouter = router;

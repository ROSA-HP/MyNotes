import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/store';
import { executeNodeTool, NodeToolAction } from '../services/nodeToolsService';
import { suggestCrossLinks } from '../services/suggestLinksService';
import { mergeExtractedNodes } from '../services/mergeService';
import { CompactNode } from '../../shared';

const router = Router();

// POST on-demand node tools: expand, examples, explain, drill
router.post(
  '/:id/nodes/:nodeId/tools',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: mapId, nodeId } = req.params;
      const node = await dbStore.getNode(nodeId);
      if (!node || node.mapId !== mapId) {
        return res.status(404).json({ error: 'Node not found' });
      }

      const action = req.body.action as NodeToolAction;
      if (!action || !['expand', 'examples', 'explain', 'drill'].includes(action)) {
        return res.status(400).json({ error: 'Valid action required: expand, examples, explain, drill' });
      }

      const targetLang = req.body.targetLang || 'en';
      const result = await executeNodeTool(node, action, targetLang);

      // If expand generated new children, merge them into the map!
      if (action === 'expand' && result.createdChildren && result.createdChildren.length > 0) {
        const existingNodes = await dbStore.getNodesByMap(mapId);
        const mergeResult = mergeExtractedNodes(
          existingNodes,
          result.createdChildren,
          [],
          node.id,
          { defaultMapId: mapId }
        );

        for (const n of mergeResult.allNodes) {
          await dbStore.saveNode(n);
        }

        return res.json({
          ...result,
          updatedNodes: mergeResult.allNodes,
          createdNodeIds: mergeResult.createdNodeIds,
        });
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST suggest-links: sends only compact nodes and returns max 8 relations
router.post(
  '/:id/suggest-links',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapId = req.params.id;
      const nodes = await dbStore.getNodesByMap(mapId);
      if (nodes.length < 2) {
        return res.json({ relations: [] });
      }

      // Compact nodes: id, title, kind, lang only!
      const compactNodes: CompactNode[] = nodes.map(n => ({
        id: n.id,
        title: n.title,
        kind: n.kind,
        lang: n.lang,
      }));

      const suggestions = await suggestCrossLinks(compactNodes);
      res.json(suggestions);
    } catch (err) {
      next(err);
    }
  }
);

export const toolsRouter = router;

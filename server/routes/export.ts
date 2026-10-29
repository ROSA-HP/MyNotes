import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/store';
import { exportMindMap } from '../services/exportService';

const router = Router();

router.get(
  '/:id/export',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapId = req.params.id;
      const map = await dbStore.getMap(mapId);
      if (!map) {
        return res.status(404).json({ error: 'Map not found' });
      }

      const format = (req.query.format as string || 'json').toLowerCase();
      if (!['json', 'md', 'anki'].includes(format)) {
        return res.status(400).json({ error: 'Format must be one of: json, md, anki' });
      }

      const nodes = await dbStore.getNodesByMap(mapId);
      const edges: Array<[string, string]> = [];
      nodes.forEach(n => {
        if (n.parentId) edges.push([n.parentId, n.id]);
      });

      const exported = exportMindMap(
        map,
        nodes,
        edges,
        format as 'json' | 'md' | 'anki'
      );

      res.setHeader('Content-Type', exported.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exported.filename}"`
      );
      res.send(exported.content);
    } catch (err) {
      next(err);
    }
  }
);

export const exportRouter = router;

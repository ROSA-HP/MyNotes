import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/store';
import { MindMap, NodePage, MindMapSchema, NodePageSchema } from '../../shared';
import { ConflictError } from '../middleware';

const router = Router();

// GET all maps
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const maps = await dbStore.getAllMaps();
    res.json({ maps });
  } catch (err) {
    next(err);
  }
});

// POST create map
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const title = (req.body.title || 'Untitled Map').trim();
    const mapId = `map_${Date.now()}`;
    const rootNodeId = `root_${Date.now()}`;

    const rootNode: NodePage = {
      id: rootNodeId,
      mapId,
      title,
      kind: 'topic',
      lang: req.body.lang || 'de',
      summary: 'Central anchor star of this constellation map',
      content: `# ${title}\n\nAnchor topic for multilingual notes and concepts.`,
      flashcards: [],
      tags: ['root'],
      parentId: null,
      childIds: [],
      depth: 0,
      order: 0,
      position: { x: 50, y: 250 },
      dismissedTitles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newMap: MindMap = {
      id: mapId,
      title,
      description: req.body.description || '',
      rootNodeId,
      activeLanguages: ['de', 'en', 'ar'],
      streakDays: 1,
      xp: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MindMapSchema.parse(newMap);
    NodePageSchema.parse(rootNode);

    await dbStore.saveNode(rootNode);
    await dbStore.saveMap(newMap);

    res.status(201).json({ map: newMap, rootNode });
  } catch (err) {
    next(err);
  }
});

// GET specific map
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const map = await dbStore.getMap(req.params.id);
    if (!map) {
      return res.status(404).json({ error: 'Map not found' });
    }
    const nodes = await dbStore.getNodesByMap(req.params.id);

    // Build edges from parentId
    const edges: Array<[string, string]> = [];
    nodes.forEach(n => {
      if (n.parentId) edges.push([n.parentId, n.id]);
    });

    res.json({ map, nodes, edges });
  } catch (err) {
    next(err);
  }
});

const updateMapHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await dbStore.getMap(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Map not found' });
    }

    // 409 Conflict Check if client provided version
    if (req.body.version !== undefined && req.body.version !== existing.version) {
      throw new ConflictError(
        `Map version conflict: client has ${req.body.version}, server has ${existing.version}`
      );
    }

    const updated: MindMap = {
      ...existing,
      title: req.body.title !== undefined ? req.body.title : existing.title,
      description: req.body.description !== undefined ? req.body.description : existing.description,
      streakDays: req.body.streakDays !== undefined ? req.body.streakDays : existing.streakDays,
      xp: req.body.xp !== undefined ? req.body.xp : existing.xp,
      activeLanguages: req.body.activeLanguages || existing.activeLanguages,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    await dbStore.saveMap(updated);

    // If client supplied nodes (e.g. from debounced full map PUT)
    if (req.body.nodes && Array.isArray(req.body.nodes)) {
      for (const nodeData of req.body.nodes) {
        await dbStore.saveNode({
          ...nodeData,
          mapId: updated.id,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    res.json({ map: updated });
  } catch (err) {
    next(err);
  }
};

router.patch('/:id', updateMapHandler);
router.put('/:id', updateMapHandler);

// DELETE map
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await dbStore.getMap(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Map not found' });
    }
    await dbStore.deleteMap(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// GET nodes for map
router.get('/:id/nodes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nodes = await dbStore.getNodesByMap(req.params.id);
    res.json({ nodes });
  } catch (err) {
    next(err);
  }
});

// POST create node
router.post('/:id/nodes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const map = await dbStore.getMap(req.params.id);
    if (!map) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const parentId = req.body.parentId || map.rootNodeId;
    const parentNode = await dbStore.getNode(parentId);

    const nodeId = req.body.id || `node_${Date.now()}`;
    const newNode: NodePage = {
      id: nodeId,
      mapId: map.id,
      title: req.body.title || 'Untitled Node',
      kind: req.body.kind || 'concept',
      lang: req.body.lang || (parentNode?.lang || 'de'),
      summary: req.body.summary || '',
      content: req.body.content || '',
      rows: req.body.rows,
      flashcards: req.body.flashcards || [],
      tags: req.body.tags || [],
      parentId,
      childIds: [],
      depth: parentNode ? parentNode.depth + 1 : 1,
      order: req.body.order || 0,
      position: req.body.position || {
        x: (parentNode?.position.x || 50) + 320,
        y: (parentNode?.position.y || 250) + 80,
      },
      dismissedTitles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    NodePageSchema.parse(newNode);
    await dbStore.saveNode(newNode);

    if (parentNode && !parentNode.childIds.includes(nodeId)) {
      parentNode.childIds.push(nodeId);
      await dbStore.saveNode(parentNode);
    }

    res.status(201).json({ node: newNode });
  } catch (err) {
    next(err);
  }
});

// GET specific node
router.get('/:id/nodes/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const node = await dbStore.getNode(req.params.nodeId);
    if (!node || node.mapId !== req.params.id) {
      return res.status(404).json({ error: 'Node not found' });
    }
    res.json({ node });
  } catch (err) {
    next(err);
  }
});

// PATCH update node
router.patch('/:id/nodes/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const node = await dbStore.getNode(req.params.nodeId);
    if (!node || node.mapId !== req.params.id) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const updatedNode: NodePage = {
      ...node,
      title: req.body.title !== undefined ? req.body.title : node.title,
      kind: req.body.kind !== undefined ? req.body.kind : node.kind,
      lang: req.body.lang !== undefined ? req.body.lang : node.lang,
      summary: req.body.summary !== undefined ? req.body.summary : node.summary,
      content: req.body.content !== undefined ? req.body.content : node.content,
      rows: req.body.rows !== undefined ? req.body.rows : node.rows,
      tags: req.body.tags !== undefined ? req.body.tags : node.tags,
      position: req.body.position !== undefined ? req.body.position : node.position,
      flashcards: req.body.flashcards !== undefined ? req.body.flashcards : node.flashcards,
      dismissedTitles: req.body.dismissedTitles !== undefined ? req.body.dismissedTitles : node.dismissedTitles,
      updatedAt: new Date().toISOString(),
    };

    await dbStore.saveNode(updatedNode);
    res.json({ node: updatedNode });
  } catch (err) {
    next(err);
  }
});

// DELETE node
router.delete('/:id/nodes/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const node = await dbStore.getNode(req.params.nodeId);
    if (!node || node.mapId !== req.params.id) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Add title to dismissedTitles of parent so it won't be re-created on subsequent merges
    if (node.parentId) {
      const parent = await dbStore.getNode(node.parentId);
      if (parent) {
        parent.dismissedTitles = Array.from(new Set([...parent.dismissedTitles, node.title]));
        parent.childIds = parent.childIds.filter(cid => cid !== node.id);
        await dbStore.saveNode(parent);
      }
    }

    await dbStore.deleteNode(node.id);
    res.json({ success: true, id: node.id });
  } catch (err) {
    next(err);
  }
});

export const mapsRouter = router;

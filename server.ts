import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './server/config';
import { connectDB } from './server/db/connection';
import { sessionIdMiddleware, errorHandlerMiddleware } from './server/middleware';
import { apiRouter } from './server/routes';
import { dbStore } from './server/db/store';
import { DEFAULT_MAPS } from './src/data/defaultMaps';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = CONFIG.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(sessionIdMiddleware);

// Initialize DB and seed default map if empty
async function initializeServer() {
  await connectDB();

  // Seed default maps if none exist
  const existing = await dbStore.getAllMaps();
  if (existing.length === 0) {
    for (const dm of DEFAULT_MAPS) {
      await dbStore.saveMap({
        id: dm.id,
        title: dm.title,
        description: dm.subtitle || '',
        rootNodeId: dm.nodes[0]?.id || 'root',
        activeLanguages: ['de', 'en', 'ar'],
        streakDays: dm.streakDays,
        xp: dm.xp,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      for (const n of dm.nodes) {
        // Find parent if edge exists
        const edge = dm.edges.find(e => e[1] === n.id);
        const parentId = edge ? edge[0] : null;

        await dbStore.saveNode({
          id: n.id,
          mapId: dm.id,
          title: n.rows ? (n.rows.de || n.rows.en || n.label || 'Word') : (n.label || 'Node'),
          kind: n.kind,
          lang: n.lang,
          summary: n.desc || '',
          content: n.desc || '',
          rows: n.rows,
          flashcards: [],
          tags: n.foot || [],
          parentId,
          childIds: dm.edges.filter(e => e[0] === n.id).map(e => e[1]),
          depth: parentId ? 1 : 0,
          order: 0,
          position: { x: n.x, y: n.y },
          dismissedTitles: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    console.log('Seeded default mind maps into repository.');
  }
}

// Mount full API router
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandlerMiddleware);

// Setup Vite in Dev or static in Prod
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

initializeServer().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`MindLex Master Backend running on http://localhost:${port}`);
  });
});

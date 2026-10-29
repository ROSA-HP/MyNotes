import { Router } from 'express';
import { mapsRouter } from './maps';
import { ingestRouter } from './ingest';
import { toolsRouter } from './tools';
import { exportRouter } from './export';
import { progressRouter } from './progress';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MindLex Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routers
apiRouter.use('/maps', mapsRouter);
apiRouter.use('/maps', ingestRouter);
apiRouter.use('/maps', toolsRouter);
apiRouter.use('/maps', exportRouter);
apiRouter.use('/maps', progressRouter);

import express, { Express } from 'express';
import { setupMiddleware } from './middleware';
import { apiRouter } from './routes';
import { setupViteOrStatic } from './vite';

export async function createApp(): Promise<Express> {
  const app = express();

  // Setup body parsing middleware
  setupMiddleware(app);

  // Mount API routes under /api
  app.use('/api', apiRouter);

  // Setup Vite dev server middleware or static distribution handling
  await setupViteOrStatic(app);

  return app;
}

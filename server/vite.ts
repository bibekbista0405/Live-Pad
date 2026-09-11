import express, { Express } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './config';

export async function setupViteOrStatic(app: Express) {
  if (config.nodeEnv !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

import express, { Express } from 'express';
import { requestSecurity, validateBodySize } from './security';

export function setupMiddleware(app: Express) {
  app.disable('x-powered-by');
  app.use(requestSecurity);
  app.use(validateBodySize);
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
}

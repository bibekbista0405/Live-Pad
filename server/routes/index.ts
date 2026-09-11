import { Router } from 'express';
import { healthRouter } from './health';
import { aiRouter } from './ai';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(aiRouter);

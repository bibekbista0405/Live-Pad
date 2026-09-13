import { Router } from 'express';
import { healthRouter } from './health';
import { aiRouter } from './ai';
import { authRouter } from './auth';
import { roomsRouter } from './rooms';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(aiRouter);
apiRouter.use(authRouter);
apiRouter.use(roomsRouter);

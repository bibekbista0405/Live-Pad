import { Router } from 'express';
import { hasGeminiKey } from '../services/gemini';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: hasGeminiKey() });
});

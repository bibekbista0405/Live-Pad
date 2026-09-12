import { Router } from 'express';
import { requireAuth } from '../middleware/security';
import { transcribeAudio, cleanupDictation, generateCopilotResponse, hasGeminiKey } from '../services/gemini';

export const aiRouter = Router();

// Multimodal Gemini AI Speech Transcription
aiRouter.post('/dictation/transcribe', requireAuth, async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'en-US', smartPunctuation = true } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 data' });
    }

    if (!hasGeminiKey()) {
      return res.status(503).json({ error: 'Gemini API key is not configured on server' });
    }

    const result = await transcribeAudio({ audioBase64, mimeType, language, smartPunctuation });
    return res.json(result);
  } catch (err: any) {
    console.error('[Server /api/dictation/transcribe Error]:', err);
    return res.status(500).json({ error: err.message || 'Transcription failed' });
  }
});

// AI Grammar & Punctuation Cleanup Route
aiRouter.post('/dictation/cleanup', requireAuth, async (req, res) => {
  try {
    const { text, language = 'en-US' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text content' });
    }

    if (!hasGeminiKey()) {
      return res.status(503).json({ error: 'Gemini API key is not configured on server' });
    }

    const result = await cleanupDictation({ text, language });
    return res.json(result);
  } catch (err: any) {
    console.error('[Server /api/dictation/cleanup Error]:', err);
    return res.status(500).json({ error: err.message || 'Cleanup failed' });
  }
});

// Whisper API Proxy Fallback Route
aiRouter.post('/dictation/whisper', requireAuth, (req, res) => {
  return res.status(501).json({ error: 'Whisper fallback route. Use Gemini AI or Browser Speech engine.' });
});

// Workspace-aware AI Copilot
aiRouter.post('/ai/copilot', requireAuth, async (req, res) => {
  try {
    const { prompt, activeFile, files } = req.body;
    if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Missing prompt' });
    if (!hasGeminiKey()) return res.status(503).json({ error: 'Gemini API key is not configured on server' });
    const safeFiles = Array.isArray(files) ? files.slice(0, 30) : [];
    const result = await generateCopilotResponse({ prompt: prompt.slice(0, 12000), activeFile, files: safeFiles });
    return res.json(result);
  } catch (err: any) {
    console.error('[Server /api/ai/copilot Error]:', err);
    return res.status(500).json({ error: err?.message || 'AI Copilot request failed' });
  }
});

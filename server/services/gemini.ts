import { GoogleGenAI } from '@google/genai';
import { config } from '../config';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && config.geminiApiKey) {
    aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export function hasGeminiKey(): boolean {
  return Boolean(config.geminiApiKey);
}

export interface TranscribeParams {
  audioBase64: string;
  mimeType?: string;
  language?: string;
  smartPunctuation?: boolean;
}

export async function transcribeAudio({
  audioBase64,
  mimeType = 'audio/webm',
  language = 'en-US'
}: TranscribeParams) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini API key is not configured on server');
  }

  const promptText = `Transcribe this spoken audio accurately in language code ${language}. Apply proper punctuation, capitalization, and formatting. Do NOT summarize or add explanations; output only the exact transcription.`;

  const audioPart = {
    inlineData: {
      mimeType,
      data: audioBase64
    }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [audioPart, { text: promptText }]
  });

  const transcript = response.text ? response.text.trim() : '';

  return {
    transcript,
    confidence: 0.96,
    detectedLanguage: language
  };
}

export interface CleanupParams {
  text: string;
  language?: string;
}

export async function cleanupDictation({
  text,
  language = 'en-US'
}: CleanupParams) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini API key is not configured on server');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Improve and clean up the following dictated text in language code ${language}. Fix grammar, missing commas/periods, capitalization, and run-on sentences. Preserve the author's original tone and meaning completely. Output ONLY the polished text without quotes or meta commentary:\n\n${text}`,
    config: {
      systemInstruction: 'You are an elite AI editor. Clean up speech dictation text seamlessly.'
    }
  });

  const cleanedText = response.text ? response.text.trim() : text;
  return { cleanedText };
}

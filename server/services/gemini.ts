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

export interface CopilotParams {
  prompt: string;
  activeFile?: { name: string; language?: string; content?: string } | null;
  files?: Array<{ name: string; language?: string; path?: string; content?: string }>;
}

export async function generateCopilotResponse({ prompt, activeFile, files = [] }: CopilotParams) {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Gemini API key is not configured on server');

  const workspaceContext = files.slice(0, 30).map((file) =>
    `FILE: ${file.path || file.name}\nLANGUAGE: ${file.language || 'unknown'}\n${(file.content || '').slice(0, 12000)}`
  ).join('\n\n');
  const activeContext = activeFile
    ? `ACTIVE FILE: ${activeFile.name}\nLANGUAGE: ${activeFile.language || 'unknown'}\n${(activeFile.content || '').slice(0, 20000)}`
    : 'No active file is open.';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: `You are LivePad AI Copilot, a practical senior software engineer. Answer the user's request using the supplied workspace context. Never claim to have changed a file unless the response only proposes a patch. Prefer concrete, compilable code. If asked to refactor or fix code, return the proposed code in one fenced block and briefly explain the important changes. If the request is explanatory, do not invent facts about code that is not present.\n\nUSER REQUEST:\n${prompt}\n\n${activeContext}\n\nWORKSPACE CONTEXT:\n${workspaceContext || 'No additional workspace files were supplied.'}` }
    ],
    config: { systemInstruction: 'Be precise, security-conscious, and honest about what you can actually execute. Do not fabricate test results, APIs, files, or successful changes.' }
  });

  return { text: response.text?.trim() || 'Gemini returned an empty response.' };
}

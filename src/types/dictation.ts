export type DictationProviderId = 'browser' | 'gemini' | 'whisper' | 'deepgram' | 'azure' | 'google_cloud';

export type DictationState = 'idle' | 'listening' | 'paused' | 'processing' | 'error';

export interface DictationLanguage {
  code: string; // e.g. 'en-US'
  name: string; // e.g. 'English (United States)'
  nativeName: string; // e.g. 'English'
  flag?: string; // e.g. '🇺🇸'
  region?: string;
}

export interface WordConfidence {
  word: string;
  confidence: number; // 0.0 to 1.0
  isLowConfidence?: boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  interimTranscript: string;
  isFinal: boolean;
  confidence: number; // 0.0 to 1.0
  language?: string;
  words?: WordConfidence[];
  detectedLanguage?: string;
}

export interface DictationOptions {
  providerId: DictationProviderId;
  language: string;
  autoDetectLanguage: boolean;
  continuous: boolean;
  smartPunctuation: boolean;
  voiceCommands: boolean;
  noiseSuppression: boolean;
  aiGrammarCleanup: boolean;
  livePreview: boolean;
  confidenceHighlighting: boolean;
  confidenceThreshold: number; // e.g. 0.8
  microphoneDeviceId?: string;
}

export interface VoiceCommandMatch {
  command: string;
  type: 
    | 'new_line'
    | 'new_paragraph'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'heading_1'
    | 'heading_2'
    | 'bullet_list'
    | 'number_list'
    | 'insert_checkbox'
    | 'insert_code'
    | 'start_quote'
    | 'undo'
    | 'redo'
    | 'delete_sentence'
    | 'remove_last_word'
    | 'select_paragraph'
    | 'capitalize'
    | 'lowercase'
    | 'replace';
  params?: { [key: string]: string };
  cleanedText?: string;
}

export interface DictationSettings {
  preferredProvider: DictationProviderId;
  primaryLanguage: string;
  autoDetectLanguage: boolean;
  smartPunctuation: boolean;
  voiceCommandsEnabled: boolean;
  aiGrammarCleanupEnabled: boolean;
  livePreviewEnabled: boolean;
  confidenceHighlightingEnabled: boolean;
  confidenceThreshold: number; // 0.0 to 1.0
  microphoneDeviceId: string;
  noiseSuppressionLevel: 'off' | 'low' | 'medium' | 'high';
  audioSensitivity: number; // 1 to 10
  offlinePreference: 'always_local' | 'cloud_when_online';
}

export interface DictationStats {
  durationSeconds: number;
  wordCount: number;
  wordsPerMinute: number;
  averageConfidence: number;
  sessionStartTime: number | null;
}

import { ISpeechProvider } from './SpeechProvider';
import { DictationOptions, SpeechRecognitionResult } from '../../types/dictation';
import { applySmartPunctuation } from '../../utils/speechPunctuation';

import { auth } from '../../lib/firebase';
export class GeminiSpeechProvider implements ISpeechProvider {
  id = 'gemini' as const;
  name = 'Cloud AI Voice Engine';
  description = 'Cloud AI dictation with punctuation, formatting, and multi-language support.';
  supportsOffline = false;
  supportsContinuous = true;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isListening = false;
  private options: DictationOptions | null = null;
  private onResultCallback: ((result: SpeechRecognitionResult) => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private intervalTimer: any = null;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(
    options: DictationOptions,
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): Promise<void> {
    this.options = options;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.isListening = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: options.noiseSuppression,
          echoCancellation: true,
          autoGainControl: true,
          deviceId: options.microphoneDeviceId ? { exact: options.microphoneDeviceId } : undefined
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(2500); // 2.5 second audio chunk slices for low latency AI transcription

      // Stream audio chunks to AI endpoint every 3 seconds
      this.intervalTimer = setInterval(() => {
        if (this.isListening && this.audioChunks.length > 0) {
          this.processAudioBatch();
        }
      }, 3200);

    } catch (err) {
      onError(err);
      this.isListening = false;
    }
  }

  private async processAudioBatch() {
    if (!this.audioChunks.length || !this.isListening) return;

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    this.audioChunks = []; // Reset for next batch

    try {
      // Convert Blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        if (!base64Data) return;

        // Call the authenticated server-side speech endpoint
        const response = await fetch('/api/dictation/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` } : {})
          },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: 'audio/webm',
            language: this.options?.language || 'en-US',
            autoDetectLanguage: this.options?.autoDetectLanguage,
            smartPunctuation: this.options?.smartPunctuation
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.transcript && this.onResultCallback) {
            let final = data.transcript;
            if (this.options?.smartPunctuation) {
              final = applySmartPunctuation(final, this.options.language);
            }

            this.onResultCallback({
              transcript: final,
              interimTranscript: '',
              isFinal: true,
              confidence: data.confidence || 0.96,
              language: data.detectedLanguage || this.options?.language,
              words: (data.transcript || '').split(' ').map((w: string) => ({
                word: w,
                confidence: data.confidence || 0.96
              }))
            });
          }
        } else {
          // If server AI speech endpoint is not available, fallback notification
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('AI Speech Endpoint returned status ' + response.status));
          }
        }
      };
    } catch (e) {
      console.warn('[CloudSpeechProvider] Batch processing error:', e);
    }
  }

  stop(): void {
    this.isListening = false;
    clearInterval(this.intervalTimer);
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }
    if (this.onEndCallback) this.onEndCallback();
  }
}

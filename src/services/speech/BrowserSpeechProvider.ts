import { ISpeechProvider } from './SpeechProvider';
import { DictationOptions, SpeechRecognitionResult, WordConfidence } from '../../types/dictation';
import { applySmartPunctuation } from '../../utils/speechPunctuation';

export class BrowserSpeechProvider implements ISpeechProvider {
  id = 'browser' as const;
  name = 'Browser Speech API';
  description = 'High-speed local Web Speech API supported natively in modern browsers.';
  supportsOffline = true;
  supportsContinuous = true;

  private recognition: any = null;
  private isListening = false;
  private options: DictationOptions | null = null;
  private onResultCallback: ((result: SpeechRecognitionResult) => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private restartTimer: any = null;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  start(
    options: DictationOptions,
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): void {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      onError(new Error('SpeechRecognition API is not supported in this browser environment.'));
      return;
    }

    this.options = options;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.isListening = true;

    try {
      this.initRecognition(SpeechRecognitionClass);
    } catch (err) {
      onError(err);
      this.isListening = false;
    }
  }

  private initRecognition(SpeechRecognitionClass: any): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = this.options?.language || 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcriptChunk = result[0]?.transcript || '';
        const conf = typeof result[0]?.confidence === 'number' ? result[0].confidence : 0;
        if (conf > 0) maxConfidence = conf;

        if (result.isFinal) {
          finalTranscript += transcriptChunk;
        } else {
          interimTranscript += transcriptChunk;
        }
      }

      let processedFinal = finalTranscript;
      let processedInterim = interimTranscript;

      if (this.options?.smartPunctuation) {
        if (processedFinal) processedFinal = applySmartPunctuation(processedFinal, this.options.language);
        if (processedInterim) processedInterim = applySmartPunctuation(processedInterim, this.options.language);
      }

      // Browser SpeechRecognition exposes confidence at the result level, not
      // reliably per word. Keep that real value for each token instead of
      // inventing random confidence scores.
      const words: WordConfidence[] = (processedFinal || processedInterim)
        .split(' ')
        .filter(Boolean)
        .map((w) => ({
          word: w,
          confidence: maxConfidence,
          isLowConfidence: maxConfidence > 0 && maxConfidence < (this.options?.confidenceThreshold || 0.8)
        }));

      if (this.onResultCallback) {
        this.onResultCallback({
          transcript: processedFinal,
          interimTranscript: processedInterim,
          isFinal: Boolean(processedFinal),
          confidence: maxConfidence,
          language: this.options?.language,
          words
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Silence detected, handle gracefully without crashing loop
        return;
      }
      if (this.onErrorCallback) {
        this.onErrorCallback(event);
      }
    };

    recognition.onend = () => {
      // Continuous dictation watchdog auto-restart
      if (this.isListening && this.options?.continuous) {
        clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (this.isListening) {
            try {
              this.initRecognition(SpeechRecognitionClass);
            } catch (e) {
              this.isListening = false;
              if (this.onEndCallback) this.onEndCallback();
            }
          }
        }, 200);
      } else {
        this.isListening = false;
        if (this.onEndCallback) this.onEndCallback();
      }
    };

    this.recognition = recognition;
    this.recognition.start();
  }

  stop(): void {
    this.isListening = false;
    clearTimeout(this.restartTimer);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    if (this.onEndCallback) this.onEndCallback();
  }

  pause(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  resume(): void {
    if (this.isListening && this.options) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.initRecognition(SpeechRecognitionClass);
      }
    }
  }
}

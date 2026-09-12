import { ISpeechProvider } from './SpeechProvider';
import { BrowserSpeechProvider } from './BrowserSpeechProvider';
import { GeminiSpeechProvider } from './GeminiSpeechProvider';
import { WhisperAPIProvider } from './WhisperAPIProvider';
import { DictationProviderId, DictationOptions, SpeechRecognitionResult } from '../../types/dictation';

export class SpeechEngineManager {
  private providers: Map<DictationProviderId, ISpeechProvider> = new Map();
  private activeProvider: ISpeechProvider | null = null;

  constructor() {
    this.registerProvider(new BrowserSpeechProvider());
    this.registerProvider(new GeminiSpeechProvider());
    this.registerProvider(new WhisperAPIProvider());
  }

  public registerProvider(provider: ISpeechProvider) {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: DictationProviderId): ISpeechProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): ISpeechProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Intelligently selects the best available speech engine based on current network,
   * PWA environment, and requested preferences.
   */
  public selectBestProvider(preferredId?: DictationProviderId): ISpeechProvider {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

    // If offline, must use a provider that supports offline
    if (!isOnline) {
      const offlineProvider = this.providers.get('browser');
      if (offlineProvider && offlineProvider.isAvailable()) {
        return offlineProvider;
      }
    }

    // Try preferred provider first
    if (preferredId && preferredId !== 'browser') {
      const preferred = this.providers.get(preferredId);
      if (preferred && preferred.isAvailable()) {
        return preferred;
      }
    }

    // PWA Desktop mode prefers the cloud AI voice engine or Browser Speech
    if (isPWA) {
      const gemini = this.providers.get('gemini');
      if (gemini && gemini.isAvailable()) return gemini;
    }

    // Default Browser Speech provider as bulletproof universal engine
    const browserProvider = this.providers.get('browser') || new BrowserSpeechProvider();
    return browserProvider;
  }

  /**
   * Starts dictation using the selected provider with automatic fallback if error occurs
   */
  public startDictation(
    options: DictationOptions,
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): ISpeechProvider {
    let chosenProvider = this.selectBestProvider(options.providerId);
    this.activeProvider = chosenProvider;

    const wrappedOnError = (err: any) => {
      console.warn(`[SpeechEngineManager] Provider ${chosenProvider.id} failed, attempting automatic fallback to Browser Speech API:`, err);

      // Graceful fallback to BrowserSpeechProvider if primary AI provider fails
      if (chosenProvider.id !== 'browser') {
        const fallback = this.providers.get('browser');
        if (fallback && fallback.isAvailable()) {
          this.activeProvider = fallback;
          fallback.start(options, onResult, onError, onEnd);
          return;
        }
      }
      onError(err);
    };

    chosenProvider.start(options, onResult, wrappedOnError, onEnd);
    return chosenProvider;
  }

  public stopDictation(): void {
    if (this.activeProvider) {
      this.activeProvider.stop();
      this.activeProvider = null;
    }
  }

  public pauseDictation(): void {
    if (this.activeProvider && this.activeProvider.pause) {
      this.activeProvider.pause();
    }
  }

  public resumeDictation(): void {
    if (this.activeProvider && this.activeProvider.resume) {
      this.activeProvider.resume();
    }
  }
}

export const speechEngineManager = new SpeechEngineManager();

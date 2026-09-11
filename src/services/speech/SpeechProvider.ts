import { DictationOptions, SpeechRecognitionResult, DictationProviderId } from '../../types/dictation';

export interface ISpeechProvider {
  id: DictationProviderId;
  name: string;
  description: string;
  supportsOffline: boolean;
  supportsContinuous: boolean;
  isAvailable: () => boolean | Promise<boolean>;
  start: (
    options: DictationOptions,
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) => void;
  stop: () => void;
  pause?: () => void;
  resume?: () => void;
}

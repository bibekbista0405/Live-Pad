import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { auth } from '../lib/firebase';
import {
  DictationState,
  DictationOptions,
  DictationSettings,
  SpeechRecognitionResult,
  DictationStats,
  DictationProviderId
} from '../types/dictation';
import { speechEngineManager } from '../services/speech/SpeechEngineManager';
import { detectLanguageFromText, SUPPORTED_DICTATION_LANGUAGES } from '../utils/speechLanguages';
import { parseVoiceCommand, executeVoiceCommand } from '../utils/speechCommands';
import { useAudioAnalyzer } from './useAudioAnalyzer';

export interface UseDictationEngineProps {
  editorInstance?: any;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  editorContent: string;
  onUpdateContent: (content: string) => void;
  addToast?: (type: any, msg: string) => void;
}

export function useDictationEngine({
  editorInstance,
  textareaRef,
  editorContent,
  onUpdateContent,
  addToast
}: UseDictationEngineProps) {
  // Dictation Settings State
  const [settings, setSettings] = useState<DictationSettings>(() => {
    try {
      const saved = localStorage.getItem('livepad_dictation_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      preferredProvider: 'browser',
      primaryLanguage: 'en-US',
      autoDetectLanguage: true,
      smartPunctuation: true,
      voiceCommandsEnabled: true,
      aiGrammarCleanupEnabled: false,
      livePreviewEnabled: true,
      confidenceHighlightingEnabled: true,
      confidenceThreshold: 0.8,
      microphoneDeviceId: '',
      noiseSuppressionLevel: 'medium',
      audioSensitivity: 5,
      offlinePreference: 'cloud_when_online'
    };
  });

  // Save settings change
  const updateSettings = useCallback((newSettings: Partial<DictationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('livepad_dictation_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Runtime State
  const [dictationState, setDictationState] = useState<DictationState>('idle');
  const [activeProviderId, setActiveProviderId] = useState<DictationProviderId>(settings.preferredProvider);
  const [currentLanguage, setCurrentLanguage] = useState<string>(settings.primaryLanguage);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastResult, setLastResult] = useState<SpeechRecognitionResult | null>(null);
  const [detectedLangPrompt, setDetectedLangPrompt] = useState<{ code: string; name: string } | null>(null);

  // Statistics State
  const [stats, setStats] = useState<DictationStats>({
    durationSeconds: 0,
    wordCount: 0,
    wordsPerMinute: 0,
    averageConfidence: 0.95,
    sessionStartTime: null
  });

  const timerRef = useRef<any>(null);
  const totalWordsSessionRef = useRef<number>(0);

  // Audio Level Meter Hook
  const { volumeLevel, audioDevices } = useAudioAnalyzer(
    dictationState === 'listening',
    settings.microphoneDeviceId
  );

  // Timer loop for session statistics
  useEffect(() => {
    if (dictationState === 'listening') {
      if (!stats.sessionStartTime) {
        setStats((s) => ({ ...s, sessionStartTime: Date.now() }));
      }
      timerRef.current = setInterval(() => {
        setStats((prev) => {
          const newDuration = prev.durationSeconds + 1;
          const wpm = newDuration > 0 ? Math.round((totalWordsSessionRef.current / (newDuration / 60))) : 0;
          return {
            ...prev,
            durationSeconds: newDuration,
            wordsPerMinute: isNaN(wpm) || !isFinite(wpm) ? 0 : wpm
          };
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [dictationState, stats.sessionStartTime]);

  // Insert text into active editor cleanly
  const insertTextToEditor = useCallback(
    (textToInsert: string) => {
      if (!textToInsert.trim()) return;

      if (editorInstance) {
        editorInstance.chain().focus().insertContent(textToInsert).run();
      } else if (textareaRef?.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const after = text.substring(end);

        const needsSpaceBefore =
          before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') && !textToInsert.startsWith(' ');
        const spacedText = (needsSpaceBefore ? ' ' : '') + textToInsert;

        const newContent = before + spacedText + after;
        onUpdateContent(newContent);

        setTimeout(() => {
          textarea.focus();
          const newPos = start + spacedText.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 50);
      } else {
        const needsSpaceBefore =
          editorContent.length > 0 &&
          !editorContent.endsWith(' ') &&
          !editorContent.endsWith('\n') &&
          !textToInsert.startsWith(' ');
        const spacedText = (needsSpaceBefore ? ' ' : '') + textToInsert;
        onUpdateContent(editorContent + spacedText);
      }

      // Update statistics
      const addedWords = textToInsert.trim().split(/\s+/).length;
      totalWordsSessionRef.current += addedWords;
      setStats((prev) => ({ ...prev, wordCount: prev.wordCount + addedWords }));
    },
    [editorInstance, textareaRef, editorContent, onUpdateContent]
  );

  // Result Callback
  const handleSpeechResult = useCallback(
    (result: SpeechRecognitionResult) => {
      setLastResult(result);
      setLiveTranscript(result.transcript);
      setInterimTranscript(result.interimTranscript);

      // Auto Language Detection
      if (settings.autoDetectLanguage && (result.transcript || result.interimTranscript)) {
        const detected = detectLanguageFromText(result.transcript || result.interimTranscript);
        if (detected && detected.code !== currentLanguage) {
          setDetectedLangPrompt({ code: detected.code, name: detected.nativeName });
        }
      }

      // Voice Commands Check
      if (settings.voiceCommandsEnabled && result.transcript) {
        const commandMatch = parseVoiceCommand(result.transcript);
        if (commandMatch) {
          const executed = executeVoiceCommand(
            commandMatch,
            editorInstance,
            textareaRef || { current: null },
            editorContent,
            onUpdateContent
          );
          if (executed) {
            if (addToast) addToast('info', `Voice command executed: "${commandMatch.type.replace('_', ' ')}"`);
            setLiveTranscript('');
            setInterimTranscript('');
            return;
          }
        }
      }

      // Insert Finalized Speech
      if (result.isFinal && result.transcript) {
        insertTextToEditor(result.transcript);
        setLiveTranscript('');
        setInterimTranscript('');
      }
    },
    [
      settings,
      currentLanguage,
      editorInstance,
      textareaRef,
      editorContent,
      onUpdateContent,
      insertTextToEditor,
      addToast
    ]
  );

  // AI Grammar & Punctuation Cleanup
  const triggerAICleanup = useCallback(async () => {
    if (!editorContent || editorContent.trim().length === 0) {
      if (addToast) addToast('warning', 'No document text available for AI cleanup.');
      return;
    }

    setDictationState('processing');
    if (addToast) addToast('info', 'AI cleanup in progress...');

    try {
      const res = await fetch('/api/dictation/cleanup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(auth?.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` } : {})
          },
        body: JSON.stringify({
          text: editorContent,
          language: currentLanguage
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cleanedText) {
          onUpdateContent(data.cleanedText);
          if (addToast) addToast('success', 'AI Grammar & Punctuation cleanup applied!');
        }
      } else {
        if (addToast) addToast('error', 'AI cleanup service unavailable.');
      }
    } catch (e) {
      if (addToast) addToast('error', 'Error running AI cleanup.');
    } finally {
      setDictationState(stats.sessionStartTime ? 'listening' : 'idle');
    }
  }, [editorContent, currentLanguage, onUpdateContent, addToast, stats.sessionStartTime]);

  // Start Dictation
  const startListening = useCallback(
    (overrideProvider?: DictationProviderId) => {
      const providerId = overrideProvider || settings.preferredProvider;
      setActiveProviderId(providerId);

      const options: DictationOptions = {
        providerId,
        language: currentLanguage,
        autoDetectLanguage: settings.autoDetectLanguage,
        continuous: true,
        smartPunctuation: settings.smartPunctuation,
        voiceCommands: settings.voiceCommandsEnabled,
        noiseSuppression: settings.noiseSuppressionLevel !== 'off',
        aiGrammarCleanup: settings.aiGrammarCleanupEnabled,
        livePreview: settings.livePreviewEnabled,
        confidenceHighlighting: settings.confidenceHighlightingEnabled,
        confidenceThreshold: settings.confidenceThreshold,
        microphoneDeviceId: settings.microphoneDeviceId
      };

      try {
        setDictationState('listening');
        const provider = speechEngineManager.startDictation(
          options,
          handleSpeechResult,
          (err) => {
            console.error('[useDictationEngine] Error:', err);
            if (addToast) addToast('error', `Voice dictation notice: ${err.message || 'Stream reset'}`);
          },
          () => {
            setDictationState('idle');
          }
        );
        setActiveProviderId(provider.id);
        if (addToast) addToast('success', `Voice Dictation active using ${provider.name}`);
      } catch (e: any) {
        setDictationState('error');
        if (addToast) addToast('error', `Could not start dictation: ${e.message}`);
      }
    },
    [settings, currentLanguage, handleSpeechResult, addToast]
  );

  // Stop Dictation
  const stopListening = useCallback(() => {
    speechEngineManager.stopDictation();
    setDictationState('idle');
    setLiveTranscript('');
    setInterimTranscript('');
    if (addToast) addToast('info', 'Voice Dictation stopped.');
  }, [addToast]);

  // Pause / Resume
  const pauseListening = useCallback(() => {
    speechEngineManager.pauseDictation();
    setDictationState('paused');
  }, []);

  const resumeListening = useCallback(() => {
    speechEngineManager.resumeDictation();
    setDictationState('listening');
  }, []);

  const toggleDictation = useCallback(() => {
    if (dictationState === 'listening' || dictationState === 'paused') {
      stopListening();
    } else {
      startListening();
    }
  }, [dictationState, stopListening, startListening]);

  return {
    dictationState,
    activeProviderId,
    currentLanguage,
    setCurrentLanguage,
    settings,
    updateSettings,
    stats,
    volumeLevel,
    audioDevices,
    liveTranscript,
    interimTranscript,
    lastResult,
    detectedLangPrompt,
    setDetectedLangPrompt,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    toggleDictation,
    triggerAICleanup,
    availableProviders: speechEngineManager.getAllProviders()
  };
}

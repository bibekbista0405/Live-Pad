import React, { useState } from 'react';
import {
  Mic,
  Pause,
  Play,
  Square,
  Sliders,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { DictationState, DictationSettings, DictationProviderId, DictationStats } from '../../types/dictation';
import { ISpeechProvider } from '../../services/speech/SpeechProvider';
import { DictationSettingsModal } from './DictationSettingsModal';

interface DictationToolbarProps {
  dictationState: DictationState;
  activeProviderId: DictationProviderId;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  settings: DictationSettings;
  onUpdateSettings: (newSettings: Partial<DictationSettings>) => void;
  stats: DictationStats;
  volumeLevel: number;
  audioDevices: { deviceId: string; label: string }[];
  availableProviders: ISpeechProvider[];
  onToggleDictation: () => void;
  onPauseDictation: () => void;
  onResumeDictation: () => void;
  onStopDictation: () => void;
  onTriggerAICleanup: () => void;
  confidenceScore?: number;
  compact?: boolean;
}

export const DictationToolbar: React.FC<DictationToolbarProps> = ({
  dictationState,
  activeProviderId,
  currentLanguage,
  onLanguageChange,
  settings,
  onUpdateSettings,
  stats,
  volumeLevel,
  audioDevices,
  availableProviders,
  onToggleDictation,
  onPauseDictation,
  onResumeDictation,
  onStopDictation,
  onTriggerAICleanup,
  confidenceScore = 0.95
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isListening = dictationState === 'listening';
  const isPaused = dictationState === 'paused';
  const isProcessing = dictationState === 'processing';

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Simple Normal Dictate Button */}
      <motion.button
        type="button"
        id="livepad-dictate-btn"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onToggleDictation}
        disabled={isProcessing}
        className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden relative ${
          isListening
            ? 'bg-rose-500/15 text-rose-500 border-rose-500/35 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
            : isPaused
            ? 'bg-amber-500/15 text-amber-600 border-amber-500/35 dark:bg-amber-500/20 dark:text-amber-400'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800'
        }`}
        title={isListening ? 'Stop Voice Dictation' : isPaused ? 'Resume Voice Dictation' : 'Start Voice Dictation'}
      >
        {isListening ? (
          <>
            <div className="relative flex items-center justify-center shrink-0">
              <Mic className="w-3.5 h-3.5 text-rose-500" />
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
            </div>

            {/* Mini voice waveform */}
            <div className="flex items-center gap-[2px] h-3.5 px-0.5 select-none shrink-0" style={{ pointerEvents: 'none' }}>
              <motion.div
                className="w-[2px] bg-rose-500 dark:bg-rose-400 rounded-full"
                animate={{ height: ['4px', '14px', '4px'] }}
                transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut', delay: 0.0 }}
              />
              <motion.div
                className="w-[2px] bg-rose-500 dark:bg-rose-400 rounded-full"
                animate={{ height: ['6px', '16px', '6px'] }}
                transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
              />
              <motion.div
                className="w-[2px] bg-rose-500 dark:bg-rose-400 rounded-full"
                animate={{ height: ['8px', '12px', '8px'] }}
                transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut', delay: 0.24 }}
              />
            </div>
            <span className="hidden sm:inline">Listening...</span>
          </>
        ) : isPaused ? (
          <>
            <Pause className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Paused</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
            <span className="hidden sm:inline">Dictate</span>
          </>
        )}
      </motion.button>

      {/* When active or paused, show small quick controls */}
      {(isListening || isPaused) && (
        <div className="flex items-center gap-1 animate-in fade-in">
          {isListening ? (
            <button
              type="button"
              onClick={onPauseDictation}
              className="p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Pause dictation"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onResumeDictation}
              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
              title="Resume dictation"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onStopDictation}
            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Stop dictation"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      )}

      {/* Voice Settings gear button to open customization settings */}
      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        title="Voice & Dictation Settings"
      >
        <Sliders className="w-3.5 h-3.5" />
      </button>

      {/* Voice Customization Settings Modal */}
      <DictationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        audioDevices={audioDevices}
        availableProviders={availableProviders}
      />
    </div>
  );
};


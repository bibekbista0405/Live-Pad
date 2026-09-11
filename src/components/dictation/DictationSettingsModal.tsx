import React, { useState } from 'react';
import { X, Mic, Sliders, Languages, Cpu } from 'lucide-react';
import { DictationSettings, DictationProviderId } from '../../types/dictation';
import { SUPPORTED_DICTATION_LANGUAGES } from '../../utils/speechLanguages';
import { ISpeechProvider } from '../../services/speech/SpeechProvider';

interface DictationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DictationSettings;
  onUpdateSettings: (newSettings: Partial<DictationSettings>) => void;
  audioDevices: { deviceId: string; label: string }[];
  availableProviders: ISpeechProvider[];
}

export const DictationSettingsModal: React.FC<DictationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  audioDevices,
  availableProviders
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'preferences'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Voice & Dictation Settings</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Configure language, speech engine, and input device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-100 dark:border-zinc-800 px-6 gap-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>Engine & Language</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Preferences & Hardware</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                  Speech Engine Provider
                </label>
                <select
                  value={settings.preferredProvider}
                  onChange={(e) => onUpdateSettings({ preferredProvider: e.target.value as DictationProviderId })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {availableProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.supportsOffline ? '(Offline)' : '(Cloud AI)'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  {availableProviders.find((p) => p.id === settings.preferredProvider)?.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Primary Dictation Language
                </label>
                <select
                  value={settings.primaryLanguage}
                  onChange={(e) => onUpdateSettings({ primaryLanguage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {SUPPORTED_DICTATION_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Auto-Detect Spoken Language</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Automatically prompt to switch when another language is detected.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoDetectLanguage}
                  onChange={(e) => onUpdateSettings({ autoDetectLanguage: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Smart Punctuation</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Converts spoken punctuation keywords ("period", "comma", "question mark") into symbols.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smartPunctuation}
                  onChange={(e) => onUpdateSettings({ smartPunctuation: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Voice Commands</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Supports formatting commands ("new line", "bold this", "bullet list", "heading").
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.voiceCommandsEnabled}
                  onChange={(e) => onUpdateSettings({ voiceCommandsEnabled: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-500" />
                  Microphone Input Device
                </label>
                <select
                  value={settings.microphoneDeviceId}
                  onChange={(e) => onUpdateSettings({ microphoneDeviceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Default System Microphone</option>
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};


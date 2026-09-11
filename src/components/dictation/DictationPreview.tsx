import React from 'react';
import { Sparkles, Check, Globe } from 'lucide-react';
import { SpeechRecognitionResult } from '../../types/dictation';

interface DictationPreviewProps {
  liveTranscript: string;
  interimTranscript: string;
  lastResult: SpeechRecognitionResult | null;
  confidenceThreshold: number;
  detectedLangPrompt: { code: string; name: string } | null;
  onAcceptDetectedLang: () => void;
  onDismissDetectedLang: () => void;
}

export const DictationPreview: React.FC<DictationPreviewProps> = ({
  liveTranscript,
  interimTranscript,
  lastResult,
  confidenceThreshold,
  detectedLangPrompt,
  onAcceptDetectedLang,
  onDismissDetectedLang
}) => {
  const activeText = liveTranscript || interimTranscript;

  if (!activeText && !detectedLangPrompt) return null;

  const confidencePct = lastResult?.confidence ? Math.round(lastResult.confidence * 100) : 95;
  const isHighConfidence = confidencePct >= Math.round(confidenceThreshold * 100);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-xl w-11/12 space-y-2 pointer-events-auto">
      {/* Auto Language Detection Prompt Banner */}
      {detectedLangPrompt && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-indigo-900/90 dark:bg-indigo-950/95 text-white rounded-2xl shadow-xl backdrop-blur-md border border-indigo-500/30 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Spoken language detected as <strong>{detectedLangPrompt.name}</strong>?</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onAcceptDetectedLang}
              className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
            <button
              onClick={onDismissDetectedLang}
              className="px-2 py-1 text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-lg transition-all"
            >
              Ignore
            </button>
          </div>
        </div>
      )}

      {/* Live Transcript Stream Preview Box */}
      {activeText && (
        <div className="bg-slate-900/90 dark:bg-zinc-900/95 text-slate-100 p-3.5 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700/50 text-sm space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>LIVE AI TRANSCRIPT PREVIEW</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  isHighConfidence
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {confidencePct}% Confidence
              </span>
            </div>
          </div>

          <div className="text-slate-200 leading-relaxed font-normal">
            {lastResult?.words && lastResult.words.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {lastResult.words.map((w, idx) => (
                  <span
                    key={idx}
                    className={
                      w.confidence < confidenceThreshold
                        ? 'bg-amber-500/30 text-amber-200 px-1 rounded border border-amber-500/40'
                        : ''
                    }
                    title={`Word confidence: ${Math.round(w.confidence * 100)}%`}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            ) : (
              <span>{activeText}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

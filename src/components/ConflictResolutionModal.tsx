import React, { useState } from 'react';
import { X, GitMerge, FileText, CheckCircle, RefreshCw, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { DocumentConflict } from '../types';
import { merge3Text } from '../utils/textMerge';

interface ConflictResolutionModalProps {
  conflict: DocumentConflict | null;
  onClose: () => void;
  onResolve: (resolvedContent: string, resolutionType: 'local' | 'remote' | 'merged') => Promise<void>;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onClose,
  onResolve,
}) => {
  if (!conflict) return null;

  const mergedPreview = merge3Text(
    conflict.baseContent || '',
    conflict.localContent,
    conflict.remoteContent
  );

  const [activeTab, setActiveTab] = useState<'merged' | 'local' | 'remote'>('merged');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyResolution = async (type: 'local' | 'remote' | 'merged') => {
    setIsSubmitting(true);
    try {
      let contentToSave = conflict.localContent;
      if (type === 'remote') contentToSave = conflict.remoteContent;
      if (type === 'merged') contentToSave = mergedPreview;

      await onResolve(contentToSave, type);
      onClose();
    } catch (err) {
      console.error('Failed to resolve document conflict:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentForTab = () => {
    switch (activeTab) {
      case 'local':
        return conflict.localContent;
      case 'remote':
        return conflict.remoteContent;
      case 'merged':
      default:
        return mergedPreview;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Document Conflict Detected
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Re-connection Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Workspace <span className="font-mono text-cyan-300 font-semibold">{conflict.documentTitle}</span> was updated on the server while you were offline.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('merged')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'merged'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>3-Way Auto-Merge</span>
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'local'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Your Offline Version</span>
            </button>
            <button
              onClick={() => setActiveTab('remote')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'remote'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Remote Server Version</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Review changes below before resolving
          </span>
        </div>

        {/* Content Comparison Viewport */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/60">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto selection:bg-cyan-500/30">
            {getContentForTab() || <span className="text-slate-500 italic">(Empty content)</span>}
          </div>
        </div>

        {/* Footer Resolution Controls */}
        <div className="px-6 py-4 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApplyResolution('local')}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-amber-600 text-slate-200 hover:text-white font-medium text-xs border border-slate-600 hover:border-amber-500 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Keep Offline Version</span>
            </button>
            <button
              onClick={() => handleApplyResolution('remote')}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-purple-600 text-slate-200 hover:text-white font-medium text-xs border border-slate-600 hover:border-purple-500 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Accept Remote Server Version</span>
            </button>
          </div>

          <button
            onClick={() => handleApplyResolution('merged')}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <GitMerge className="w-4 h-4" />
            )}
            <span>Apply 3-Way Auto-Merge</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;

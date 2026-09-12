import React from 'react';
import { Eye, Play, RefreshCw, Terminal } from 'lucide-react';
import { ProjectFile } from '../../types/code';

interface CodeRunPanelProps {
  activeFile: ProjectFile | null;
  isPreviewOpen: boolean;
  isTeachingSession?: boolean;
  onRun: () => void;
  onOpenPreview: () => void;
}

export function CodeRunPanel({ activeFile, isPreviewOpen, isTeachingSession = false, onRun, onOpenPreview }: CodeRunPanelProps) {
  return (
    <div className="livepad-run-panel flex-1 min-h-0 overflow-y-auto p-4">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Play className="w-4 h-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">Run your website</h2>
        </div>
        <p className="text-[11px] leading-relaxed text-white/45">
          LivePad combines your HTML, CSS, and JavaScript into the browser preview.
        </p>
      </div>

      <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 mb-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-white/30 mb-2">Current file</div>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-cyan-400/10 text-cyan-300 flex items-center justify-center font-mono text-[10px]">{activeFile?.extension?.toUpperCase() || '—'}</span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">{activeFile?.name || 'No file selected'}</div>
            <div className="text-[10px] text-white/35 truncate">{activeFile?.path || 'Open a file to begin'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <button type="button" onClick={onRun} disabled={!activeFile} className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2.5 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors">
          <Play className="w-3.5 h-3.5 fill-current" />
          {isTeachingSession ? 'Run with the class' : 'Run preview'}
        </button>
        <button type="button" onClick={onOpenPreview} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/70 flex items-center justify-center gap-2 transition-colors">
          <Eye className="w-3.5 h-3.5" />
          {isPreviewOpen ? 'Preview is open' : 'Open preview'}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-white/55"><RefreshCw className="w-3 h-3 text-cyan-300" /> Live preview</div>
        <p className="text-[10px] leading-relaxed text-white/35">Save your changes and the preview uses the current project files. If something is wrong, check the browser console or the code before changing more.</p>
        <div className="flex items-center gap-2 text-[10px] text-white/35"><Terminal className="w-3 h-3" /> Runtime errors appear directly in the preview.</div>
      </div>
    </div>
  );
}

export default CodeRunPanel;

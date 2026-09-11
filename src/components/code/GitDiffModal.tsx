import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check, FileCode, Split, AlignLeft } from 'lucide-react';
import { ProjectFile } from '../../types/code';

interface GitDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  originalContent: string;
  modifiedContent: string;
  onResolveConflict?: (resolvedContent: string) => void;
  hasConflict?: boolean;
}

export function GitDiffModal({
  isOpen,
  onClose,
  fileName,
  originalContent,
  modifiedContent,
  onResolveConflict,
  hasConflict = false
}: GitDiffModalProps) {
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');

  if (!isOpen) return null;

  const origLines = originalContent.split('\n');
  const modLines = modifiedContent.split('\n');

  // Simple diff computation for line rendering
  const maxLines = Math.max(origLines.length, modLines.length);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-bold text-slate-100 text-sm">{fileName}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {hasConflict ? 'Merge Conflict' : 'Working Tree Diff'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-[#181818] border border-[#3c3c3c] rounded p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'split' ? 'bg-[#007acc] text-white font-bold' : 'text-[#858585] hover:text-white'
                }`}
              >
                <Split className="w-3 h-3" /> Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('inline')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'inline' ? 'bg-[#007acc] text-white font-bold' : 'text-[#858585] hover:text-white'
                }`}
              >
                <AlignLeft className="w-3 h-3" /> Unified
              </button>
            </div>

            {hasConflict && onResolveConflict && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onResolveConflict(originalContent);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-colors text-xs"
                >
                  Accept Current (HEAD)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResolveConflict(modifiedContent);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded transition-colors text-xs"
                >
                  Accept Incoming
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#858585] hover:text-white rounded hover:bg-[#333333] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diff Content View */}
        <div className="flex-1 overflow-auto p-2 font-mono text-xs leading-relaxed bg-[#141414] custom-scrollbar">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-2 divide-x divide-[#2d2d2d] h-full min-h-[400px]">
              {/* Left: Original (HEAD) */}
              <div className="pr-2">
                <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#2d2d2d] py-1 px-2 font-bold text-slate-400 text-[11px] flex justify-between">
                  <span>HEAD (Current Change)</span>
                  <span className="text-rose-400">-{origLines.length} lines</span>
                </div>
                {origLines.map((line, idx) => {
                  const isDifferent = modLines[idx] !== line;
                  return (
                    <div
                      key={`orig-${idx}`}
                      className={`flex gap-3 px-2 py-0.5 border-l-2 ${
                        isDifferent
                          ? 'bg-rose-950/40 text-rose-300 border-rose-500'
                          : 'text-slate-400 border-transparent'
                      }`}
                    >
                      <span className="w-8 text-right shrink-0 select-none text-slate-600">{idx + 1}</span>
                      <span className="whitespace-pre-wrap break-all">{line || ' '}</span>
                    </div>
                  );
                })}
              </div>

              {/* Right: Modified (Incoming) */}
              <div className="pl-2">
                <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#2d2d2d] py-1 px-2 font-bold text-slate-400 text-[11px] flex justify-between">
                  <span>INCOMING (Staged / Branch)</span>
                  <span className="text-emerald-400">+{modLines.length} lines</span>
                </div>
                {modLines.map((line, idx) => {
                  const isDifferent = origLines[idx] !== line;
                  return (
                    <div
                      key={`mod-${idx}`}
                      className={`flex gap-3 px-2 py-0.5 border-l-2 ${
                        isDifferent
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500'
                          : 'text-slate-300 border-transparent'
                      }`}
                    >
                      <span className="w-8 text-right shrink-0 select-none text-slate-600">{idx + 1}</span>
                      <span className="whitespace-pre-wrap break-all">{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Unified Diff */
            <div className="space-y-0.5">
              {Array.from({ length: maxLines }).map((_, idx) => {
                const orig = origLines[idx];
                const mod = modLines[idx];
                if (orig === mod) {
                  return (
                    <div key={`uni-${idx}`} className="flex gap-4 px-3 py-0.5 text-slate-400">
                      <span className="w-8 text-right select-none text-slate-600">{idx + 1}</span>
                      <span className="whitespace-pre-wrap">{orig}</span>
                    </div>
                  );
                }
                return (
                  <React.Fragment key={`uni-diff-${idx}`}>
                    {orig !== undefined && (
                      <div className="flex gap-4 px-3 py-0.5 bg-rose-950/40 text-rose-300 border-l-2 border-rose-500">
                        <span className="w-8 text-right select-none text-rose-400">- {idx + 1}</span>
                        <span className="whitespace-pre-wrap">{orig}</span>
                      </div>
                    )}
                    {mod !== undefined && (
                      <div className="flex gap-4 px-3 py-0.5 bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500">
                        <span className="w-8 text-right select-none text-emerald-400">+ {idx + 1}</span>
                        <span className="whitespace-pre-wrap">{mod}</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Search, X, Replace, FileCode, ArrowRight, Check } from 'lucide-react';
import { ProjectFile } from '../../types/code';

interface SearchResultMatch {
  file: ProjectFile;
  lineNumber: number;
  lineText: string;
}

interface SearchFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFile: (fileId: string) => void;
  onUpdateFileContent: (fileId: string, newContent: string) => void;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function SearchFilesModal({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onUpdateFileContent,
  onAddToast
}: SearchFilesModalProps) {
  const [query, setQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const results: SearchResultMatch[] = [];

    files.forEach((file) => {
      if (!file || !file.content) return;
      const lines = file.content.split('\n');
      lines.forEach((line, idx) => {
        const targetLine = isCaseSensitive ? line : line.toLowerCase();
        const searchTarget = isCaseSensitive ? query : query.toLowerCase();

        if (targetLine.includes(searchTarget)) {
          results.push({
            file,
            lineNumber: idx + 1,
            lineText: line.trim()
          });
        }
      });
    });

    return results;
  }, [files, query, isCaseSensitive]);

  if (!isOpen) return null;

  const handleReplaceAll = () => {
    if (!query.trim()) return;
    let replacedCount = 0;

    files.forEach((file) => {
      if (!file || !file.content) return;
      const flags = isCaseSensitive ? 'g' : 'gi';
      const regex = new RegExp(escapeRegExp(query), flags);
      if (regex.test(file.content)) {
        const newContent = file.content.replace(regex, replaceQuery);
        onUpdateFileContent(file.id, newContent);
        replacedCount++;
      }
    });

    if (onAddToast) {
      onAddToast('success', `Replaced occurrences across ${replacedCount} file(s).`);
    }
  };

  return (
    <div className="livepad-code-modal-backdrop">
      <div className="w-full max-w-2xl bg-[#0c0f17] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Find & Replace in Files
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReplace(!showReplace)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  showReplace
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Toggle Replace
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across all project files... (Ctrl+Shift+F)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCaseSensitive(!isCaseSensitive)}
              className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold border ${
                isCaseSensitive
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Match Case"
            >
              Aa
            </button>
          </div>

          {showReplace && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace with..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleReplaceAll}
                className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-xs font-mono font-bold shadow transition-all cursor-pointer"
              >
                Replace All
              </button>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              Type a search query above to scan all workspace files.
            </div>
          ) : matches.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              No occurrences found matching "{query}".
            </div>
          ) : (
            matches.map((match, idx) => (
              <div
                key={`${match.file.id}-${match.lineNumber}-${idx}`}
                onClick={() => {
                  onSelectFile(match.file.id);
                  onClose();
                }}
                className="p-2.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                      <span className="truncate">{match.file.name}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded-md font-mono">
                        Line {match.lineNumber}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {match.lineText}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

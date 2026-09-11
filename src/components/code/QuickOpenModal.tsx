import React, { useState, useEffect, useRef } from 'react';
import { Search, FileCode, X } from 'lucide-react';
import { ProjectFile } from '../../types/code';
import FileIcon from './FileIcon';

interface QuickOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFile: (fileId: string) => void;
}

export default function QuickOpenModal({
  isOpen,
  onClose,
  files,
  onSelectFile
}: QuickOpenModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const safeFiles = Array.isArray(files) ? files : [];

  const filteredFiles = safeFiles.filter(
    (f) =>
      f &&
      ((f.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (f.path || '').toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredFiles.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredFiles.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        onSelectFile(filteredFiles[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 select-none">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 py-3 bg-slate-950/60 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a file name or path to open... (e.g., Navbar.tsx)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 outline-none"
          />
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No matching files found in current project.
            </div>
          ) : (
            filteredFiles.map((file, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    onSelectFile(file.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileIcon name={file.name} extension={file.extension} className="w-4 h-4" />
                    <span className="text-xs font-mono truncate">{file.name}</span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 truncate ml-4 max-w-[200px]">
                    {file.path}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>
            Press <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">↑</kbd>{' '}
            <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">↓</kbd> to navigate
          </span>
          <span>
            <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">Enter</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}

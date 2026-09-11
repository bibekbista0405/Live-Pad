import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
  Copy,
  Archive,
  Upload,
  History,
  Recycle,
  Sparkles,
  WrapText,
  Maximize2,
  Layers,
  X,
  Code2
} from 'lucide-react';

export interface CommandOption {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandOption[];
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  commands
}: CommandPaletteModalProps) {
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

  const safeCommands = Array.isArray(commands) ? commands : [];

  const filteredCommands = safeCommands.filter(
    (cmd) =>
      cmd &&
      ((cmd.label || '').toLowerCase().includes(query.toLowerCase()) ||
        (cmd.category || '').toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
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
          <Code2 className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions... (e.g., New File, Version History, Export)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 outline-none"
          />
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1.5 rounded-lg bg-slate-800 text-amber-400 shrink-0">{cmd.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-mono truncate">{cmd.label}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{cmd.category}</div>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="text-[10px] font-mono bg-slate-800/90 text-slate-400 px-2 py-0.5 rounded border border-slate-700/80 shrink-0 ml-3">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>LivePad Command Palette</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}

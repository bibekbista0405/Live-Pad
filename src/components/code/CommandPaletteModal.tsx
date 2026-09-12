import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, FilePlus2, FolderPlus, History, Search, Settings2, Trash2, X } from 'lucide-react';

export interface CommandOption {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  teacherOnly?: boolean;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandOption[];
}

export default function CommandPaletteModal({ isOpen, onClose, commands }: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (Array.isArray(commands) ? commands : []).filter((cmd) => {
      if (!cmd) return false;
      if (!q) return true;
      return `${cmd.label} ${cmd.category}`.toLowerCase().includes(q);
    });
  }, [commands, query]);

  useEffect(() => setSelectedIndex(0), [query]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => filteredCommands.length ? (index + 1) % filteredCommands.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => filteredCommands.length ? (index - 1 + filteredCommands.length) % filteredCommands.length : 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = filteredCommands[selectedIndex];
      if (command) { command.action(); onClose(); }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="livepad-code-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="livepad-code-modal livepad-command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={handleKeyDown}>
        <div className="livepad-code-modal-search">
          <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands and actions"
            aria-label="Search commands and actions"
          />
          <kbd>Esc</kbd>
          <button type="button" onClick={onClose} aria-label="Close command palette"><X className="w-4 h-4" /></button>
        </div>

        <div className="livepad-command-list" role="listbox" aria-label="Commands">
          {filteredCommands.length === 0 ? (
            <div className="livepad-code-empty-state">
              <Search className="w-5 h-5" />
              <strong>No matching actions</strong>
              <span>Try a file name, project action, or editor command.</span>
            </div>
          ) : filteredCommands.map((command, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={command.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`livepad-command-row ${selected ? 'is-selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => { command.action(); onClose(); }}
              >
                <span className="livepad-command-icon">{command.icon}</span>
                <span className="livepad-command-copy">
                  <strong>{command.label}</strong>
                  <small>{command.category}</small>
                </span>
                {command.shortcut && <kbd>{command.shortcut}</kbd>}
              </button>
            );
          })}
        </div>

        <footer className="livepad-code-modal-footer">
          <span><strong>LivePad</strong> · Command palette</span>
          <span>↑ ↓ navigate · Enter run</span>
        </footer>
      </div>
    </div>
  );
}

export const commandPaletteIcons = {
  newFile: <FilePlus2 className="w-4 h-4" />,
  newFolder: <FolderPlus className="w-4 h-4" />,
  settings: <Settings2 className="w-4 h-4" />,
  export: <Archive className="w-4 h-4" />,
  history: <History className="w-4 h-4" />,
  trash: <Trash2 className="w-4 h-4" />
};

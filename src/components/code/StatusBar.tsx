import React, { memo } from 'react';
import {
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Sparkles,
  Users,
  Wifi,
  Clock
} from 'lucide-react';
import { ProjectFile } from '../../types/code';

interface StatusBarProps {
  activeFile: ProjectFile | null;
  activeUsersCount?: number;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  isAIPanelOpen: boolean;
  onToggleAIPanel: () => void;
  isSyncing?: boolean;
}

export function StatusBar({
  activeFile,
  activeUsersCount = 1,
  isTerminalOpen,
  onToggleTerminal,
  isAIPanelOpen,
  onToggleAIPanel,
  isSyncing = false
}: StatusBarProps) {
  const lineCount = activeFile?.content ? activeFile.content.split('\n').length : 1;
  const langName = activeFile?.language
    ? activeFile.language.toUpperCase()
    : 'PLAINTEXT';

  return (
    <footer className="h-6 w-full shrink-0 bg-[#007acc] text-white px-2 flex items-center justify-between text-[11px] font-sans select-none z-30 font-medium">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <GitBranch className="w-3 h-3" />
          <span className="font-mono text-[11px]">main*</span>
        </div>

        <div className="flex items-center gap-2 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>0</span>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>0</span>
          </span>
        </div>

        {isSyncing && (
          <span className="flex items-center gap-1 animate-pulse px-1.5">
            <Wifi className="w-3 h-3" />
            <span>Syncing...</span>
          </span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer font-mono">
          Ln 1, Col 1
        </span>

        <span className="hidden md:inline hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          Spaces: 2
        </span>

        <span className="hidden md:inline hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          UTF-8
        </span>

        <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer font-bold">
          {langName}
        </span>

        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          <Users className="w-3 h-3" />
          <span>{activeUsersCount} Online</span>
        </div>

        <button
          type="button"
          onClick={onToggleTerminal}
          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
            isTerminalOpen ? 'bg-white/20 font-bold' : 'hover:bg-white/10'
          }`}
          title="Toggle Terminal (Ctrl+J)"
        >
          <Terminal className="w-3 h-3" />
          <span className="hidden sm:inline">Terminal</span>
        </button>

        <button
          type="button"
          onClick={onToggleAIPanel}
          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
            isAIPanelOpen ? 'bg-white/20 font-bold' : 'hover:bg-white/10'
          }`}
          title="Toggle AI Copilot (Ctrl+I)"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Copilot</span>
        </button>
      </div>
    </footer>
  );
}

export default memo(StatusBar);

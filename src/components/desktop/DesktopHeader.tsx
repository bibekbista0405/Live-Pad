import React, { useState } from 'react';
import { Home, ChevronDown, Check, Sparkles, Monitor, RotateCcw } from 'lucide-react';
import { getRecentWorkspaces, RecentWorkspaceItem } from '../../utils/recentWorkspaces';

interface DesktopHeaderProps {
  roomCode: string | null;
  workspaceTitle: string;
  onGoToDashboard: () => void;
  onSwitchWorkspace: (code: string) => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  roomCode,
  workspaceTitle,
  onGoToDashboard,
  onSwitchWorkspace,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const recents = getRecentWorkspaces();

  return (
    <div className="h-9 bg-slate-950 border-b border-slate-800/90 px-3 flex items-center justify-between text-xs text-slate-300 font-sans z-30 select-none">
      <div className="flex items-center gap-2">
        {/* Back to Dashboard Button */}
        <button
          onClick={onGoToDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] transition-all active:scale-95"
          title="Return to Desktop Dashboard"
        >
          <Home size={13} />
          <span>Dashboard</span>
        </button>

        <span className="text-slate-700">|</span>

        {/* Quick Workspace Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/80 font-medium text-slate-200 transition-colors"
          >
            <span className="font-semibold truncate max-w-[180px]">
              {workspaceTitle || (roomCode ? `Room #${roomCode}` : 'Scratchpad')}
            </span>
            {roomCode && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                #{roomCode}
              </span>
            )}
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
          )}

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1 space-y-0.5">
              <div className="px-3 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Quick Switch Workspace
              </div>
              <div className="max-h-56 overflow-y-auto custom-scrollbar">
                {recents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDropdownOpen(false);
                      onSwitchWorkspace(item.code);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      item.code === roomCode ? 'bg-indigo-600/10 text-indigo-300' : 'text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-xs truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">#{item.code}</div>
                    </div>
                    {item.code === roomCode && <Check size={14} className="text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop App Mode Indicator */}
      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 flex items-center gap-1">
          <Monitor size={11} className="text-indigo-400" />
          <span>Desktop Edition</span>
        </span>
        <span className="hidden sm:inline text-emerald-400 text-[10px]">● Sync Active</span>
      </div>
    </div>
  );
};

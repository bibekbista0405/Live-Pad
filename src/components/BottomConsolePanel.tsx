import { memo, useState, MouseEvent, TouchEvent } from 'react';
import { 
  Terminal, 
  X, 
  Trash2, 
  Activity, 
  Code2, 
  Sparkles, 
  Clock, 
  Info, 
  CheckCircle2
} from 'lucide-react';

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'sync';
  msg: string;
}

interface BottomConsolePanelProps {
  height: number;
  isOpen: boolean;
  onClose: () => void;
  onResizeStart: (e: MouseEvent | TouchEvent) => void;
  roomCode?: string;
  activeUsersCount?: number;
  wordCount?: number;
  lineCount?: number;
}

function BottomConsolePanel({
  height,
  isOpen,
  onClose,
  onResizeStart,
  roomCode,
  activeUsersCount = 1,
  wordCount = 0,
  lineCount = 0,
}: BottomConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'scratchpad' | 'status'>('activity');
  const [scratchNotes, setScratchNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('livepad_bottom_scratchpad') || '';
    } catch (_) {
      return '';
    }
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: new Date().toLocaleTimeString(), type: 'info', msg: 'Workspace layout engine initialized successfully.' },
    { id: '2', time: new Date().toLocaleTimeString(), type: 'sync', msg: roomCode ? `Connected to Collaborative Live Room #${roomCode}` : 'Local workspace persistence active.' },
    { id: '3', time: new Date().toLocaleTimeString(), type: 'success', msg: `Document buffer updated (${wordCount} words, ${lineCount} lines).` },
  ]);

  if (!isOpen) return null;

  return (
    <div 
      style={{ height: `${height}px` }} 
      className="shrink-0 w-full bg-slate-900 dark:bg-[#0b0c10] text-slate-200 border-t border-slate-700/80 dark:border-zinc-800 flex flex-col relative overflow-hidden select-none z-20 shadow-xl"
    >
      {/* Top Resizer Drag Handle */}
      <div 
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className="absolute top-0 inset-x-0 h-1.5 cursor-ns-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30 group"
        title="Drag up/down to resize bottom console (Ctrl+J to toggle)"
      >
        <div className="w-12 h-0.5 bg-slate-600 dark:bg-zinc-700 group-hover:bg-cyan-400 rounded-full mx-auto -translate-y-0.5 transition-colors" />
      </div>

      {/* Console Header & Tabs */}
      <div className="pt-2 px-3 pb-1 border-b border-slate-800 dark:border-zinc-900 flex items-center justify-between shrink-0 bg-slate-950/80 dark:bg-black/40">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 mr-3 text-cyan-400 font-mono text-xs font-bold">
            <Terminal className="w-3.5 h-3.5" />
            <span>CONSOLE</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity' 
                ? 'bg-slate-800 text-cyan-400 border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Activity Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scratchpad')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scratchpad' 
                ? 'bg-slate-800 text-amber-400 border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Quick Scratchpad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status' 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Engine Status</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {activeTab === 'activity' && (
            <button
              type="button"
              onClick={() => setLogs([])}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear Console Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Console Panel (Ctrl+J)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Content Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs custom-scrollbar">
        {activeTab === 'activity' && (
          <div className="space-y-1.5">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-center py-4 italic">No recent console entries.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <span className="text-slate-500 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {log.time}
                  </span>
                  <span className={`font-bold shrink-0 uppercase text-[9px] px-1 py-0.2 rounded ${
                    log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    log.type === 'sync' ? 'bg-cyan-500/20 text-cyan-400' :
                    log.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-300 break-all">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'scratchpad' && (
          <textarea
            value={scratchNotes}
            onChange={(e) => {
              setScratchNotes(e.target.value);
              try {
                localStorage.setItem('livepad_bottom_scratchpad', e.target.value);
              } catch (_) {}
            }}
            placeholder="Type temporary scratchpad code, ideas, or developer notes here... (auto-saved)"
            className="w-full h-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-hidden resize-none font-mono text-xs leading-relaxed"
          />
        )}

        {activeTab === 'status' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                <Info className="w-3 h-3 text-cyan-400" /> Mode
              </span>
              <p className="font-bold text-slate-200">{roomCode ? 'Collaborative Web' : 'Private Offline'}</p>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active Peers
              </span>
              <p className="font-bold text-slate-200">{activeUsersCount} Connected</p>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" /> Document Metrics
              </span>
              <p className="font-bold text-slate-200">{wordCount} words ({lineCount} lines)</p>
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                <Terminal className="w-3 h-3 text-purple-400" /> Layout Engine
              </span>
              <p className="font-bold text-slate-200">Adaptive Floating 60fps</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BottomConsolePanel);

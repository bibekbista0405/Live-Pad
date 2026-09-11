import { memo, useState, useEffect } from 'react';
import { isFirestoreQuotaExhausted, onQuotaExhaustedChange } from '../lib/firebase';
import { 
  Wifi, 
  WifiOff, 
  PanelLeft, 
  Layers, 
  Maximize2, 
  Terminal, 
  AlignLeft, 
  Sparkles,
  Zap,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  Database,
  CheckCircle2,
  X
} from 'lucide-react';
import { LeftSidebarMode } from '../hooks/useWorkspaceLayout';
import { OfflineOperation } from '../utils/offlineDB';

interface WorkspaceStatusBarProps {
  roomCode: string;
  isOnline: boolean;
  wordCount: number;
  charCount: number;
  lineCount: number;
  cursorLine: number;
  cursorCol: number;
  editorFont: string;
  editorSize: number;
  softWrap: boolean;
  isFocusMode: boolean;
  leftMode: LeftSidebarMode;
  rightOpen: boolean;
  bottomOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleBottom: () => void;
  onToggleFocus: () => void;
  isCodeMode?: boolean;
  codeLanguage?: string;
  activeUsersCount?: number;
  pendingQueueCount?: number;
  queueItems?: OfflineOperation[];
  isSyncing?: boolean;
}

function WorkspaceStatusBar({
  roomCode,
  isOnline,
  wordCount,
  charCount,
  lineCount,
  cursorLine,
  cursorCol,
  editorFont,
  editorSize,
  softWrap,
  isFocusMode,
  leftMode,
  rightOpen,
  bottomOpen,
  onToggleLeft,
  onToggleRight,
  onToggleBottom,
  onToggleFocus,
  isCodeMode,
  codeLanguage,
  activeUsersCount = 1,
  pendingQueueCount = 0,
  queueItems = [],
  isSyncing = false,
}: WorkspaceStatusBarProps) {
  const [showSyncQueueModal, setShowSyncQueueModal] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState<boolean>(() => isFirestoreQuotaExhausted());

  useEffect(() => {
    return onQuotaExhaustedChange((exhausted) => {
      setQuotaExhausted(exhausted);
    });
  }, []);

  if (isFocusMode) {
    return (
      <div className="shrink-0 h-7 bg-black/80 dark:bg-zinc-950/90 text-zinc-400 border-t border-white/10 px-3 flex items-center justify-between text-[11px] font-mono select-none z-30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Sparkles className="w-3 h-3 animate-pulse" /> Focus Mode
          </span>
          <span className="text-zinc-500">|</span>
          <span>Ln {cursorLine}, Col {cursorCol}</span>
          <span className="text-zinc-500">|</span>
          <span>{wordCount} words</span>
        </div>
        <button
          onClick={onToggleFocus}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer transition-colors"
          title="Exit Focus Mode (Esc or Ctrl+\)"
        >
          Exit Focus (Esc)
        </button>
      </div>
    );
  }

  // Count by op type
  const createCount = queueItems.filter(i => i.type === 'CREATE').length;
  const updateCount = queueItems.filter(i => i.type === 'UPDATE').length;
  const deleteCount = queueItems.filter(i => i.type === 'DELETE').length;

  return (
    <div className="relative shrink-0 h-7 bg-slate-200/90 dark:bg-[#08090d] text-slate-600 dark:text-zinc-400 border-t border-slate-300/80 dark:border-zinc-800/80 px-3 flex items-center justify-between text-[11px] font-mono select-none z-30 transition-colors">
      {/* Left: Connection & Mode Status */}
      <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
        {roomCode ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold text-[10px] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ROOM: {roomCode}</span>
            {activeUsersCount > 1 && (
              <span className="ml-1 text-slate-500 dark:text-zinc-500 font-normal">({activeUsersCount} live)</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500 font-bold text-[10px] shrink-0">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>LOCAL WORKSPACE</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-zinc-500 text-[10px]">
          {quotaExhausted ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium" title="Firestore free tier daily write limit reached. Operating seamlessly in offline local mode with cross-tab BroadcastChannel sync.">
              <Database className="w-3 h-3 text-amber-500" /> Local Sync Mode
            </span>
          ) : isOnline ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Connected online">
              <Wifi className="w-3 h-3" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-500" title="Offline mode">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        {/* Sync Queue Monitor Pill */}
        <button
          type="button"
          onClick={() => setShowSyncQueueModal(!showSyncQueueModal)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
            pendingQueueCount > 0
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-slate-300/50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700/60 hover:bg-slate-300 dark:hover:bg-zinc-800'
          }`}
          title="Click to inspect offline sync queue"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
          ) : (
            <Database className="w-3 h-3 text-cyan-500" />
          )}
          <span>Sync Queue: {pendingQueueCount} pending</span>
          {pendingQueueCount > 0 && (
            <div className="flex items-center gap-1 ml-1 text-[9px]">
              {createCount > 0 && (
                <span className="px-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded font-black flex items-center gap-0.5">
                  <PlusCircle className="w-2.5 h-2.5" /> {createCount}
                </span>
              )}
              {updateCount > 0 && (
                <span className="px-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded font-black flex items-center gap-0.5">
                  <Edit3 className="w-2.5 h-2.5" /> {updateCount}
                </span>
              )}
              {deleteCount > 0 && (
                <span className="px-1 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded font-black flex items-center gap-0.5">
                  <Trash2 className="w-2.5 h-2.5" /> {deleteCount}
                </span>
              )}
            </div>
          )}
        </button>

        {isCodeMode && (
          <div className="hidden md:flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
            <span>PLAYGROUND: {codeLanguage}</span>
          </div>
        )}
      </div>

      {/* Sync Queue Monitor Flyout Panel */}
      {showSyncQueueModal && (
        <div className="absolute bottom-8 left-3 z-50 w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3 font-sans text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-100">
              <Database className="w-4 h-4 text-cyan-500" />
              <span>Sync Queue Monitor</span>
            </div>
            <button
              onClick={() => setShowSyncQueueModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-2">
            Local operations queued for automatic cloud re-connection sync:
          </p>

          {queueItems.length === 0 ? (
            <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs font-mono flex flex-col items-center gap-1 bg-slate-50 dark:bg-zinc-950/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
              <span>Sync Queue is empty</span>
              <span className="text-[10px]">All operations are fully synced</span>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {queueItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {item.type === 'CREATE' && (
                      <span className="p-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" /> CREATE
                      </span>
                    )}
                    {item.type === 'UPDATE' && (
                      <span className="p-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[9px] flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> UPDATE
                      </span>
                    )}
                    {item.type === 'DELETE' && (
                      <span className="p-1 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[9px] flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> DELETE
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-slate-700 dark:text-zinc-200">
                        {item.entity}:{item.entityId.slice(0, 8)}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-zinc-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Center: Document Sizing & Stats */}
      <div className="hidden md:flex items-center gap-3 text-slate-500 dark:text-zinc-400 shrink-0">
        <span title="Cursor Position">Ln {cursorLine}, Col {cursorCol}</span>
        <span className="text-slate-300 dark:text-zinc-800">|</span>
        <span title="Total Lines">{lineCount} lines</span>
        <span className="text-slate-300 dark:text-zinc-800">|</span>
        <span title="Total Words & Characters">{wordCount} words ({charCount} chars)</span>
        <span className="text-slate-300 dark:text-zinc-800">|</span>
        <span title="Font Settings">{editorFont} ({editorSize}px)</span>
        <span className="text-slate-300 dark:text-zinc-800">|</span>
        <span title="Soft Wrap Status" className="flex items-center gap-1">
          <AlignLeft className="w-3 h-3 text-slate-400" /> {softWrap ? 'Wrap On' : 'Wrap Off'}
        </span>
      </div>

      {/* Right: Quick Panel Toggles */}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <button
          type="button"
          onClick={onToggleLeft}
          className={`p-1 rounded hover:bg-slate-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 ${
            leftMode === 'expanded' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-500 dark:text-zinc-500'
          }`}
          title="Toggle Explorer Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[9px] uppercase font-bold">Explorer</span>
        </button>

        <button
          type="button"
          onClick={onToggleBottom}
          className={`p-1 rounded hover:bg-slate-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 ${
            bottomOpen ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-zinc-500'
          }`}
          title="Toggle Bottom Console / Logs (Ctrl+J)"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[9px] uppercase font-bold">Console</span>
        </button>

        <button
          type="button"
          onClick={onToggleRight}
          className={`p-1 rounded hover:bg-slate-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 ${
            rightOpen ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-500 dark:text-zinc-500'
          }`}
          title="Toggle Inspector Sidebar (Ctrl+Shift+B)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[9px] uppercase font-bold">Inspector</span>
        </button>

        <div className="h-3 w-[1px] bg-slate-300 dark:bg-zinc-800 mx-1" />

        <button
          type="button"
          onClick={onToggleFocus}
          className="p-1 rounded hover:bg-amber-500/20 text-slate-600 dark:text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer flex items-center gap-1 font-bold"
          title="Focus Mode (Alt+F or Ctrl+\)"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden lg:inline text-[9px] uppercase text-amber-500 font-black">Focus</span>
        </button>
      </div>
    </div>
  );
}

export default memo(WorkspaceStatusBar);

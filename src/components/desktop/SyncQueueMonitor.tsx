import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  X,
  Database,
  Layers,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  Download,
  Trash,
  ShieldAlert,
} from 'lucide-react';
import { OfflineOperation, dequeueOfflineOp, StorageErrorDetail } from '../../utils/offlineDB';
import { SyncErrorDetail } from '../../hooks/useOfflineSync';

interface SyncQueueMonitorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingQueueCount: number;
  queueItems: OfflineOperation[];
  syncError?: SyncErrorDetail | null;
  storageError?: StorageErrorDetail | null;
  onSyncNow?: () => void;
  onRefresh?: () => void;
  onClearQueue?: () => void;
  onExportBackup?: () => void;
  onClearSyncError?: () => void;
  onClearStorageError?: () => void;
}

export const SyncQueueMonitor: React.FC<SyncQueueMonitorProps> = ({
  isOnline,
  isSyncing,
  pendingQueueCount,
  queueItems,
  syncError,
  storageError,
  onSyncNow,
  onRefresh,
  onClearQueue,
  onExportBackup,
  onClearSyncError,
  onClearStorageError,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasError = !!syncError || !!storageError;

  // Group queued items by operation type
  const typeCounts = queueItems.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const getOpBadgeProps = (type: string) => {
    switch (type) {
      case 'CREATE':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Plus size={11} className="text-emerald-400" />,
          label: 'CREATE',
        };
      case 'UPDATE':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Edit3 size={11} className="text-cyan-400" />,
          label: 'UPDATE',
        };
      case 'DELETE':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <Trash2 size={11} className="text-rose-400" />,
          label: 'DELETE',
        };
      default:
        return {
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <RefreshCw size={11} className="text-purple-400" />,
          label: type,
        };
    }
  };

  const handleRemoveItem = async (id?: number) => {
    if (!id) return;
    await dequeueOfflineOp(id);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="relative font-sans text-xs">
      {/* Status Bar Trigger Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-2 transition-all duration-200 select-none ${
            hasError
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 hover:bg-rose-900 shadow-sm'
              : pendingQueueCount > 0
              ? 'bg-slate-800/90 border-cyan-500/40 text-cyan-200 hover:bg-slate-800 hover:border-cyan-400 shadow-sm'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
          title="Click to toggle Sync Queue Monitor"
        >
          {hasError ? (
            <AlertTriangle size={13} className="text-rose-400 animate-bounce" />
          ) : (
            <Activity
              size={13}
              className={`${
                isSyncing
                  ? 'animate-spin text-cyan-400'
                  : pendingQueueCount > 0
                  ? 'text-amber-400 animate-pulse'
                  : 'text-emerald-400'
              }`}
            />
          )}
          <span className="font-semibold font-mono text-[11px]">
            {hasError ? 'Sync/Storage Warning' : `Sync Queue: ${pendingQueueCount} ${pendingQueueCount === 1 ? 'Op' : 'Ops'}`}
          </span>

          {/* Operation Type Indicators */}
          {!hasError && pendingQueueCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-700">
              {Object.entries(typeCounts).map(([type, count]) => {
                const badge = getOpBadgeProps(type);
                return (
                  <span
                    key={type}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${badge.bg}`}
                  >
                    {badge.icon}
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          )}

          {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>

        {isOnline && pendingQueueCount > 0 && onSyncNow && (
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            <span>Sync Now</span>
          </button>
        )}
      </div>

      {/* Expanded Sync Queue Monitor Panel */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 sm:w-96 max-h-[30rem] bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="px-3 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-cyan-400" />
              <span className="font-bold text-slate-200 text-xs">Sync & Storage Monitor</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                {pendingQueueCount}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {isOnline ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <Wifi size={10} /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <WifiOff size={10} /> Offline
                </span>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700/50"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Error Feedback Alerts */}
          {storageError && (
            <div className="p-2.5 bg-amber-950/60 border-b border-amber-500/40 text-amber-200 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-amber-300">
                  <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                  <span>Local Storage Alert ({storageError.source})</span>
                </div>
                {onClearStorageError && (
                  <button onClick={onClearStorageError} className="text-slate-400 hover:text-slate-200 p-0.5">
                    <X size={12} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-amber-100/90 font-mono">{storageError.message}</p>
              {storageError.actionHint && (
                <p className="text-[10px] text-amber-300/80 italic">{storageError.actionHint}</p>
              )}
            </div>
          )}

          {syncError && (
            <div className="p-2.5 bg-rose-950/60 border-b border-rose-500/40 text-rose-200 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-rose-300">
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  <span>Sync Interruption</span>
                </div>
                {onClearSyncError && (
                  <button onClick={onClearSyncError} className="text-slate-400 hover:text-slate-200 p-0.5">
                    <X size={12} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-rose-100/90 font-mono">{syncError.message}</p>
              <div className="flex items-center gap-2 pt-1">
                {onSyncNow && (
                  <button
                    onClick={onSyncNow}
                    disabled={isSyncing || !isOnline}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                    <span>Retry Sync</span>
                  </button>
                )}
                {onExportBackup && (
                  <button
                    onClick={onExportBackup}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <Download size={10} />
                    <span>Export Backup</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Type Summary Badges */}
          <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Queue Breakdown:</span>
            {['CREATE', 'UPDATE', 'DELETE', 'SYNC'].map((type) => {
              const count = typeCounts[type] || 0;
              const badge = getOpBadgeProps(type);
              return (
                <span
                  key={type}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                    count > 0 ? badge.bg : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
                  }`}
                >
                  {badge.icon}
                  <span>{badge.label}:</span>
                  <span className="font-bold">{count}</span>
                </span>
              );
            })}
          </div>

          {/* Queue Items List */}
          <div className="p-2 overflow-y-auto max-h-56 space-y-1.5">
            {queueItems.length === 0 ? (
              <div className="py-6 text-center text-slate-500 space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500/60" />
                <p className="text-xs font-medium text-slate-400">Queue is empty</p>
                <p className="text-[10px] text-slate-500">All offline actions are in sync with cloud.</p>
              </div>
            ) : (
              queueItems.map((item, idx) => {
                const badge = getOpBadgeProps(item.type);
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div
                    key={item.id || idx}
                    className="p-2 rounded bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 shrink-0 ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-slate-200 font-mono text-[11px] truncate">
                          <Database size={11} className="text-cyan-400 shrink-0" />
                          <span className="font-semibold capitalize text-slate-300">{item.entity}</span>
                          <span className="text-slate-500">#</span>
                          <span className="text-slate-400 truncate">{item.entityId}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Clock size={10} />
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700/50 transition-colors shrink-0"
                      title="Discard operation"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-3 py-2 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">
              Primary Store: <strong className="text-cyan-400">IndexedDB</strong>
            </span>
            <div className="flex items-center gap-1.5">
              {queueItems.length > 0 && onExportBackup && (
                <button
                  onClick={onExportBackup}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-[10px] transition-colors flex items-center gap-1"
                  title="Export unsynced changes as JSON backup"
                >
                  <Download size={10} />
                  <span>Backup</span>
                </button>
              )}
              {queueItems.length > 0 && onClearQueue && (
                <button
                  onClick={onClearQueue}
                  className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium text-[10px] border border-rose-700/50 transition-colors flex items-center gap-1"
                  title="Clear all queue items"
                >
                  <Trash size={10} />
                  <span>Clear</span>
                </button>
              )}
              {queueItems.length > 0 && onSyncNow && (
                <button
                  onClick={onSyncNow}
                  disabled={isSyncing || !isOnline}
                  className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Sync All</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

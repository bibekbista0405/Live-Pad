import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, HardDrive, AlertTriangle } from 'lucide-react';
import { SyncQueueMonitor } from './SyncQueueMonitor';
import { OfflineOperation, StorageErrorDetail } from '../../utils/offlineDB';
import { SyncErrorDetail } from '../../hooks/useOfflineSync';

interface OfflineBannerProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingQueueCount: number;
  queueItems?: OfflineOperation[];
  syncError?: SyncErrorDetail | null;
  storageError?: StorageErrorDetail | null;
  onSyncNow?: () => void;
  onRefresh?: () => void;
  onClearQueue?: () => void;
  onExportBackup?: () => void;
  onClearSyncError?: () => void;
  onClearStorageError?: () => void;
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  isSyncing,
  pendingQueueCount,
  queueItems = [],
  syncError,
  storageError,
  onSyncNow,
  onRefresh,
  onClearQueue,
  onExportBackup,
  onClearSyncError,
  onClearStorageError,
  className = '',
}) => {
  const hasError = !!syncError || !!storageError;

  if (isOnline && pendingQueueCount === 0 && !isSyncing && !hasError) {
    return null; // Silent when fully online & synced unless rendered explicitly or error exists
  }

  return (
    <div
      className={`px-3 py-1.5 flex flex-wrap items-center justify-between text-xs font-sans transition-all duration-300 z-50 select-none ${
        hasError
          ? 'bg-rose-950/90 border-b border-rose-500/50 text-rose-200'
          : !isOnline
          ? 'bg-amber-500/15 border-b border-amber-500/30 text-amber-200'
          : isSyncing
          ? 'bg-indigo-500/15 border-b border-indigo-500/30 text-indigo-200'
          : 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-200'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {hasError ? (
          <>
            <AlertTriangle size={14} className="text-rose-400 shrink-0 animate-pulse" />
            <span className="font-semibold">
              {storageError
                ? `Storage Warning (${storageError.source}): ${storageError.message}`
                : `Sync Issue: ${syncError?.message}`}
            </span>

            {/* Quick Banner Action Controls */}
            <div className="flex items-center gap-1.5 ml-2">
              {syncError && onSyncNow && (
                <button
                  onClick={onSyncNow}
                  disabled={isSyncing || !isOnline}
                  className="px-2 py-0.5 bg-rose-800 hover:bg-rose-700 text-white rounded text-[10px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                  title="Retry syncing queued changes now"
                >
                  <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Retry Sync</span>
                </button>
              )}
              {storageError && onClearStorageError && (
                <button
                  onClick={onClearStorageError}
                  className="px-2 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded text-[10px] font-semibold transition-colors"
                  title="Dismiss storage warning notification"
                >
                  Dismiss
                </button>
              )}
              {syncError && onClearSyncError && (
                <button
                  onClick={onClearSyncError}
                  className="px-2 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded text-[10px] font-semibold transition-colors"
                  title="Dismiss sync issue notification"
                >
                  Dismiss
                </button>
              )}
            </div>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff size={14} className="text-amber-400 shrink-0 animate-pulse" />
            <span className="font-semibold">
              Offline Mode — Everything is saved locally. Changes will sync automatically when connected.
            </span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={14} className="text-indigo-400 shrink-0 animate-spin" />
            <span className="font-semibold">Syncing queued changes ({pendingQueueCount} remaining)...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">Synced — All changes uploaded to cloud.</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <HardDrive size={12} className="text-slate-500" />
          <span>IndexedDB Active</span>
        </span>

        {/* Sync Queue Monitor Component */}
        <SyncQueueMonitor
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingQueueCount={pendingQueueCount}
          queueItems={queueItems}
          syncError={syncError}
          storageError={storageError}
          onSyncNow={onSyncNow}
          onRefresh={onRefresh}
          onClearQueue={onClearQueue}
          onExportBackup={onExportBackup}
          onClearSyncError={onClearSyncError}
          onClearStorageError={onClearStorageError}
        />
      </div>
    </div>
  );
};

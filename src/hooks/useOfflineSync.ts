import { useState, useEffect, useCallback } from 'react';
import { db, ensureAuth, isFirebaseConfigured, isFirestoreQuotaExhausted, markQuotaExhausted } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  getOfflineQueue,
  dequeueOfflineOp,
  enqueueOfflineOp,
  clearOfflineQueue,
  OfflineOperation,
  StorageErrorDetail,
  addStorageErrorListener,
  notifyStorageError,
} from '../utils/offlineDB';
import { DocumentConflict } from '../types';

export interface SyncErrorDetail {
  message: string;
  timestamp: number;
  opId?: number;
  entity?: string;
  code?: string;
}

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingQueueCount: number;
  queueItems: OfflineOperation[];
  syncError: SyncErrorDetail | null;
  storageError: StorageErrorDetail | null;
  processQueue: () => Promise<void>;
  enqueueOp: (op: Omit<OfflineOperation, 'id' | 'timestamp'>) => Promise<void>;
  refreshQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  clearSyncError: () => void;
  clearStorageError: () => void;
  exportQueueBackup: () => void;
}

export function useOfflineSync(
  onSyncSuccess?: (msg: string) => void,
  onConflictDetected?: (conflict: DocumentConflict) => void
): OfflineSyncState {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [queueItems, setQueueItems] = useState<OfflineOperation[]>([]);
  const [syncError, setSyncError] = useState<SyncErrorDetail | null>(null);
  const [storageError, setStorageError] = useState<StorageErrorDetail | null>(null);

  const updateQueueCount = useCallback(async () => {
    try {
      const q = await getOfflineQueue();
      setPendingQueueCount(q.length);
      setQueueItems(q);
    } catch (e: any) {
      console.warn('[useOfflineSync] Error updating queue count:', e);
      setPendingQueueCount(0);
      setQueueItems([]);
    }
  }, []);

  // Listen for low-level IndexedDB or LocalStorage failure events
  useEffect(() => {
    const removeListener = addStorageErrorListener((errDetail) => {
      setStorageError(errDetail);
    });
    return removeListener;
  }, []);

  const processQueue = useCallback(async () => {
    if (!navigator.onLine || !isFirebaseConfigured || !db || isFirestoreQuotaExhausted()) return;

    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) {
        setPendingQueueCount(0);
        return;
      }

      setIsSyncing(true);
      const user = await ensureAuth();

      for (const item of queue) {
        if (!item.id) continue;

        try {
          if (item.entity === 'rooms') {
            const roomRef = doc(db, 'rooms', item.entityId);
            const snap = await getDoc(roomRef);

            if (item.type === 'CREATE' || item.type === 'UPDATE') {
              if (snap.exists()) {
                const data = snap.data();
                const remoteUpdatedAt =
                  data.updatedAt?.toMillis?.() ||
                  (data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : 0) ||
                  0;
                const remoteContent = data.content || '';
                const localContent = item.payload?.content || '';

                // Conflict detection upon re-establishing connection
                if (
                  remoteContent &&
                  localContent &&
                  remoteContent !== localContent &&
                  remoteUpdatedAt > item.timestamp
                ) {
                  if (onConflictDetected) {
                    onConflictDetected({
                      documentId: item.entityId,
                      documentTitle: data.title || data.workspaceName || `Workspace #${item.entityId}`,
                      localContent,
                      remoteContent,
                      baseContent: item.payload?.baseContent || '',
                      queueItemId: item.id,
                    });
                  }
                  // Pause processing this queued item until manual conflict resolution
                  continue;
                }

                // Simple timestamp merge if no blocking conflict
                if (!data.updatedAt || item.timestamp >= remoteUpdatedAt) {
                  await setDoc(roomRef, { ...item.payload, updatedAt: serverTimestamp() }, { merge: true });
                }
              } else {
                await setDoc(roomRef, { ...item.payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
              }
            }
          } else if (item.entity === 'users' && user) {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { ...item.payload, updatedAt: serverTimestamp() }, { merge: true });
          } else if (item.entity === 'workspaces' || item.entity === ('workspaces' as any)) {
            const wsRef = doc(db, 'workspaces', item.entityId);
            await setDoc(wsRef, { ...item.payload, updatedAt: serverTimestamp() }, { merge: true });
          }

          // Successfully processed op, remove from queue
          await dequeueOfflineOp(item.id);
        } catch (opErr: any) {
          console.warn(`[useOfflineSync] Error processing op ID ${item.id}:`, opErr);
          
          // Check for quota limit or permission error
          if (opErr?.code === 'resource-exhausted' || opErr?.message?.includes('quota')) {
            markQuotaExhausted();
            notifyStorageError({
              source: 'Firestore',
              operation: 'processQueue',
              message: 'Firestore cloud quota limit reached. LivePad is operating seamlessly in local offline mode.',
              recoverable: true,
              actionHint: 'All unsynced edits remain safely saved in local storage.',
            });
          }

          setSyncError({
            message: opErr?.message || `Failed to sync change for ${item.entity} (${item.entityId})`,
            timestamp: Date.now(),
            opId: item.id,
            entity: item.entity,
            code: opErr?.code,
          });
          // Don't dequeue so it retries on next manual or automatic sync
          break;
        }
      }

      const remaining = await getOfflineQueue();
      setPendingQueueCount(remaining.length);
      setQueueItems(remaining);

      if (remaining.length === 0) {
        setSyncError(null);
        if (onSyncSuccess) {
          onSyncSuccess('All offline changes synced to cloud successfully!');
        }
      }
    } catch (err: any) {
      console.warn('[useOfflineSync] Error processing queue:', err);
      setSyncError({
        message: err?.message || 'Background sync process encountered an interruption.',
        timestamp: Date.now(),
      });
    } finally {
      setIsSyncing(false);
      updateQueueCount();
    }
  }, [onSyncSuccess, onConflictDetected, updateQueueCount]);

  const enqueueOp = useCallback(
    async (op: Omit<OfflineOperation, 'id' | 'timestamp'>) => {
      try {
        await enqueueOfflineOp(op);
      } catch (err: any) {
        console.warn('[useOfflineSync] Enqueue operation failed:', err);
      }
      await updateQueueCount();
      if (navigator.onLine) {
        processQueue();
      }
    },
    [processQueue, updateQueueCount]
  );

  const clearQueue = useCallback(async () => {
    try {
      await clearOfflineQueue();
      setSyncError(null);
      await updateQueueCount();
    } catch (err: any) {
      console.warn('[useOfflineSync] Clear queue error:', err);
    }
  }, [updateQueueCount]);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  const clearStorageError = useCallback(() => {
    setStorageError(null);
  }, []);

  const exportQueueBackup = useCallback(() => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(queueItems, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `livepad_offline_queue_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      console.warn('[useOfflineSync] Export queue backup error:', e);
    }
  }, [queueItems]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateQueueCount();
    if (navigator.onLine) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue, updateQueueCount]);

  return {
    isOnline,
    isSyncing,
    pendingQueueCount,
    queueItems,
    syncError,
    storageError,
    processQueue,
    enqueueOp,
    refreshQueue: updateQueueCount,
    clearQueue,
    clearSyncError,
    clearStorageError,
    exportQueueBackup,
  };
}

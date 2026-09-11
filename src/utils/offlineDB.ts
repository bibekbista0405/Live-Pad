/**
 * LivePad Desktop - IndexedDB Offline Storage Engine
 * Database Name: LivePadDB
 */

const DB_NAME = 'LivePadDB';
const DB_VERSION = 1;

export const STORES = [
  'workspaces',
  'projects',
  'documents',
  'folders',
  'files',
  'trash',
  'history',
  'settings',
  'profile',
  'extensions',
  'themes',
  'offlineQueue',
] as const;

export type StoreName = (typeof STORES)[number];

export interface OfflineOperation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  entity: StoreName | 'rooms' | 'users' | 'workspaces';
  entityId: string;
  payload: any;
  timestamp: number;
}

export interface StorageErrorDetail {
  id: string;
  source: 'IndexedDB' | 'LocalStorage' | 'BackgroundSync' | 'Firestore';
  operation: string;
  message: string;
  timestamp: number;
  recoverable: boolean;
  actionHint?: string;
}

type StorageErrorListener = (error: StorageErrorDetail) => void;
const errorListeners = new Set<StorageErrorListener>();

export function addStorageErrorListener(listener: StorageErrorListener): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function notifyStorageError(
  error: Omit<StorageErrorDetail, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
) {
  const detail: StorageErrorDetail = {
    id: error.id || `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: error.timestamp || Date.now(),
    ...error,
  };
  errorListeners.forEach((fn) => {
    try {
      fn(detail);
    } catch (e) {
      console.warn('[LivePadDB] Storage error listener exception:', e);
    }
  });
}

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export function initOfflineDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    const err = new Error('IndexedDB is not supported in this environment');
    notifyStorageError({
      source: 'IndexedDB',
      operation: 'init',
      message: 'IndexedDB is not supported by your browser environment.',
      recoverable: false,
      actionHint: 'Please use a modern browser with browser storage enabled.',
    });
    return Promise.reject(err);
  }
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          if (store === 'offlineQueue') {
            db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
          } else {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      });
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      const dbError = (event.target as IDBOpenDBRequest).error;
      const errMsg = dbError?.message || 'Failed to open IndexedDB database';
      console.error('[LivePadDB] Failed to open IndexedDB:', dbError);
      notifyStorageError({
        source: 'IndexedDB',
        operation: 'init',
        message: `Database Initialization Error: ${errMsg}`,
        recoverable: true,
        actionHint: 'Check browser storage permissions or private window settings.',
      });
      reject(dbError);
    };
  });

  return dbPromise;
}

export async function putOfflineItem<T extends { id: string }>(storeName: StoreName, item: T): Promise<T> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const req = store.put(item);

      req.onsuccess = () => resolve(item);
      req.onerror = () => {
        const err = req.error;
        notifyStorageError({
          source: 'IndexedDB',
          operation: `putItem:${storeName}`,
          message: `Failed to save local record to ${storeName}: ${err?.message || 'Transaction error'}`,
          recoverable: true,
          actionHint: 'Edits will remain in memory until storage is cleared or restored.',
        });
        reject(err);
      };
    });
  } catch (err: any) {
    console.warn(`[LivePadDB] Error putting item into ${storeName}:`, err);
    return item;
  }
}

export async function getOfflineItem<T>(storeName: StoreName, id: string): Promise<T | null> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err: any) {
    console.warn(`[LivePadDB] Error getting item from ${storeName}:`, err);
    return null;
  }
}

export async function getAllOfflineItems<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err: any) {
    console.warn(`[LivePadDB] Error getting all items from ${storeName}:`, err);
    return [];
  }
}

export async function deleteOfflineItem(storeName: StoreName, id: string): Promise<boolean> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err: any) {
    console.warn(`[LivePadDB] Error deleting item from ${storeName}:`, err);
    return false;
  }
}

// Queue methods for offline synchronization
export async function enqueueOfflineOp(op: Omit<OfflineOperation, 'id' | 'timestamp'> & { timestamp?: number }): Promise<OfflineOperation> {
  const fullOp: OfflineOperation = {
    ...op,
    timestamp: op.timestamp || Date.now(),
  };

  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineQueue', 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const req = store.add(fullOp);

      req.onsuccess = () => {
        fullOp.id = req.result as number;
        resolve(fullOp);
      };
      req.onerror = () => {
        const err = req.error;
        notifyStorageError({
          source: 'IndexedDB',
          operation: 'enqueueOfflineOp',
          message: `Failed to queue offline operation: ${err?.message || 'Storage write failed'}`,
          recoverable: true,
          actionHint: 'Your changes are temporarily held in state.',
        });
        reject(err);
      };
    });
  } catch (err: any) {
    console.warn('[LivePadDB] Failed to enqueue offline operation:', err);
    return fullOp;
  }
}

export async function getOfflineQueue(): Promise<OfflineOperation[]> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineQueue', 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as OfflineOperation[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err: any) {
    console.warn('[LivePadDB] Error fetching offline queue:', err);
    return [];
  }
}

export async function dequeueOfflineOp(id: number): Promise<boolean> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineQueue', 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err: any) {
    console.warn('[LivePadDB] Error dequeuing operation:', err);
    return false;
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineQueue', 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err: any) {
    console.warn('[LivePadDB] Error clearing offline queue:', err);
  }
}

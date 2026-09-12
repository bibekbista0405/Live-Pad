import { db, isFirestoreQuotaExhausted, markQuotaExhausted } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { putOfflineItem, getAllOfflineItems, deleteOfflineItem } from '../utils/offlineDB';
import { saveRecentWorkspace, getRecentWorkspaces, removeRecentWorkspace, RecentWorkspaceItem } from '../utils/recentWorkspaces';

export interface UserWorkspaceRef {
  id: string; // workspaceId or roomCode
  workspaceId: string;
  roomCode: string;
  title: string;
  category?: string;
  workspaceType?: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Commenter' | 'Viewer' | 'Guest' | string;
  joinedAt: number;
  lastOpened: number;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  owner: boolean;
  ownerName?: string;
  ownerId?: string;
  icon?: string;
  syncStatus?: 'synced' | 'pending' | 'offline';
  lastSyncTime?: number;
  memberCount?: number;
  activeUsers?: number;
  isOnline?: boolean;
  snippet?: string;
}

export class WorkspaceLibraryService {
  /**
   * Save or update a workspace reference in a user's personal library (Firestore + IndexedDB)
   */
  static async saveWorkspaceToLibrary(
    uid: string | null,
    refData: Partial<UserWorkspaceRef> & { workspaceId: string; title: string }
  ): Promise<UserWorkspaceRef> {
    const wsId = refData.workspaceId;
    const now = Date.now();

    // Check existing in IndexedDB first to preserve flags
    let existingItem: UserWorkspaceRef | null = null;
    try {
      const offlineItems = await getAllOfflineItems<UserWorkspaceRef>('workspaces');
      existingItem = offlineItems.find((w) => w.workspaceId === wsId || w.id === wsId) || null;
    } catch (e) {
      console.warn('[WorkspaceLibraryService] Error loading offline items for preservation:', e);
    }

    const fullRef: UserWorkspaceRef = {
      id: wsId,
      workspaceId: wsId,
      roomCode: refData.roomCode || wsId,
      title: refData.title || existingItem?.title || 'Untitled Workspace',
      category: refData.category || existingItem?.category || 'coding_session',
      workspaceType: refData.workspaceType || existingItem?.workspaceType || 'team',
      role: refData.role || existingItem?.role || 'Editor',
      joinedAt: refData.joinedAt || existingItem?.joinedAt || now,
      lastOpened: refData.lastOpened || now,
      favorite: refData.favorite ?? existingItem?.favorite ?? false,
      pinned: refData.pinned ?? existingItem?.pinned ?? false,
      archived: refData.archived ?? existingItem?.archived ?? false,
      owner: refData.owner ?? existingItem?.owner ?? (refData.role?.toLowerCase() === 'owner'),
      ownerName: refData.ownerName || existingItem?.ownerName || '',
      ownerId: refData.ownerId || existingItem?.ownerId || uid || '',
      icon: refData.icon || existingItem?.icon || 'FolderKanban',
      syncStatus: refData.syncStatus || 'synced',
      lastSyncTime: now,
      memberCount: refData.memberCount || existingItem?.memberCount || 1,
      activeUsers: refData.activeUsers ?? existingItem?.activeUsers ?? 0,
      isOnline: refData.isOnline ?? existingItem?.isOnline ?? false,
      snippet: refData.snippet || existingItem?.snippet || '',
    };

    // 1. Store in local IndexedDB
    try {
      await putOfflineItem('workspaces', fullRef);
    } catch (err) {
      console.warn('[WorkspaceLibraryService] IndexedDB save warning:', err);
    }

    // 2. Store in localStorage for legacy/quick fallback
    try {
      const recentItem: RecentWorkspaceItem = {
        id: wsId,
        code: fullRef.roomCode,
        title: fullRef.title,
        category: fullRef.category,
        type: fullRef.workspaceType,
        lastAccessedAt: fullRef.lastOpened,
        isFavorite: fullRef.favorite,
        isPinned: fullRef.pinned,
        isLocal: false,
        snippet: fullRef.snippet,
      };
      saveRecentWorkspace(recentItem);
    } catch (err) {
      // ignore
    }

    // 3. Store in Firestore user subcollection if signed in and db available
    if (uid && db && !isFirestoreQuotaExhausted()) {
      try {
        const userWsDocRef = doc(db, 'users', uid, 'workspaces', wsId);
        await setDoc(userWsDocRef, fullRef, { merge: true });
      } catch (err) {
        if (String(err).includes('resource-exhausted') || String(err).includes('Quota')) {
          markQuotaExhausted();
        } else {
          console.warn('[WorkspaceLibraryService] Firestore user workspace ref save warning:', err);
        }
      }
    }

    return fullRef;
  }

  /**
   * Auto-migrate legacy/unregistered workspaces into user's Firestore & IndexedDB library
   */
  static async autoMigrateLegacyWorkspaces(uid: string | null): Promise<void> {
    try {
      const recents = getRecentWorkspaces();
      if (!recents || recents.length === 0) return;

      for (const rec of recents) {
        const wsId = rec.id || rec.code;
        if (!wsId) continue;

        await this.saveWorkspaceToLibrary(uid, {
          workspaceId: wsId,
          roomCode: rec.code || wsId,
          title: rec.title || 'Collaborative Workspace',
          category: rec.category || 'coding_session',
          workspaceType: rec.type || 'team',
          role: 'Editor',
          favorite: rec.isFavorite || false,
          pinned: rec.isPinned || false,
          joinedAt: rec.lastAccessedAt || Date.now(),
          lastOpened: rec.lastAccessedAt || Date.now(),
          snippet: rec.snippet || '',
        });
      }
    } catch (err) {
      console.warn('[WorkspaceLibraryService] Auto-migration error:', err);
    }
  }

  /**
   * Subscribe to a user's workspace library (Combines IndexedDB cache + Firestore snapshot)
   */
  static subscribeUserLibrary(
    uid: string | null,
    onUpdate: (workspaces: UserWorkspaceRef[]) => void
  ): () => void {
    let unsubFirestore: (() => void) | null = null;
    let isSubscribed = true;

    // Load initial local data from IndexedDB + localStorage immediately
    const loadLocalData = async () => {
      try {
        const offlineItems = await getAllOfflineItems<UserWorkspaceRef>('workspaces');
        const recents = getRecentWorkspaces();

        const mergedMap = new Map<string, UserWorkspaceRef>();

        // IndexedDB items
        offlineItems.forEach((item) => {
          if (item && item.workspaceId) {
            mergedMap.set(item.workspaceId, item);
          }
        });

        // Merge localStorage recents if missing in IndexedDB
        recents.forEach((rec) => {
          const id = rec.id || rec.code;
          if (id && !mergedMap.has(id)) {
            const fallbackRef: UserWorkspaceRef = {
              id,
              workspaceId: id,
              roomCode: rec.code || id,
              title: rec.title || 'Workspace',
              category: rec.category || 'coding_session',
              workspaceType: rec.type || 'team',
              role: 'Editor',
              joinedAt: rec.lastAccessedAt || Date.now(),
              lastOpened: rec.lastAccessedAt || Date.now(),
              favorite: rec.isFavorite || false,
              pinned: rec.isPinned || false,
              archived: false,
              owner: false,
              ownerName: 'LivePad',
              syncStatus: rec.isLocal ? 'offline' : 'synced',
              lastSyncTime: rec.lastAccessedAt || Date.now(),
              memberCount: 1,
              snippet: rec.snippet || '',
            };
            mergedMap.set(id, fallbackRef);
          }
        });

        const list = Array.from(mergedMap.values()).sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.lastOpened - a.lastOpened;
        });

        if (isSubscribed) {
          onUpdate(list);
        }

        // Trigger auto migration in background
        this.autoMigrateLegacyWorkspaces(uid);
      } catch (err) {
        console.warn('[WorkspaceLibraryService] Error loading local library:', err);
      }
    };

    loadLocalData();

    // Subscribe to Firestore subcollection `users/{uid}/workspaces` if available
    if (uid && db) {
      try {
        const userWsColRef = collection(db, 'users', uid, 'workspaces');
        unsubFirestore = onSnapshot(
          userWsColRef,
          (snapshot) => {
            if (!isSubscribed) return;
            const itemsFromDb: UserWorkspaceRef[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as UserWorkspaceRef;
              if (data && (data.workspaceId || docSnap.id)) {
                itemsFromDoc({ ...data, id: docSnap.id, workspaceId: data.workspaceId || docSnap.id }, itemsFromDb);
              }
            });

            // Sync itemsFromDb to local IndexedDB
            itemsFromDb.forEach((item) => {
              putOfflineItem('workspaces', item).catch((err) => {
                console.warn('[WorkspaceLibraryService] Error caching workspace to IndexedDB:', err);
              });
            });

            itemsFromDb.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return b.lastOpened - a.lastOpened;
            });

            onUpdate(itemsFromDb);
          },
          (err) => {
            console.warn('[WorkspaceLibraryService] Firestore library snapshot error:', err);
          }
        );
      } catch (err) {
        console.warn('[WorkspaceLibraryService] Failed to attach Firestore listener:', err);
      }
    }

    return () => {
      isSubscribed = false;
      if (unsubFirestore) unsubFirestore();
    };
  }

  /**
   * Toggle favorite status for a workspace in user's library
   */
  static async toggleFavorite(uid: string | null, workspaceId: string, isFavorite: boolean): Promise<void> {
    const now = Date.now();
    try {
      const offlineItems = await getAllOfflineItems<UserWorkspaceRef>('workspaces');
      const item = offlineItems.find((w) => w.workspaceId === workspaceId || w.id === workspaceId);
      if (item) {
        item.favorite = isFavorite;
        await putOfflineItem('workspaces', item);
      }
    } catch (e) {
      console.warn('[WorkspaceLibraryService] toggleFavorite local update failed:', e);
    }

    if (uid && db) {
      try {
        const userWsDocRef = doc(db, 'users', uid, 'workspaces', workspaceId);
        await updateDoc(userWsDocRef, { favorite: isFavorite, lastOpened: now });
      } catch (e) {
        console.warn('[WorkspaceLibraryService] toggleFavorite Firestore update failed:', e);
      }
    }
  }

  /**
   * Toggle pinned status for a workspace in user's library
   */
  static async togglePin(uid: string | null, workspaceId: string, isPinned: boolean): Promise<void> {
    const now = Date.now();
    try {
      const offlineItems = await getAllOfflineItems<UserWorkspaceRef>('workspaces');
      const item = offlineItems.find((w) => w.workspaceId === workspaceId || w.id === workspaceId);
      if (item) {
        item.pinned = isPinned;
        await putOfflineItem('workspaces', item);
      }
    } catch (e) {
      console.warn('[WorkspaceLibraryService] togglePin local update failed:', e);
    }

    if (uid && db) {
      try {
        const userWsDocRef = doc(db, 'users', uid, 'workspaces', workspaceId);
        await updateDoc(userWsDocRef, { pinned: isPinned, lastOpened: now });
      } catch (e) {
        console.warn('[WorkspaceLibraryService] togglePin Firestore update failed:', e);
      }
    }
  }

  /**
   * Toggle archived status for a workspace in user's library
   */
  static async toggleArchive(uid: string | null, workspaceId: string, isArchived: boolean): Promise<void> {
    try {
      const offlineItems = await getAllOfflineItems<UserWorkspaceRef>('workspaces');
      const item = offlineItems.find((w) => w.workspaceId === workspaceId || w.id === workspaceId);
      if (item) {
        item.archived = isArchived;
        await putOfflineItem('workspaces', item);
      }
    } catch (e) {
      console.warn('[WorkspaceLibraryService] toggleArchive local update failed:', e);
    }

    if (uid && db) {
      try {
        const userWsDocRef = doc(db, 'users', uid, 'workspaces', workspaceId);
        await updateDoc(userWsDocRef, { archived: isArchived });
      } catch (e) {
        console.warn('[WorkspaceLibraryService] toggleArchive Firestore update failed:', e);
      }
    }
  }

  /**
   * Remove workspace reference from current user's personal library.
   * (Does NOT delete the workspace itself or affect other members)
   */
  static async removeFromLibrary(uid: string | null, workspaceId: string): Promise<void> {
    try {
      await deleteOfflineItem('workspaces', workspaceId);
      removeRecentWorkspace(workspaceId);
    } catch (e) {
      console.warn('[WorkspaceLibraryService] removeFromLibrary local delete failed:', e);
    }

    if (uid && db) {
      try {
        const userWsDocRef = doc(db, 'users', uid, 'workspaces', workspaceId);
        await deleteDoc(userWsDocRef);
      } catch (e) {
        console.warn('[WorkspaceLibraryService] removeFromLibrary Firestore delete failed:', e);
      }
    }
  }

  /**
   * Permanent deletion by Owner: Deletes the room document and local cache
   */
  static async deleteWorkspacePermanently(uid: string | null, workspaceId: string): Promise<void> {
    // 1. Delete local caches
    await this.removeFromLibrary(uid, workspaceId);

    // 2. Delete Firestore room document if caller is owner
    if (db) {
      try {
        const roomDocRef = doc(db, 'rooms', workspaceId);
        await deleteDoc(roomDocRef);
      } catch (e) {
        console.warn('Failed to delete Firestore room document:', e);
      }
    }
  }
}

function itemsFromDoc(docData: UserWorkspaceRef, list: UserWorkspaceRef[]) {
  if (!list.some((item) => item.workspaceId === docData.workspaceId)) {
    list.push(docData);
  }
}

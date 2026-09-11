export interface RecentWorkspaceItem {
  id: string; // roomCode or local note id
  code: string;
  title: string;
  category?: string;
  type?: string;
  lastAccessedAt: number;
  isPinned?: boolean;
  isFavorite?: boolean;
  isLocal?: boolean;
  lastEditedBy?: string;
  snippet?: string;
}

const RECENTS_KEY = 'livepad_recent_workspaces';
const LAST_ACTIVE_KEY = 'livepad_last_active_workspace';

export function getRecentWorkspaces(): RecentWorkspaceItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    let items: RecentWorkspaceItem[] = raw ? JSON.parse(raw) : [];

    // Also scan for offline local rooms in localStorage
    const localRoomKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('livepad_local_room_') && 
          !key.includes('_title_') && 
          !key.includes('_label_') && 
          !key.includes('_attachments_') && 
          !key.includes('_history_')) {
        const roomCode = key.replace('livepad_local_room_', '');
        localRoomKeys.push(roomCode);
      }
    }

    // Merge discovered offline local rooms if not in items
    localRoomKeys.forEach((code) => {
      if (!items.some((it) => it.code === code || it.id === code)) {
        const title = localStorage.getItem(`livepad_local_room_title_${code}`) || `Room #${code}`;
        const content = localStorage.getItem(`livepad_local_room_${code}`) || '';
        const category = localStorage.getItem(`livepad_local_room_label_${code}`) || 'coding_session';
        items.push({
          id: code,
          code,
          title,
          category,
          lastAccessedAt: Date.now() - 3600000,
          isLocal: true,
          snippet: content.slice(0, 80).replace(/<[^>]*>/g, ''),
        });
      }
    });

    // Also include local notepads
    try {
      const savedNotepadsRaw = localStorage.getItem('livepad_local_notepads');
      if (savedNotepadsRaw) {
        const notepads = JSON.parse(savedNotepadsRaw);
        if (Array.isArray(notepads)) {
          notepads.forEach((np: any) => {
            if (np.id && !items.some((it) => it.id === np.id)) {
              items.push({
                id: np.id,
                code: np.id,
                title: np.title || 'Untitled Note',
                category: 'personal',
                lastAccessedAt: np.updatedAt || Date.now(),
                isLocal: true,
                snippet: (np.content || '').slice(0, 80).replace(/<[^>]*>/g, ''),
              });
            }
          });
        }
      }
    } catch {
      // ignore
    }

    // Sort pinned first, then lastAccessedAt descending
    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastAccessedAt - a.lastAccessedAt;
    });

    return items;
  } catch (e) {
    console.error('Error reading recent workspaces:', e);
    return [];
  }
}

export function saveRecentWorkspace(item: RecentWorkspaceItem): RecentWorkspaceItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const items = getRecentWorkspaces();
    const existingIndex = items.findIndex((it) => it.id === item.id || it.code === item.code);

    let updated: RecentWorkspaceItem[];
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const merged: RecentWorkspaceItem = {
        ...existing,
        ...item,
        lastAccessedAt: Date.now(),
      };
      items.splice(existingIndex, 1);
      updated = [merged, ...items];
    } else {
      updated = [{ ...item, lastAccessedAt: Date.now() }, ...items];
    }

    // Keep max 30 items
    updated = updated.slice(0, 30);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    saveLastActiveWorkspace(updated[0]);
    return updated;
  } catch (e) {
    console.error('Error saving recent workspace:', e);
    return [];
  }
}

export function togglePinWorkspace(id: string): RecentWorkspaceItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const items = getRecentWorkspaces();
    const updated = items.map((it) => {
      if (it.id === id || it.code === id) {
        return { ...it, isPinned: !it.isPinned };
      }
      return it;
    });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function toggleFavoriteWorkspace(id: string): RecentWorkspaceItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const items = getRecentWorkspaces();
    const updated = items.map((it) => {
      if (it.id === id || it.code === id) {
        return { ...it, isFavorite: !it.isFavorite };
      }
      return it;
    });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function togglePinRecentWorkspace(id: string): RecentWorkspaceItem[] {
  return togglePinWorkspace(id);
}

export function removeRecentWorkspace(id: string): RecentWorkspaceItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const items = getRecentWorkspaces();
    const updated = items.filter((it) => it.id !== id && it.code !== id);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function saveLastActiveWorkspace(item: RecentWorkspaceItem | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!item) {
      localStorage.removeItem(LAST_ACTIVE_KEY);
    } else {
      localStorage.setItem(LAST_ACTIVE_KEY, JSON.stringify(item));
    }
  } catch (e) {
    // ignore
  }
}

export function getLastActiveWorkspace(): RecentWorkspaceItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const items = getRecentWorkspaces();
    return items[0] || null;
  } catch (e) {
    return null;
  }
}

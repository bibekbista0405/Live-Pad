import { useMemo } from 'react';
import type { NoteRoom, UserPresence, UserStatus, WorkspaceParticipant } from '../types';

interface WorkspacePresenceResult {
  activeUsers: UserPresence[];
  allParticipants: Array<WorkspaceParticipant & { isOnline: boolean; lastActive?: number }>;
}

export function useWorkspacePresence(room: NoteRoom | null, uid: string): WorkspacePresenceResult {
  const activeUsers = useMemo(() => {
    const users = (Object.values(room?.users || {}) as UserPresence[]).map(user => {
      const timeDiff = Date.now() - (user.lastActive || 0);
      let status: UserStatus = user.status || (user.isOnline ? 'online' : 'offline');
      if (user.isOnline && timeDiff > 30000 && timeDiff <= 120000) status = 'away';
      else if (timeDiff > 120000 && user.uid !== uid) status = 'offline';
      return { ...user, isOnline: status === 'online' || status === 'away', status, isTyping: !!room?.typingUsers?.[user.uid] };
    });
    return users.filter(user => user.isOnline || user.uid === uid).sort((a, b) => a.joinedAt - b.joinedAt);
  }, [room, uid]);

  const allParticipants = useMemo(() => {
    if (!room) return [];
    const map = new Map<string, WorkspaceParticipant & { isOnline: boolean; lastActive?: number }>();
    Object.entries(room.participants || {}).forEach(([pUid, participant]) => {
      map.set(pUid, { ...participant, isOnline: !!participant.isOnline, lastActive: participant.lastActive || 0 });
    });
    Object.entries(room.users || {}).forEach(([uUid, user]) => {
      const existing = map.get(uUid);
      const isOnline = !!user.isOnline && (Date.now() - (user.lastActive || 0) < 60000);
      if (existing) {
        map.set(uUid, { ...existing, name: user.name || existing.name, color: user.color || existing.color, isOnline, lastActive: user.lastActive || existing.lastActive });
      } else {
        map.set(uUid, { uid: uUid, name: user.name || 'Anonymous', role: user.role || (uUid === room.creatorId ? 'owner' : 'editor'), joinedAt: user.joinedAt || Date.now(), color: user.color, isOnline, lastActive: user.lastActive });
      }
    });
    if (room.creatorId && !map.has(room.creatorId)) {
      map.set(room.creatorId, { uid: room.creatorId, name: 'Workspace Owner', role: 'owner', joinedAt: room.createdAt || Date.now(), isOnline: false, lastActive: 0 });
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.uid === room.creatorId) return -1;
      if (b.uid === room.creatorId) return 1;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [room]);

  return { activeUsers, allParticipants };
}

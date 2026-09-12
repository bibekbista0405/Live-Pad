import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { deleteField, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { NoteRoom, WorkspaceRole } from '../types';

interface Options { roomId: string | null; uid: string; useFirebase: boolean; setRoom: Dispatch<SetStateAction<NoteRoom | null>>; }

export function useWorkspaceMembership({ roomId, uid, useFirebase, setRoom }: Options) {
  const archiveWorkspace = useCallback(async () => {
    if (!roomId) return;
    if (useFirebase && db) await updateDoc(doc(db, 'rooms', roomId), { status: 'archived', archivedAt: serverTimestamp() });
    else { localStorage.setItem(`livepad_room_status_${roomId}`, 'archived'); setRoom(prev => prev ? { ...prev, status: 'archived' } : null); }
  }, [roomId, useFirebase, setRoom]);

  const restoreWorkspace = useCallback(async () => {
    if (!roomId) return;
    if (useFirebase && db) await updateDoc(doc(db, 'rooms', roomId), { status: 'active', restoredAt: serverTimestamp() });
    else { localStorage.setItem(`livepad_room_status_${roomId}`, 'active'); setRoom(prev => prev ? { ...prev, status: 'active' } : null); }
  }, [roomId, useFirebase, setRoom]);

  const deleteWorkspace = useCallback(async () => {
    if (!roomId) return;
    if (useFirebase && db) await deleteDoc(doc(db, 'rooms', roomId));
    for (const key of [`livepad_local_room_${roomId}`, `livepad_local_room_title_${roomId}`, `livepad_local_room_label_${roomId}`, `livepad_local_room_attachments_${roomId}`, `livepad_local_room_history_${roomId}`, `livepad_room_status_${roomId}`]) localStorage.removeItem(key);
    try {
      const recentsStr = localStorage.getItem('livepad_recent_workspaces');
      if (recentsStr) {
        const recents = JSON.parse(recentsStr);
        localStorage.setItem('livepad_recent_workspaces', JSON.stringify(recents.filter((r: { code?: string; workspaceId?: string }) => r.code !== roomId && r.workspaceId !== roomId)));
      }
    } catch { /* optional local cleanup */ }
  }, [roomId, useFirebase]);

  const updateParticipantRole = useCallback(async (targetUid: string, newRole: WorkspaceRole) => {
    if (!roomId) return;
    if (useFirebase && db) await updateDoc(doc(db, 'rooms', roomId), { [`participants.${targetUid}.role`]: newRole, [`users.${targetUid}.role`]: newRole });
    else setRoom(prev => {
      if (!prev) return null;
      const nextParts = { ...prev.participants };
      if (nextParts[targetUid]) nextParts[targetUid] = { ...nextParts[targetUid], role: newRole };
      return { ...prev, participants: nextParts };
    });
  }, [roomId, useFirebase, setRoom]);

  const removeParticipant = useCallback(async (targetUid: string) => {
    if (!roomId) return;
    if (useFirebase && db) await updateDoc(doc(db, 'rooms', roomId), { [`participants.${targetUid}`]: deleteField(), [`users.${targetUid}`]: deleteField() });
    else setRoom(prev => {
      if (!prev) return null;
      const nextParts = { ...prev.participants }, nextUsers = { ...prev.users };
      delete nextParts[targetUid]; delete nextUsers[targetUid];
      return { ...prev, participants: nextParts, users: nextUsers };
    });
  }, [roomId, useFirebase, setRoom]);

  const transferOwnership = useCallback(async (newOwnerUid: string) => {
    if (!roomId || !uid) return;
    if (useFirebase && db) await updateDoc(doc(db, 'rooms', roomId), {
      ownerId: newOwnerUid, creatorId: newOwnerUid, creatorRole: 'owner',
      [`participants.${newOwnerUid}.role`]: 'owner', [`users.${newOwnerUid}.role`]: 'owner',
      [`participants.${uid}.role`]: 'editor', [`users.${uid}.role`]: 'editor', updatedAt: serverTimestamp(),
    });
    else setRoom(prev => {
      if (!prev) return null;
      const nextParts = { ...prev.participants };
      if (nextParts[newOwnerUid]) nextParts[newOwnerUid] = { ...nextParts[newOwnerUid], role: 'owner' };
      if (nextParts[uid]) nextParts[uid] = { ...nextParts[uid], role: 'editor' };
      return { ...prev, creatorId: newOwnerUid, creatorRole: 'owner', participants: nextParts };
    });
  }, [roomId, uid, useFirebase, setRoom]);

  return { archiveWorkspace, restoreWorkspace, deleteWorkspace, updateParticipantRole, removeParticipant, transferOwnership };
}

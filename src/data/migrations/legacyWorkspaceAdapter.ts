import { NoteRoom } from '../../types';
import { WorkspaceMemberRecord, WorkspaceRecord } from '../../domain/workspace/schema';

/**
 * Read-only compatibility adapter used while legacy rooms are migrated.
 * It deliberately does not write to the new schema, preventing accidental
 * dual-write divergence during the Phase 2 rollout.
 */
export function workspaceFromLegacyRoom(room: NoteRoom): WorkspaceRecord {
  return {
    id: room.workspaceId || room.roomCode,
    name: room.workspaceName,
    ownerId: room.ownerId || room.creatorId,
    privacy: room.privacy,
    lifecycle: room.status,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    participantLimit: room.participantLimit,
    category: room.workspaceCategory,
    type: room.workspaceType,
  };
}

export function membersFromLegacyRoom(room: NoteRoom): WorkspaceMemberRecord[] {
  return Object.values(room.participants || {}).map(member => ({
    uid: member.uid,
    role: normalizeRole(member.role),
    joinedAt: member.joinedAt,
    displayName: member.name,
    isMuted: member.isMuted,
  }));
}

function normalizeRole(role: string): WorkspaceMemberRecord['role'] {
  if (role === 'owner' || role === 'admin' || role === 'editor' || role === 'commenter' || role === 'viewer' || role === 'guest') {
    return role;
  }
  if (['teacher', 'instructor', 'collaborator', 'member', 'developer', 'student'].includes(role)) return 'editor';
  if (['moderator', 'reviewer'].includes(role)) return 'commenter';
  return 'viewer';
}

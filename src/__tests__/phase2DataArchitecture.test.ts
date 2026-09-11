import { describe, expect, it } from 'vitest';
import { workspaceFromLegacyRoom, membersFromLegacyRoom } from '../data/migrations/legacyWorkspaceAdapter';
import { workspacePath, memberPath, documentPath } from '../data/firestore/paths';
import { NoteRoom } from '../types';

describe('Phase 2 — canonical data architecture', () => {
  it('uses a canonical workspace hierarchy', () => {
    expect(workspacePath('ws-123')).toBe('workspaces/ws-123');
    expect(memberPath('ws-123', 'u-1')).toBe('workspaces/ws-123/members/u-1');
    expect(documentPath('ws-123', 'doc-1')).toBe('workspaces/ws-123/documents/doc-1');
  });

  it('maps legacy room metadata without writing or mutating the source', () => {
    const room: NoteRoom = {
      id: 'room-1', workspaceId: 'ws-1', roomCode: 'room-1', workspaceType: 'coding',
      workspaceName: 'Demo', creatorId: 'u-1', creatorRole: 'owner', ownerId: 'u-1',
      status: 'active', privacy: 'private', participantLimit: 10,
      participants: { 'u-1': { uid: 'u-1', name: 'Owner', role: 'owner', joinedAt: 1 } },
      permissions: { allowGuestEdit: false }, content: 'hello', createdAt: 1, updatedAt: 2,
      users: {}, typingUsers: {}
    };
    const workspace = workspaceFromLegacyRoom(room);
    expect(workspace.ownerId).toBe('u-1');
    expect(workspace.name).toBe('Demo');
    expect(membersFromLegacyRoom(room)[0].role).toBe('owner');
    expect(room.participants['u-1'].role).toBe('owner');
  });
});

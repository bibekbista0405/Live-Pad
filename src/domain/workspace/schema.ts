/**
 * Target domain shape for the Phase 2 data-model migration.
 * Existing NoteRoom remains intact during Phase 1 to avoid a risky big-bang rewrite.
 */
export type WorkspacePrivacy = 'public' | 'private' | 'invite-only';
export type WorkspaceLifecycle = 'active' | 'archived' | 'expired' | 'deleted';

export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerId: string;
  privacy: WorkspacePrivacy;
  lifecycle: WorkspaceLifecycle;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceMemberRecord {
  uid: string;
  role: 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer' | 'guest';
  joinedAt: number;
}

export interface PresenceRecord {
  uid: string;
  status: 'online' | 'away' | 'reconnecting' | 'offline';
  lastActive: number;
  cursorIndex?: number;
  selectionEnd?: number;
}

/**
 * Canonical LivePad workspace domain model (Phase 2).
 *
 * Firestore document shapes may evolve independently; repositories are the
 * translation boundary. UI code should consume these domain records instead
 * of depending on Firestore field names or legacy NoteRoom blobs.
 */
export type WorkspacePrivacy = 'public' | 'private' | 'invite-only';
export type WorkspaceLifecycle = 'active' | 'archived' | 'expired' | 'deleted';
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer' | 'guest';
export type PresenceStatus = 'online' | 'away' | 'reconnecting' | 'offline';

export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerId: string;
  privacy: WorkspacePrivacy;
  lifecycle: WorkspaceLifecycle;
  createdAt: number;
  updatedAt: number;
  participantLimit?: number;
  description?: string;
  category?: string;
  type?: string;
}

export interface WorkspaceMemberRecord {
  uid: string;
  role: WorkspaceRole;
  joinedAt: number;
  displayName?: string;
  email?: string;
  isBlocked?: boolean;
  isMuted?: boolean;
}

export interface PresenceRecord {
  uid: string;
  status: PresenceStatus;
  lastActive: number;
  cursorIndex?: number;
  selectionEnd?: number;
  deviceId?: string;
}

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface MessageRecord {
  id: string;
  workspaceId: string;
  senderUid: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

export interface CommentRecord {
  id: string;
  workspaceId: string;
  documentId: string;
  authorUid: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  resolved?: boolean;
}

export interface AttachmentRecord {
  id: string;
  workspaceId: string;
  documentId?: string;
  name: string;
  mimeType: string;
  url: string;
  sizeBytes?: number;
  uploadedBy: string;
  uploadedAt: number;
}

export interface ProjectRecord {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryRecord {
  id: string;
  workspaceId: string;
  documentId?: string;
  content: string;
  version: number;
  actorUid: string;
  createdAt: number;
}

export interface AuditRecord {
  id: string;
  workspaceId: string;
  actorUid: string;
  action: string;
  targetId?: string;
  details?: string;
  createdAt: number;
}

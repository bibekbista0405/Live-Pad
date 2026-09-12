/**
 * Shared Type Definitions for LivePad
 */

export type Theme = 'light' | 'dark' | 'system' | 'sepia';

export type WorkspaceType = 'teaching' | 'study' | 'coding' | 'personal' | 'team';
export type WorkspaceRole = 'owner' | 'teacher' | 'student' | 'collaborator' | 'instructor' | 'learner' | 'admin' | 'member' | 'editor' | 'commenter' | 'viewer' | 'guest' | 'moderator';
export type WorkspaceStatus = 'active' | 'archived' | 'expired' | 'deleted';
export type WorkspacePrivacy = 'public' | 'private' | 'invite-only';

export interface WorkspaceParticipant {
  uid: string;
  name: string;
  role: WorkspaceRole;
  joinedAt: number;
  color?: string;
  isOnline?: boolean;
  lastActive?: number;
  device?: string;
  isMuted?: boolean;
}

export interface WorkspacePermissions {
  allowGuestEdit: boolean;
  allowChat?: boolean;
  allowExport?: boolean;
}

export interface WorkspaceAuditLog {
  id: string;
  action: string;
  performedBy: string;
  timestamp: number;
  details?: string;
  who?: string;
  actorName?: string;
  target?: string;
}

export type UserStatus = 'online' | 'away' | 'reconnecting' | 'offline';

export interface UserPresence {
  uid: string;
  name: string;
  joinedAt: number; // timestamp
  color: string;    // HEX or Tailwind color class for user visual identification
  isOnline: boolean;
  status?: UserStatus;
  lastActive: number; // last seen heartbeat timestamp
  cursorIndex?: number; // optional caret position inside the notepad
  selectionEnd?: number; // optional selection range end
  role?: WorkspaceRole;
  isTyping?: boolean;
}

export interface HistoryEntry {
  id: string;
  content: string;
  updatedAt: number;
  authorName: string;
  authorUid?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'link';
  url: string; // URL link or base64 Data URL
  size?: number; // size in bytes (for local files)
  uploadedAt: number;
  uploadedBy: string; // nickname of the uploader
}

export interface NoteRoom {
  id: string;
  workspaceId: string;
  roomCode: string;
  workspaceType: WorkspaceType;
  workspaceCategory?: string;
  workspaceName: string;
  creatorId: string;
  creatorRole: WorkspaceRole;
  ownerId?: string;
  ownerName?: string;
  /** Authoritative live classroom control: when true, Code Studio opens for every participant. */
  codeModeOpen?: boolean;
  codeModeOpenedBy?: string;
  codeModeOpenedAt?: number;
  status: WorkspaceStatus;
  privacy: WorkspacePrivacy;
  participantLimit: number;
  participants: Record<string, WorkspaceParticipant>;
  permissions: WorkspacePermissions;
  content: string;
  createdAt: number;
  updatedAt: number;
  title?: string;
  label?: string;
  users: Record<string, UserPresence>;
  typingUsers: Record<string, boolean>; // mapping of uid -> typing status
  history?: HistoryEntry[];
  attachments?: Attachment[];
}

export interface LocalNotepad {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  attachments?: Attachment[];
}

export interface TrashedNotepad extends LocalNotepad {
  deletedAt: number;
}

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error' | 'reconnecting';

export interface DocumentConflict {
  documentId: string;
  documentTitle: string;
  localContent: string;
  remoteContent: string;
  baseContent?: string;
  queueItemId?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'conflict';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  conflictData?: DocumentConflict;
}

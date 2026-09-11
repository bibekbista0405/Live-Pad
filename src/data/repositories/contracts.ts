import {
  AuditRecord,
  CommentRecord,
  DocumentRecord,
  HistoryRecord,
  MessageRecord,
  PresenceRecord,
  ProjectRecord,
  WorkspaceMemberRecord,
  WorkspaceRecord,
} from '../../domain/workspace/schema';

export interface WorkspaceRepository {
  get(id: string): Promise<WorkspaceRecord | null>;
  create(workspace: WorkspaceRecord): Promise<void>;
  update(id: string, patch: Partial<WorkspaceRecord>): Promise<void>;
}

export interface MemberRepository {
  get(workspaceId: string, uid: string): Promise<WorkspaceMemberRecord | null>;
  list(workspaceId: string): Promise<WorkspaceMemberRecord[]>;
  upsert(workspaceId: string, member: WorkspaceMemberRecord): Promise<void>;
  remove(workspaceId: string, uid: string): Promise<void>;
}

export interface PresenceRepository {
  get(workspaceId: string, uid: string): Promise<PresenceRecord | null>;
  upsert(workspaceId: string, presence: PresenceRecord): Promise<void>;
}

export interface DocumentRepository {
  get(workspaceId: string, documentId: string): Promise<DocumentRecord | null>;
  list(workspaceId: string): Promise<DocumentRecord[]>;
  upsert(document: DocumentRecord): Promise<void>;
}

export interface MessageRepository {
  list(workspaceId: string, limit?: number): Promise<MessageRecord[]>;
  add(message: MessageRecord): Promise<void>;
  update(workspaceId: string, id: string, patch: Partial<MessageRecord>): Promise<void>;
  remove(workspaceId: string, id: string): Promise<void>;
}

export interface CommentRepository {
  list(workspaceId: string, documentId?: string): Promise<CommentRecord[]>;
  add(comment: CommentRecord): Promise<void>;
  update(workspaceId: string, id: string, patch: Partial<CommentRecord>): Promise<void>;
}

export interface ProjectRepository {
  get(workspaceId: string, projectId: string): Promise<ProjectRecord | null>;
  list(workspaceId: string): Promise<ProjectRecord[]>;
  upsert(project: ProjectRecord): Promise<void>;
}

export interface HistoryRepository {
  list(workspaceId: string, documentId?: string, limit?: number): Promise<HistoryRecord[]>;
  append(history: HistoryRecord): Promise<void>;
}

export interface AuditRepository {
  list(workspaceId: string, limit?: number): Promise<AuditRecord[]>;
  append(audit: AuditRecord): Promise<void>;
}

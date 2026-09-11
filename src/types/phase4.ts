export type WorkspaceMode = 'local' | 'cloud' | 'hybrid';

export interface CloudWorkspace {
  id: string;
  name: string;
  description: string;
  mode: WorkspaceMode;
  ownerId: string;
  ownerEmail: string;
  createdAt: number;
  updatedAt: number;
  isOffline: boolean;
  pendingSyncCount: number;
  versionSnapshotCount: number;
  cloudUrl?: string;
  repoUrl?: string;
}

export interface WorkspaceSnapshot {
  id: string;
  workspaceId: string;
  timestamp: number;
  label: string;
  creator: string;
  filesCount: number;
  sizeBytes: number;
  autoCreated: boolean;
}

export interface DeviceSyncState {
  deviceId: string;
  deviceName: string;
  lastActive: number;
  openProjects: string[];
  openFiles: string[];
  activeFilePath?: string;
  cursorPosition?: { lineNumber: number; column: number };
  theme: string;
  activeLayout: Record<string, boolean>;
  breakpoints: Array<{ file: string; line: number }>;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  avatarUrl: string;
  isPrivate: boolean;
  description: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  cloneUrl: string;
  updatedAt: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  author: string;
  authorAvatar: string;
  status: 'open' | 'closed' | 'merged';
  createdAt: string;
  headBranch: string;
  baseBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviewers: string[];
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  author: string;
  status: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  createdAt: string;
  commentsCount: number;
  assignee?: string;
}

export interface GitHubActionRun {
  id: number;
  name: string;
  workflow: string;
  branch: string;
  status: 'completed' | 'in_progress' | 'queued' | 'failed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'neutral' | null;
  createdAt: string;
  durationMs: number;
}

export type GranularRole =
  | 'owner'
  | 'admin'
  | 'maintainer'
  | 'developer'
  | 'reviewer'
  | 'commenter'
  | 'viewer'
  | 'guest';

export interface PermissionMatrix {
  workspace: { edit: boolean; delete: boolean; share: boolean };
  projects: { create: boolean; delete: boolean; rename: boolean };
  files: { create: boolean; edit: boolean; delete: boolean };
  git: { commit: boolean; push: boolean; branch: boolean; merge: boolean };
  terminal: { executeCommands: boolean; sudoAccess: boolean };
  ai: { generateCode: boolean; highCostModels: boolean };
  admin: { manageMembers: boolean; viewAuditLogs: boolean; billing: boolean };
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actor: string;
  actorAvatar?: string;
  action: string;
  category: 'security' | 'member' | 'workspace' | 'git' | 'terminal' | 'permissions';
  details: string;
  ipAddress?: string;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'component' | 'service' | 'hook' | 'route' | 'database' | 'external';
  filePath: string;
  importsCount: number;
  exportedSymbols: string[];
}

export interface RouteMapItem {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'SOCKET' | 'PAGE';
  handlerName: string;
  filePath: string;
  isProtected: boolean;
}

export interface NotificationItem {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  type: 'invite' | 'pull_request' | 'comment' | 'build_success' | 'build_failed' | 'mention' | 'update' | 'sync';
  read: boolean;
  actionUrl?: string;
}

export type ProjectTaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type ProjectTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assignee?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  sprintId?: string;
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  tags: string[];
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  status: 'planning' | 'active' | 'completed';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'deadline' | 'meeting' | 'sprint' | 'release' | 'reminder';
  description?: string;
  attendees?: string[];
}

export interface ChatChannel {
  id: string;
  name: string;
  topic?: string;
  isPrivate: boolean;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: number;
  content: string;
  codeSnippet?: { language: string; code: string };
  reactions?: Record<string, number>;
  voiceNoteUrl?: string;
}

export interface WorkspaceAnalyticsData {
  linesOfCode: number;
  totalCommits: number;
  activeContributors: number;
  storageUsageMb: number;
  languagesBreakdown: Record<string, number>;
  productivityTrend: Array<{ date: string; commits: number; PRs: number }>;
  topContributors: Array<{ name: string; commits: number; additions: number; deletions: number }>;
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  downloads: number;
  rating: number;
  category: 'themes' | 'extensions' | 'languages' | 'ai' | 'snippets' | 'templates' | 'linters' | 'git';
  icon: string;
  isInstalled: boolean;
}

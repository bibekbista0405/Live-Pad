import { Platform } from '../platform';

export interface RemoteCollaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  activeFilePath?: string;
  cursor?: { lineNumber: number; column: number };
  selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
  isPresenter?: boolean;
  status: 'active' | 'idle' | 'offline';
}

export interface LiveReviewComment {
  id: string;
  filePath: string;
  lineNumber: number;
  author: string;
  authorAvatar: string;
  timestamp: number;
  content: string;
  suggestion?: string;
  resolved: boolean;
}

export class CollaborationEngine {
  private static instance: CollaborationEngine;
  private sessionActive = true;
  private collaborators: RemoteCollaborator[] = [];
  private comments: LiveReviewComment[] = [];
  private presenterId: string | null = null;
  private listeners: Array<() => void> = [];

  public static getInstance(): CollaborationEngine {
    if (!CollaborationEngine.instance) {
      CollaborationEngine.instance = new CollaborationEngine();
      CollaborationEngine.instance.initDefaultCollaborators();
    }
    return CollaborationEngine.instance;
  }

  private initDefaultCollaborators() {
    this.collaborators = [
      {
        id: 'collab-1',
        name: 'Sarah Chen (Tech Lead)',
        email: 'sarah@livepad.dev',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        color: '#3b82f6',
        activeFilePath: 'src/components/CodeWorkspace.tsx',
        cursor: { lineNumber: 42, column: 15 },
        isPresenter: true,
        status: 'active',
      },
      {
        id: 'collab-2',
        name: 'Alex Rivera (Staff Architect)',
        email: 'alex@livepad.dev',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        color: '#10b981',
        activeFilePath: 'src/services/languageService.ts',
        cursor: { lineNumber: 88, column: 4 },
        isPresenter: false,
        status: 'active',
      },
      {
        id: 'collab-3',
        name: 'Devon Vance (DevOps Engineer)',
        email: 'devon@livepad.dev',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        color: '#f59e0b',
        activeFilePath: 'package.json',
        cursor: { lineNumber: 12, column: 2 },
        isPresenter: false,
        status: 'idle',
      },
    ];

    this.presenterId = 'collab-1';

    this.comments = [
      {
        id: 'rev-1',
        filePath: 'src/components/CodeWorkspace.tsx',
        lineNumber: 612,
        author: 'Sarah Chen',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        timestamp: Date.now() - 1800000,
        content: 'Consider adding auto-unsubscribe for backup ticker on unmount.',
        suggestion: 'return () => backupService.stopAutoBackup();',
        resolved: false,
      },
    ];
  }

  public getCollaborators(): RemoteCollaborator[] {
    return this.collaborators;
  }

  public getPresenter(): RemoteCollaborator | undefined {
    return this.collaborators.find((c) => c.id === this.presenterId);
  }

  public setPresenter(collabId: string | null) {
    this.presenterId = collabId;
    this.collaborators.forEach((c) => {
      c.isPresenter = c.id === collabId;
    });
    this.notify();
  }

  public addComment(comment: Omit<LiveReviewComment, 'id' | 'timestamp' | 'resolved'>): LiveReviewComment {
    const newComment: LiveReviewComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      timestamp: Date.now(),
      resolved: false,
    };
    this.comments.unshift(newComment);
    this.notify();
    return newComment;
  }

  public getCommentsForFile(filePath: string): LiveReviewComment[] {
    return this.comments.filter((c) => c.filePath === filePath);
  }

  public toggleResolveComment(commentId: string) {
    const found = this.comments.find((c) => c.id === commentId);
    if (found) {
      found.resolved = !found.resolved;
      this.notify();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const collaborationEngine = CollaborationEngine.getInstance();

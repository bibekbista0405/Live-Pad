import { useCallback } from 'react';
import type { NoteRoom } from '../types';

export interface WorkspaceCommandFeedback {
  addToast: (type: 'success' | 'error' | 'info' | 'conflict', message: string) => void;
  navigateToDashboard: () => void;
}

export interface UseWorkspaceCommandsOptions extends WorkspaceCommandFeedback {
  room: NoteRoom | null;
  roomCode: string | null;
  archiveWorkspace: () => Promise<void>;
  restoreWorkspace: () => Promise<void>;
  deleteWorkspace: () => Promise<void>;
}

/** Application command boundary for workspace lifecycle actions. */
export function useWorkspaceCommands({
  room,
  roomCode,
  archiveWorkspace,
  restoreWorkspace,
  deleteWorkspace,
  addToast,
  navigateToDashboard,
}: UseWorkspaceCommandsOptions) {
  const archive = useCallback(async () => {
    try {
      await archiveWorkspace();
      addToast('info', 'Workspace archived and set to read-only mode.');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to archive workspace.');
    }
  }, [archiveWorkspace, addToast]);

  const restore = useCallback(async () => {
    try {
      await restoreWorkspace();
      addToast('success', 'Workspace restored and active for live editing.');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to restore workspace.');
    }
  }, [restoreWorkspace, addToast]);

  const remove = useCallback(async () => {
    try {
      const workspaceTitle = room?.workspaceName || room?.title || roomCode || 'Workspace';
      await deleteWorkspace();
      navigateToDashboard();
      addToast('success', `Workspace "${workspaceTitle}" permanently deleted.`);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to delete workspace.');
    }
  }, [addToast, deleteWorkspace, navigateToDashboard, room?.title, room?.workspaceName, roomCode]);

  const leave = useCallback(() => {
    navigateToDashboard();
    addToast('info', 'Disconnected session. Returned to Dashboard.');
  }, [addToast, navigateToDashboard]);

  return { archive, restore, remove, leave };
}

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Attachment, LocalNotepad, NoteRoom, SyncStatus } from '../types';
import { enqueueOfflineOp, putOfflineItem } from '../utils/offlineDB';

interface UseDocumentPersistenceOptions {
  activeLocalNoteId: string | null;
  localNotes: LocalNotepad[];
  setLocalNotes: Dispatch<SetStateAction<LocalNotepad[]>>;
  setLastSavedTime: (timestamp: number) => void;
  roomCode: string | null;
  room: NoteRoom | null;
  userName: string;
  updateContent: (content: string) => void;
}

export function useDocumentPersistence({
  activeLocalNoteId,
  localNotes,
  setLocalNotes,
  setLastSavedTime,
  roomCode,
  room,
  userName,
  updateContent,
}: UseDocumentPersistenceOptions) {
  const [localSavingState, setLocalSavingState] = useState<SyncStatus>('synced');
  const localSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPersistenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localNotesRef = useRef(localNotes);

  useEffect(() => {
    localNotesRef.current = localNotes;
  }, [localNotes]);

  const pendingLocalPersistenceRef = useRef<{
    id: string;
    title: string;
    content: string;
    createdAt?: number;
    updatedAt: number;
    attachments?: Attachment[];
    workspaceId?: string;
    roomCode?: string;
  } | null>(null);

  const flushLocalPersistence = useCallback(() => {
    const pending = pendingLocalPersistenceRef.current;
    if (!pending) return;
    pendingLocalPersistenceRef.current = null;
    setLocalSavingState('synced');
    void putOfflineItem('documents', pending).catch((err) => {
      setLocalSavingState('error');
      console.warn('[LivePad] IndexedDB persistence failed:', err);
    });
  }, []);

  const scheduleLocalPersistence = useCallback((pending: NonNullable<typeof pendingLocalPersistenceRef.current>) => {
    pendingLocalPersistenceRef.current = pending;
    setLocalSavingState('saving');
    if (localPersistenceTimeoutRef.current) clearTimeout(localPersistenceTimeoutRef.current);
    localPersistenceTimeoutRef.current = setTimeout(() => {
      localPersistenceTimeoutRef.current = null;
      flushLocalPersistence();
    }, 400);
  }, [flushLocalPersistence]);

  useEffect(() => {
    return () => {
      if (localSaveTimeoutRef.current) clearTimeout(localSaveTimeoutRef.current);
      if (localPersistenceTimeoutRef.current) clearTimeout(localPersistenceTimeoutRef.current);
      flushLocalPersistence();
    };
  }, [flushLocalPersistence]);

  const handleUpdateContent = useCallback((newVal: string) => {
    const updatedAt = Date.now();

    if (activeLocalNoteId) {
      const activeNoteObj = localNotesRef.current.find((note) => note.id === activeLocalNoteId);
      if (!activeNoteObj) return;

      setLocalSavingState('saving');
      const updatedNote: LocalNotepad = {
        ...activeNoteObj,
        content: newVal,
        updatedAt,
      };
      localNotesRef.current = localNotesRef.current.map((note) =>
        note.id === activeLocalNoteId ? updatedNote : note
      );
      setLocalNotes((prev) => prev.map((note) => note.id === activeLocalNoteId ? updatedNote : note));
      setLastSavedTime(updatedAt);

      scheduleLocalPersistence({
        id: updatedNote.id,
        title: updatedNote.title,
        content: newVal,
        createdAt: updatedNote.createdAt,
        updatedAt,
        attachments: updatedNote.attachments || [],
      });

      if (localSaveTimeoutRef.current) clearTimeout(localSaveTimeoutRef.current);
      localSaveTimeoutRef.current = setTimeout(() => {
        localSaveTimeoutRef.current = null;
        try {
          localStorage.setItem('livepad_local_notepads', JSON.stringify(localNotesRef.current));
        } catch (err) {
          setLocalSavingState('error');
          console.warn('[LivePad] localStorage persistence failed:', err);
        }
      }, 400);
      return;
    }

    if (roomCode) {
      const currentTitle = room?.title || room?.workspaceName || `Workspace #${roomCode}`;
      scheduleLocalPersistence({
        id: roomCode,
        title: currentTitle,
        content: newVal,
        updatedAt,
        workspaceId: room?.workspaceId || roomCode,
        roomCode,
      });

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineOp({
          type: 'UPDATE',
          entity: 'rooms',
          entityId: roomCode,
          payload: {
            content: newVal,
            updatedAt,
            lastUpdatedBy: userName,
          },
        }).catch(err => {
          console.warn('[handleUpdateContent] Sync queue enqueue failed:', err);
        });
      }
    }

    updateContent(newVal);
  }, [
    activeLocalNoteId,
    roomCode,
    room?.title,
    room?.workspaceName,
    room?.workspaceId,
    scheduleLocalPersistence,
    setLastSavedTime,
    setLocalNotes,
    updateContent,
    userName,
  ]);

  return { localSavingState, handleUpdateContent, flushLocalPersistence };
}

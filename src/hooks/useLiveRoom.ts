import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType, isFirestoreQuotaExhausted, markQuotaExhausted, onQuotaExhaustedChange } from '../lib/firebase';
import { NoteRoom, UserPresence, SyncStatus, HistoryEntry, Attachment, WorkspaceType, WorkspaceRole, WorkspaceStatus, WorkspacePrivacy, WorkspaceParticipant } from '../types';
import { WORKSPACE_TYPES } from '../utils/workspace';
import { notifyStorageError } from '../utils/offlineDB';
import { merge3Text } from '../utils/textMerge';
import { WorkspaceLibraryService } from '../services/workspaceLibraryService';
import { getRecentWorkspaces } from '../utils/recentWorkspaces';
import { useWorkspacePresence } from './useWorkspacePresence';
import { useWorkspaceMembership } from './useWorkspaceMembership';
import { SyncCoordinator } from '../sync/syncCoordinator';
import { offlineOutbox } from '../sync/offlineOutbox';

const PASTEL_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
];

// Helper to get random user color
const getRandomColor = () => PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];

// Generate a static client UID for local fallback if no auth
const getLocalUid = () => {
  let uid = localStorage.getItem('livepad_local_uid');
  if (!uid) {
    uid = 'local_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('livepad_local_uid', uid);
  }
  return uid;
};

export function useLiveRoom(roomId: string | null, userName: string) {
  const [useFirebase, setUseFirebase] = useState<boolean>(isFirebaseConfigured);
  const [room, setRoom] = useState<NoteRoom | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [error, setError] = useState<string | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>('active');
  const [uid, setUid] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('#3b82f6');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Listen for global Firestore quota exhaustion
  useEffect(() => {
    if (isFirestoreQuotaExhausted()) {
      setUseFirebase(false);
    }
    const unsub = onQuotaExhaustedChange((exhausted) => {
      if (exhausted) {
        setUseFirebase(false);
      }
    });
    return unsub;
  }, []);

  const clientIdRef = useRef<string>(
    (() => {
      let cid = sessionStorage.getItem('livepad_client_id');
      if (!cid) {
        cid = 'client_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        sessionStorage.setItem('livepad_client_id', cid);
      }
      return cid;
    })()
  );
  const lastTxIdRef = useRef<string>('');
  const syncCoordinatorRef = useRef(new SyncCoordinator({ baseDelayMs: 400, maxDelayMs: 8000, maxRetries: 4 }));

  const channelRef = useRef<BroadcastChannel | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateLockRef = useRef<boolean>(false);
  const myCursorIndexRef = useRef<number | undefined>(undefined);
  const mySelectionEndRef = useRef<number | undefined>(undefined);
  const dbThrottleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorFrameRef = useRef<number | null>(null);
  const pendingCursorStateRef = useRef<Record<string, unknown> | null>(null);
  const lastSyncedContentRef = useRef<string>('');
  const isAwayRef = useRef<boolean>(false);
  const roomRef = useRef<NoteRoom | null>(room);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Dynamic user details
  const userNameRef = useRef(userName);
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  // Master cleanup for pending timers on unmount or room change
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (dbThrottleTimeoutRef.current) clearTimeout(dbThrottleTimeoutRef.current);
      if (cursorFrameRef.current !== null) cancelAnimationFrame(cursorFrameRef.current);
    };
  }, [roomId]);

  // Keep UI connectivity state aligned with the browser network signal immediately.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setIsConnected(true);
      if (offlineOutbox.count() > 0) setSyncStatus('saving');
    };
    const handleOffline = () => {
      setIsConnected(false);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) handleOffline();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Resume durable offline writes when connectivity returns.
  useEffect(() => {
    if (!roomId || !uid || !isFirebaseConfigured || typeof window === 'undefined') return;

    const flushOutbox = () => {
      const pending = offlineOutbox.list().filter((item) => item.roomId === roomId);
      if (!pending.length || isFirestoreQuotaExhausted() || !db) return;
      const latest = pending[pending.length - 1];
      void syncCoordinatorRef.current.run({
        id: `outbox:${latest.txId}`,
        run: async () => {
          await updateDoc(doc(db, 'rooms', latest.roomId), {
            content: latest.content,
            updatedAt: serverTimestamp(),
            lastClientId: latest.clientId,
            lastTxId: latest.txId,
          });
          offlineOutbox.remove(latest.roomId, latest.txId);
          setSyncStatus('synced');
          setIsConnected(true);
          setUseFirebase(true);
        },
      }).catch(() => {
        setSyncStatus('offline');
      });
    };

    window.addEventListener('online', flushOutbox);
    if (navigator.onLine) flushOutbox();
    return () => {
      window.removeEventListener('online', flushOutbox);
    };
  }, [roomId, uid]);

  // Sync user name changes to Firestore room path instantly
  useEffect(() => {
    if (!roomId || !uid || !useFirebase || !db || isFirestoreQuotaExhausted()) return;
    const updateUserNameInDb = async () => {
      try {
        if (isFirestoreQuotaExhausted()) return;
        const roomDocRef = doc(db, 'rooms', roomId);
        await updateDoc(roomDocRef, {
          [`users.${uid}.name`]: userName,
          [`users.${uid}.lastActive`]: Date.now(),
          [`users.${uid}.isOnline`]: true
        });
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('resource-exhausted') || errStr.includes('Quota')) {
          markQuotaExhausted();
          setUseFirebase(false);
        } else {
          console.error("User name update in DB failed", err);
        }
      }
    };
    updateUserNameInDb();
  }, [userName, roomId, uid, useFirebase]);

  // Establish user color
  useEffect(() => {
    let savedColor = localStorage.getItem('livepad_color');
    if (!savedColor) {
      savedColor = getRandomColor();
      localStorage.setItem('livepad_color', savedColor);
    }
    setUserColor(savedColor);
  }, []);

  // Initialize authentication (Firebase or local offline identity)
  useEffect(() => {
    if (useFirebase && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUid(user.uid);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            if (credential.user) {
              setUid(credential.user.uid);
            }
          } catch (err: any) {
            const errorMsg = err?.message || String(err);
            if (errorMsg.includes('admin-restricted-operation') || errorMsg.includes('auth/admin-restricted-operation')) {
              console.info(
                "%cℹ️ Firebase Anonymous Auth is disabled for your project.\n" +
                "To enable persistent multi-user web/mobile collaboration:\n" +
                "1. Go to Firebase Console (https://console.firebase.google.com/)\n" +
                "2. Click Build > Authentication > Sign-in method\n" +
                "3. Enable the 'Anonymous' provider.\n" +
                "Falling back smoothly to unauthenticated/local database synchronization.",
                "color: #0ea5e9; font-weight: bold; font-size: 11px;"
              );
            } else {
              console.warn("Auth Sign In failed; falling back to unauthenticated database connection:", err);
            }
            
            // Fallback to local UID so operations can still proceed unauthenticated
            setUid(getLocalUid());

            // Check if network request failed. Gracefully fallback to Local/Offline Mode
            if (errorMsg.includes('network-request-failed') || errorMsg.includes('auth/network-request-failed')) {
              console.info("Firebase Auth network error detected. Switching LiveRoom instantly to Offline/Broadcast mode to prevent workspace lockup.");
              setUseFirebase(false);
            }
          }
        }
      });
      return () => unsubscribe();
    } else {
      // Local offline identity fallback
      setUid(getLocalUid());
    }
  }, [useFirebase]);

  const [refreshKey, setRefreshKey] = useState<number>(() => Date.now());
  const refresh = useCallback(() => {
    // Reset typing update lock so fresh database snapshot overrides local buffer
    updateLockRef.current = false;
    const versionTimestamp = Date.now();
    console.log(`[useLiveRoom] Refreshing room data... Version timestamp: ${versionTimestamp}`);
    setRefreshKey(versionTimestamp);
  }, []);

  // Synchronizer Setup (Firebase onSnapshot OR BroadcastChannel)
  useEffect(() => {
    if (!roomId || !uid) return;

    setError(null);
    setRoom(null);
    setWorkspaceStatus('active');

    if (useFirebase && db) {
      // Firebase Live Path
      const roomDocRef = doc(db, 'rooms', roomId);
      
      const unsubscribe = onSnapshot(roomDocRef, (snapshot) => {
        if (!snapshot.exists()) {
          setError("Room does not exist.");
          setWorkspaceStatus('active');
          setRoom(null);
          return;
        }

        const data = snapshot.data();
        const status = (data.status as WorkspaceStatus) || 'active';
        setWorkspaceStatus(status);
        if (status !== 'active') {
          setError(`Workspace is currently ${status} and cannot be edited.`);
          setRoom(null);
          return;
        }

        const wsType: WorkspaceType = data.workspaceType || 'team';
        const typeDef = WORKSPACE_TYPES[wsType] || WORKSPACE_TYPES.team;
        const creatorId = data.creatorId || '';
        const creatorRole: WorkspaceRole = data.creatorRole || typeDef.creatorRole;

        const roomData: NoteRoom = {
          id: roomId,
          workspaceId: data.workspaceId || roomId,
          roomCode: data.roomCode || roomId,
          workspaceType: wsType,
          workspaceName: data.workspaceName || data.title || 'Collaborative Workspace',
          creatorId,
          creatorRole,
          status,
          privacy: (data.privacy as WorkspacePrivacy) || 'public',
          participantLimit: data.participantLimit || typeDef.defaultLimit,
          participants: data.participants || {},
          permissions: data.permissions || { allowGuestEdit: true, allowChat: true, allowExport: true },
          content: data.content || '',
          createdAt: data.createdAt?.toDate?.()?.getTime() || Date.now(),
          updatedAt: data.updatedAt?.toDate?.()?.getTime() || Date.now(),
          title: data.title || data.workspaceName || '',
          label: data.label || '',
          codeModeOpen: data.codeModeOpen === true,
          codeModeOpenedBy: data.codeModeOpenedBy || '',
          codeModeOpenedAt: data.codeModeOpenedAt?.toDate?.()?.getTime() || undefined,
          users: data.users || {},
          typingUsers: data.typingUsers || {},
          attachments: data.attachments || [],
        };

        if (roomId) {
          const effectiveUid = uid || auth?.currentUser?.uid || localStorage.getItem('livepad_local_uid') || 'anonymous';
          const myParticipant = (data.participants && data.participants[effectiveUid]) || (data.users && data.users[effectiveUid]);
          const userRole = myParticipant?.role || (creatorId === effectiveUid ? 'Owner' : 'Editor');
          WorkspaceLibraryService.saveWorkspaceToLibrary(effectiveUid, {
            workspaceId: roomId,
            roomCode: data.roomCode || roomId,
            title: data.title || data.workspaceName || 'Collaborative Workspace',
            category: data.label || 'coding_session',
            workspaceType: wsType,
            role: userRole,
            owner: creatorId === effectiveUid || String(userRole).toLowerCase() === 'owner',
            ownerName: data.ownerName || 'LivePad Member',
            ownerId: creatorId,
            memberCount: Object.keys(data.participants || data.users || {}).length || 1,
            snippet: (data.content || '').slice(0, 100),
          }).catch(() => {});

          // Auto-persist snapshot content to local storage for PWA offline accessibility
          try {
            localStorage.setItem(`livepad_local_room_${roomId}`, data.content || '');
            if (data.title || data.workspaceName) {
              localStorage.setItem(`livepad_local_room_title_${roomId}`, data.title || data.workspaceName);
            }
            if (data.label) {
              localStorage.setItem(`livepad_local_room_label_${roomId}`, data.label);
            }
          } catch {}
        }

        const remoteClientId = data.lastClientId;
        const remoteTxId = data.lastTxId;
        const remoteContent = data.content || '';

        const isLocalEcho = snapshot.metadata.hasPendingWrites ||
                            (remoteClientId && remoteClientId === clientIdRef.current) ||
                            (remoteTxId && remoteTxId === lastTxIdRef.current);

        if (lastSyncedContentRef.current === '' && !roomRef.current) {
          lastSyncedContentRef.current = remoteContent;
        }

        if (isLocalEcho) {
          // This snapshot was triggered by our own write. Do NOT touch local document content!
          setRoom(prev => {
            if (!prev) return roomData;
            return {
              ...prev,
              users: roomData.users,
              typingUsers: roomData.typingUsers,
              participants: roomData.participants,
              title: roomData.title,
              label: roomData.label,
              attachments: roomData.attachments || [],
              status: roomData.status,
              permissions: roomData.permissions,
              codeModeOpen: roomData.codeModeOpen,
              codeModeOpenedBy: roomData.codeModeOpenedBy,
              codeModeOpenedAt: roomData.codeModeOpenedAt,
            };
          });
        } else {
          // Remote change from another user or initial snapshot
          lastSyncedContentRef.current = remoteContent;
          if (updateLockRef.current && roomRef.current) {
            // If local user is actively typing, preserve local content and update metadata
            setRoom(prev => prev ? {
              ...prev,
              users: roomData.users,
              typingUsers: roomData.typingUsers,
              participants: roomData.participants,
              title: roomData.title,
              label: roomData.label,
              attachments: roomData.attachments || [],
              codeModeOpen: roomData.codeModeOpen,
              codeModeOpenedBy: roomData.codeModeOpenedBy,
              codeModeOpenedAt: roomData.codeModeOpenedAt,
            } : roomData);
          } else {
            setRoom(roomData);
          }
        }
        setSyncStatus('synced');
        setIsConnected(true);
      }, (err) => {
        setIsConnected(false);
        setSyncStatus('offline');
        // Let's print clean firestore error format
        try {
          handleFirestoreError(err, OperationType.GET, `rooms/${roomId}`);
        } catch (wrapped) {
          console.warn(wrapped);
        }
        // Gracefully fallback to Offline/BroadcastChannel mode on database connection failures
        console.warn("Firestore database stream disconnected; transitioning this document stream to Offline/BroadcastChannel mode.");
        setUseFirebase(false);
      });

      // Firebase Edit History subcollection listener
      const historyCol = collection(db, 'rooms', roomId, 'history');
      const historyQuery = query(historyCol, orderBy('updatedAt', 'desc'), limit(30));
      const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        const historyList = snapshot.docs.map(docSnapshot => {
          const d = docSnapshot.data();
          let ts = Date.now();
          if (d.updatedAt) {
            if (typeof d.updatedAt.toDate === 'function') {
              ts = d.updatedAt.toDate().getTime();
            } else if (typeof d.updatedAt === 'number') {
              ts = d.updatedAt;
            }
          }
          return {
            id: docSnapshot.id,
            content: d.content || '',
            updatedAt: ts,
            authorName: d.authorName || 'Anonymous Writer',
          };
        });
        setHistory(historyList);
      }, (err) => {
        const errStr = String(err);
        if (errStr.includes('resource-exhausted') || errStr.includes('Quota')) {
          markQuotaExhausted();
          setUseFirebase(false);
        } else {
          console.warn("History subcollection listener failed:", err);
        }
      });

      // Presence & Participant Joining (atomic nested update to avoid race conditions)
      const notifyPresence = async () => {
        try {
          if (isFirestoreQuotaExhausted()) return;
          const currentUid = auth?.currentUser?.uid || uid;
          if (!currentUid) return;

          // Check room metadata first to determine user's role
          const snap = await getDoc(roomDocRef);
          let assignedRole: WorkspaceRole = 'member';
          if (snap.exists()) {
            const rData = snap.data();
            const wType: WorkspaceType = rData.workspaceType || 'team';
            const tDef = WORKSPACE_TYPES[wType] || WORKSPACE_TYPES.team;
            if (rData.creatorId && rData.creatorId === currentUid) {
              assignedRole = rData.creatorRole || tDef.creatorRole;
            } else if (rData.participants?.[currentUid]?.role) {
              assignedRole = rData.participants[currentUid].role;
            } else {
              assignedRole = tDef.participantRole;
            }
          }

          const userColorLocal = localStorage.getItem('livepad_color') || '#3b82f6';
          const userObj: UserPresence = {
            uid: currentUid,
            name: userNameRef.current || 'Anonymous Writer',
            joinedAt: Date.now(),
            color: userColorLocal,
            isOnline: true,
            lastActive: Date.now(),
            role: assignedRole
          };

          const participantObj: WorkspaceParticipant = {
            uid: currentUid,
            name: userNameRef.current || 'Anonymous Writer',
            role: assignedRole,
            joinedAt: Date.now(),
            color: userColorLocal,
            isOnline: true,
            lastActive: Date.now()
          };

          await updateDoc(roomDocRef, {
            [`users.${currentUid}`]: userObj,
            [`participants.${currentUid}`]: participantObj
          });
        } catch (err) {
          const errStr = String(err);
          if (errStr.includes('resource-exhausted') || errStr.includes('Quota')) {
            markQuotaExhausted();
            setUseFirebase(false);
          } else {
            console.error("Presence entry failed", err);
          }
        }
      };

      notifyPresence();

      // Continuous pulse heartbeat updating only our specific nested entry
      const heartbeatInterval = setInterval(async () => {
        try {
          if (isFirestoreQuotaExhausted()) return;
          const currentUid = auth?.currentUser?.uid || uid;
          if (!currentUid) return;
          await updateDoc(roomDocRef, {
            [`users.${currentUid}.lastActive`]: Date.now(),
            [`users.${currentUid}.isOnline`]: true
          });
        } catch (e) {
          const errStr = String(e);
          if (errStr.includes('resource-exhausted') || errStr.includes('Quota')) {
            markQuotaExhausted();
            setUseFirebase(false);
          }
        }
      }, 30000);

      // Presence Leaving clean-up using atomic field paths
      const leavePresence = async () => {
        try {
          if (isFirestoreQuotaExhausted()) return;
          const currentUid = auth?.currentUser?.uid || uid;
          if (!currentUid) return;
          await updateDoc(roomDocRef, {
            [`users.${currentUid}.isOnline`]: false,
            [`typingUsers.${currentUid}`]: false
          });
        } catch (e) {
          // ignore
        }
      };

      return () => {
        unsubscribe();
        unsubscribeHistory();
        clearInterval(heartbeatInterval);
        leavePresence();
      };

    } else {
      // BROWSER BroadcastChannel Fallback - Real sync across local tabs!
      const channelName = `livepad_sync_room_${roomId}`;
      const channel = new BroadcastChannel(channelName);
      channelRef.current = channel;

      const userColorLocal = localStorage.getItem('livepad_color') || '#3b82f6';
      
      // Initialize room template locally
      const localRoomKey = `livepad_local_room_${roomId}`;
      let savedRawRoomText = localStorage.getItem(localRoomKey);
      if (savedRawRoomText === null) {
        // Fallback: check recent workspaces / library cache in PWA storage
        const recents = getRecentWorkspaces();
        const found = recents.find((r) => r.code === roomId || r.id === roomId);
        if (found) {
          savedRawRoomText = found.snippet || '';
          try {
            localStorage.setItem(localRoomKey, savedRawRoomText);
            if (found.title) {
              localStorage.setItem(`livepad_local_room_title_${roomId}`, found.title);
            }
          } catch {}
        } else {
          setError("Room does not exist.");
          setRoom(null);
          return;
        }
      }
      const savedRoomText = savedRawRoomText;
      const localLabelKey = `livepad_local_room_label_${roomId}`;
      const savedLabelText = localStorage.getItem(localLabelKey) || '';
      const localTitleKey = `livepad_local_room_title_${roomId}`;
      const savedTitleText = localStorage.getItem(localTitleKey) || '';
      
      const localAttachmentsKey = `livepad_local_room_attachments_${roomId}`;
      const savedAttachmentsText = localStorage.getItem(localAttachmentsKey);
      const initialAttachments: Attachment[] = savedAttachmentsText ? JSON.parse(savedAttachmentsText) : [];

      const localHistoryKey = `livepad_local_room_history_${roomId}`;
      const savedLocalHistory = localStorage.getItem(localHistoryKey);
      const initialHistoryList: HistoryEntry[] = savedLocalHistory ? JSON.parse(savedLocalHistory) : [];
      setHistory(initialHistoryList);

      const initialUsers: Record<string, UserPresence> = {};
      initialUsers[uid] = {
        uid,
        name: userName || 'Anonymous Writer',
        joinedAt: Date.now(),
        color: userColorLocal,
        isOnline: true,
        lastActive: Date.now(),
      };

      const initialRoom: NoteRoom = {
        id: roomId,
        workspaceId: roomId,
        roomCode: roomId,
        workspaceType: 'team',
        workspaceName: savedTitleText || 'Collaborative Workspace',
        creatorId: uid,
        creatorRole: 'admin',
        status: 'active',
        privacy: 'public',
        participantLimit: 50,
        participants: {
          [uid]: {
            uid,
            name: userName || 'Anonymous Writer',
            role: 'admin',
            joinedAt: Date.now(),
            color: userColorLocal,
            isOnline: true,
            lastActive: Date.now()
          }
        },
        permissions: {
          allowGuestEdit: true,
          allowChat: true,
          allowExport: true
        },
        content: savedRoomText,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: savedTitleText,
        label: savedLabelText,
        codeModeOpen: false,
        users: initialUsers,
        typingUsers: {},
        attachments: initialAttachments,
      };

      setRoom(initialRoom);

      // Listen for other tabs
      channel.onmessage = (event) => {
        const { type, data, senderUid } = event.data;
        if (senderUid === uid) return;

        setRoom(prev => {
          if (!prev) return null;
          
          let updated = { ...prev };
          
          if (type === 'heartbeat') {
            const currUsers = { ...prev.users, ...data.users };
            // Ensure status sets isOnline
            Object.keys(currUsers).forEach(id => {
              if (currUsers[id] && id !== uid) {
                // if last heartbeat was recent, keep online
                currUsers[id].isOnline = (Date.now() - currUsers[id].lastActive) < 15000;
              }
            });
            updated.users = currUsers;
            if (data.label !== undefined) {
              updated.label = data.label;
            }
          } 
          
          else if (type === 'content_change') {
            if (senderUid !== uid && data.lastClientId !== clientIdRef.current) {
              lastSyncedContentRef.current = data.content;
              if (!updateLockRef.current) {
                updated.content = data.content;
                updated.updatedAt = data.updatedAt;
              }
            }
          } 
          
          else if (type === 'label_change') {
            updated.label = data.label;
          }

          else if (type === 'title_change') {
            updated.title = data.title;
            localStorage.setItem(`livepad_local_room_title_${roomId}`, data.title);
          }

          else if (type === 'code_mode') {
            updated.codeModeOpen = data.open === true;
            updated.codeModeOpenedBy = data.openedBy || senderUid;
            updated.codeModeOpenedAt = typeof data.openedAt === 'number' ? data.openedAt : Date.now();
          }
          
          else if (type === 'attachments_change') {
            updated.attachments = data.attachments;
          }
          
          else if (type === 'typing') {
            updated.typingUsers = {
              ...prev.typingUsers,
              [senderUid]: data.isTyping,
            };
          } 

          else if (type === 'cursor_change') {
            if (updated.users[senderUid]) {
              updated.users[senderUid] = {
                ...updated.users[senderUid],
                cursorIndex: data.cursorIndex
              };
            }
          }

          else if (type === 'history_change') {
            setHistory(data.history);
          }
          
          else if (type === 'join') {
            const currUsers = { ...prev.users, [senderUid]: data.user };
            updated.users = currUsers;
            // Reply heartbeat
            channel.postMessage({
              type: 'heartbeat_reply',
              senderUid: uid,
              data: {
                user: {
                  uid,
                  name: userNameRef.current || 'Anonymous Writer',
                  joinedAt: Date.now(),
                  color: userColorLocal,
                  isOnline: true,
                  lastActive: Date.now(),
                  cursorIndex: myCursorIndexRef.current
                }
              }
            });
          } 
          
          else if (type === 'heartbeat_reply') {
            updated.users = {
              ...prev.users,
              [senderUid]: data.user
            };
          }

          return updated;
        });
      };

      // Announce Presence Join
      channel.postMessage({
        type: 'join',
        senderUid: uid,
        data: {
          user: {
            uid,
            name: userName || 'Anonymous Writer',
            joinedAt: Date.now(),
            color: userColorLocal,
            isOnline: true,
            lastActive: Date.now(),
            cursorIndex: myCursorIndexRef.current
          }
        }
      });

      // Broadcast heartbeat pulse to keep presence alive in browser tabs
      const heartbeatTimer = setInterval(() => {
        const userPresenceStateObj = {
          uid,
          name: userNameRef.current || 'Anonymous Writer',
          joinedAt: Date.now(),
          color: userColorLocal,
          isOnline: true,
          lastActive: Date.now(),
          cursorIndex: myCursorIndexRef.current
        };
        
        const latestLabel = localStorage.getItem(`livepad_local_room_label_${roomId}`) || '';

        channel.postMessage({
          type: 'heartbeat',
          senderUid: uid,
          data: {
            users: {
              [uid]: userPresenceStateObj
            },
            label: latestLabel
          }
        });

        // Prune stale user presences locally
        setRoom(prev => {
          if (!prev) return null;
          const updatedUsers = { ...prev.users };
          let changed = false;
          Object.keys(updatedUsers).forEach(id => {
            if (id !== uid && updatedUsers[id].isOnline) {
              const age = Date.now() - updatedUsers[id].lastActive;
              if (age > 25000) {
                updatedUsers[id].isOnline = false;
                changed = true;
              }
            }
          });
          return changed ? { ...prev, users: updatedUsers } : prev;
        });
      }, 5000);

      return () => {
        channel.close();
        clearInterval(heartbeatTimer);
      };
    }
  }, [roomId, uid, useFirebase, refreshKey]);

  // Send update to Backend (Firestore / Broadcast Channel)
  const syncPayload = useCallback(async (text: string) => {
    if (!roomId) return;
    setSyncStatus('saving');

    // Always store instant offline local recovery backup
    try {
      localStorage.setItem(`livepad_local_room_${roomId}`, text);
    } catch {
      // quota safeguard
    }

    const txId = 'tx_' + clientIdRef.current + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    lastTxIdRef.current = txId;

    if (useFirebase && db && !isFirestoreQuotaExhausted()) {
      try {
        const roomDocRef = doc(db, 'rooms', roomId);
        await syncCoordinatorRef.current.run({
          id: txId,
          run: async () => {
            await updateDoc(roomDocRef, {
              content: text,
              updatedAt: serverTimestamp(),
              lastClientId: clientIdRef.current,
              lastTxId: txId,
            });
          },
        });
        offlineOutbox.remove(roomId, txId);
        setSyncStatus('synced');
        setIsConnected(true);
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('resource-exhausted') || errStr.includes('Quota')) {
          markQuotaExhausted();
          setUseFirebase(false);
          if (channelRef.current) {
            channelRef.current.postMessage({
              type: 'content_change',
              senderUid: uid,
              data: { content: text, updatedAt: Date.now(), lastClientId: clientIdRef.current, lastTxId: txId }
            });
          }
          setSyncStatus('synced');
        } else {
          console.warn('[LivePad Sync] Remote write failed; preserving edit in durable outbox.', err);
          offlineOutbox.enqueue({
            roomId,
            content: text,
            txId,
            clientId: clientIdRef.current,
            updatedAt: Date.now(),
          });
          setIsConnected(false);
          setSyncStatus('offline');
        }
      }
    } else {
      // Local Sync
      const localRoomKey = `livepad_local_room_${roomId}`;
      localStorage.setItem(localRoomKey, text);
      
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'content_change',
          senderUid: uid,
          data: {
            content: text,
            updatedAt: Date.now(),
            lastClientId: clientIdRef.current,
            lastTxId: txId,
          }
        });
      }
      setSyncStatus('synced');
    }
  }, [roomId, uid, useFirebase]);

  const lastTypingAnnouncedRef = useRef<number>(0);
  const isCurrentlyTypingStateRef = useRef<boolean>(false);

  // Typing state announcer
  const announceTyping = useCallback((isTyping: boolean) => {
    if (!roomId || !uid) return;

    const now = Date.now();
    if (isTyping) {
      if (isCurrentlyTypingStateRef.current && (now - lastTypingAnnouncedRef.current < 2500)) {
        return; // Throttle redundant writes while actively typing
      }
      isCurrentlyTypingStateRef.current = true;
      lastTypingAnnouncedRef.current = now;
    } else {
      if (!isCurrentlyTypingStateRef.current && !isTyping) return;
      isCurrentlyTypingStateRef.current = false;
    }

    if (useFirebase && db) {
      const roomDocRef = doc(db, 'rooms', roomId);
      updateDoc(roomDocRef, {
        [`typingUsers.${uid}`]: isTyping
      }).catch(() => {
        // tolerate failures during typing flood
      });
    } else {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'typing',
          senderUid: uid,
          data: { isTyping }
        });
      }
      // Optimistically show typing in our local state
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          typingUsers: {
            ...prev.typingUsers,
            [uid]: isTyping
          }
        };
      });
    }
  }, [roomId, uid, useFirebase]);

  const lastHistoryContentRef = useRef<string>('');
  const lastHistoryTimeRef = useRef<number>(0);

  // Automatically record significant historical versions of the pad content
  const saveHistoryEntry = useCallback(async (text: string) => {
    if (!roomId || !text || text.trim() === '') return;
    if (text === lastHistoryContentRef.current) return;

    // Minimal 5-second interval gap to avoid database flooding from single edits
    if (Date.now() - lastHistoryTimeRef.current < 5000) return;

    lastHistoryContentRef.current = text;
    lastHistoryTimeRef.current = Date.now();

    const authorName = userNameRef.current || 'Anonymous Writer';

    if (useFirebase && db) {
      try {
        const historyCol = collection(db, 'rooms', roomId, 'history');
        await addDoc(historyCol, {
          content: text,
          updatedAt: serverTimestamp(),
          authorName,
          authorUid: uid
        });
      } catch (err) {
        console.error("Failed to add Firestore history entry:", err);
      }
    } else {
      // Local Fallback History Logic
      const localHistoryKey = `livepad_local_room_history_${roomId}`;
      const savedLocalHistory = localStorage.getItem(localHistoryKey);
      let currentHistory: HistoryEntry[] = savedLocalHistory ? JSON.parse(savedLocalHistory) : [];

      const newEntry: HistoryEntry = {
        id: 'hist_' + Math.random().toString(36).substring(2, 11),
        content: text,
        updatedAt: Date.now(),
        authorName
      };

      currentHistory = [newEntry, ...currentHistory].slice(0, 30);
      localStorage.setItem(localHistoryKey, JSON.stringify(currentHistory));
      setHistory(currentHistory);

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'history_change',
          senderUid: uid,
          data: {
            history: currentHistory
          }
        });
      }
    }
  }, [roomId, uid, useFirebase]);

  // Main input text trigger (handles synchronization debouncing and state updating)
  const updateContent = useCallback((text: string) => {
    // Lock snapshots during typing to prevent rubber-banding of cursors
    updateLockRef.current = true;

    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        content: text,
        updatedAt: Date.now()
      };
    });

    setSyncStatus('saving');

    // Debounce Save content
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      syncPayload(text).then(() => {
        setTimeout(() => {
          updateLockRef.current = false;
        }, 500);
      });
    }, 250);

    // Typing State Trigger
    announceTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      announceTyping(false);
      saveHistoryEntry(text);
    }, 1500);

  }, [syncPayload, announceTyping, saveHistoryEntry]);

  // Revert active content back to a historical version snapshot
  const revertToHistory = useCallback(async (contentToApply: string) => {
    if (!roomId) return;
    setSyncStatus('saving');

    updateLockRef.current = true;

    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        content: contentToApply,
        updatedAt: Date.now()
      };
    });

    await syncPayload(contentToApply);
    updateLockRef.current = false;
  }, [roomId, syncPayload]);

  // Send label update to Backend (Firestore / Broadcast Channel)
  const updateLabel = useCallback(async (newLabel: string) => {
    if (!roomId) return;
    setSyncStatus('saving');

    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        label: newLabel
      };
    });

    if (useFirebase && db) {
      try {
        const roomDocRef = doc(db, 'rooms', roomId);
        await updateDoc(roomDocRef, {
          label: newLabel,
          updatedAt: serverTimestamp(),
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error("Label update error:", err);
        setSyncStatus('error');
      }
    } else {
      // Local Sync
      const localLabelKey = `livepad_local_room_label_${roomId}`;
      localStorage.setItem(localLabelKey, newLabel);
      
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'label_change',
          senderUid: uid,
          data: {
            label: newLabel
          }
        });
      }
      setSyncStatus('synced');
    }
  }, [roomId, uid, useFirebase]);

  // Send title update to Backend (Firestore / Broadcast Channel)
  const updateTitle = useCallback(async (newTitle: string) => {
    if (!roomId) return;
    setSyncStatus('saving');

    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        title: newTitle
      };
    });

    if (useFirebase && db) {
      try {
        const roomDocRef = doc(db, 'rooms', roomId);
        await updateDoc(roomDocRef, {
          title: newTitle,
          updatedAt: serverTimestamp(),
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error("Title update error:", err);
        setSyncStatus('error');
      }
    } else {
      // Local Sync
      const localTitleKey = `livepad_local_room_title_${roomId}`;
      localStorage.setItem(localTitleKey, newTitle);
      
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'title_change',
          senderUid: uid,
          data: {
            title: newTitle
          }
        });
      }
      setSyncStatus('synced');
    }
  }, [roomId, uid, useFirebase]);

  // Sync list of attachments to firestore or local storage
  const updateAttachments = useCallback(async (attachments: Attachment[]) => {
    if (!roomId) return;
    setSyncStatus('saving');

    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        attachments
      };
    });

    if (useFirebase && db) {
      try {
        const roomDocRef = doc(db, 'rooms', roomId);
        await updateDoc(roomDocRef, {
          attachments,
          updatedAt: serverTimestamp(),
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error("Attachments save error:", err);
        setSyncStatus('error');
        // Revert local state to actual server database status by querying a snapshot
        try {
          const snap = await getDoc(doc(db, 'rooms', roomId));
          if (snap.exists()) {
            const d = snap.data();
            setRoom(prev => prev ? { ...prev, attachments: d.attachments || [] } : null);
          }
        } catch (revertErr) {
          console.warn("Failed to revert attachments state:", revertErr);
        }
        throw err;
      }
    } else {
      // Local Sync fallback
      const localAttachmentsKey = `livepad_local_room_attachments_${roomId}`;
      localStorage.setItem(localAttachmentsKey, JSON.stringify(attachments));

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'attachments_change',
          senderUid: uid,
          data: {
            attachments
          }
        });
      }
      setSyncStatus('synced');
    }
  }, [roomId, uid, useFirebase]);

  // Network connection monitoring & tab visibility lifecycle management
  useEffect(() => {
    if (!roomId || !uid) return;

    const handleOnline = () => {
      console.log("[useLiveRoom] Network connection restored. Syncing workspace...");
      setIsConnected(true);
      setSyncStatus('reconnecting');
      if (isFirebaseConfigured && !useFirebase) {
        setUseFirebase(true);
      }
      refresh();
    };

    const handleOffline = () => {
      console.warn("[useLiveRoom] Network connection lost.");
      setIsConnected(false);
      setSyncStatus('offline');
    };

    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      isAwayRef.current = isHidden;

      if (useFirebase && db) {
        const roomDocRef = doc(db, 'rooms', roomId);
        updateDoc(roomDocRef, {
          [`users.${uid}.status`]: isHidden ? 'away' : 'online',
          [`users.${uid}.lastActive`]: Date.now()
        }).catch(() => {});
      } else if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'status_change',
          senderUid: uid,
          data: { status: isHidden ? 'away' : 'online' }
        });
      }
    };

    const handleBeforeUnload = () => {
      if (useFirebase && db) {
        const roomDocRef = doc(db, 'rooms', roomId);
        updateDoc(roomDocRef, {
          [`users.${uid}.isOnline`]: false,
          [`users.${uid}.status`]: 'offline',
          [`users.${uid}.lastActive`]: Date.now(),
          [`typingUsers.${uid}`]: false
        }).catch(() => {});
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, uid, useFirebase, refresh]);

  // Set current user's cursor index and optional selection range, and broadcast to all remote clients
  const updateCursorIndex = useCallback((indexOrObj: number | any, selectionEnd?: number) => {
    if (!roomId || !uid) return;

    let index: number | undefined;
    let lineNumber: number | undefined;
    let columnNumber: number | undefined;
    let selectionEndLine: number | undefined;
    let selectionEndColumn: number | undefined;

    if (typeof indexOrObj === 'object' && indexOrObj !== null) {
      lineNumber = indexOrObj.lineNumber;
      columnNumber = indexOrObj.columnNumber;
      selectionEndLine = indexOrObj.selectionEndLine;
      selectionEndColumn = indexOrObj.selectionEndColumn;
    } else {
      index = indexOrObj;
    }

    // 1. Keep cursor UI responsive without forcing a full App tree update for every
    // editor cursor event. Coalesce bursts into one state update per animation frame.
    pendingCursorStateRef.current = { cursorIndex: index, selectionEnd, lineNumber, columnNumber, selectionEndLine, selectionEndColumn };
    if (cursorFrameRef.current === null) {
      cursorFrameRef.current = requestAnimationFrame(() => {
        cursorFrameRef.current = null;
        const pending = pendingCursorStateRef.current;
        pendingCursorStateRef.current = null;
        if (!pending) return;
        setRoom(prev => {
          if (!prev || !prev.users?.[uid]) return prev;
          return { ...prev, users: { ...prev.users, [uid]: { ...prev.users[uid], ...pending } } };
        });
      });
    }

    // 2. Broadcast via BroadcastChannel immediately (instant peer-to-peer/offline coordination)
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'cursor_change',
        senderUid: uid,
        data: {
          cursorIndex: index,
          selectionEnd,
          lineNumber,
          columnNumber,
          selectionEndLine,
          selectionEndColumn
        }
      });
    }

    // 3. For Firebase database, use low-overhead throttled database writes
    if (useFirebase && db && !isFirestoreQuotaExhausted()) {
      if (dbThrottleTimeoutRef.current) {
        clearTimeout(dbThrottleTimeoutRef.current);
      }
      dbThrottleTimeoutRef.current = setTimeout(async () => {
        dbThrottleTimeoutRef.current = null;
        try {
          if (isFirestoreQuotaExhausted()) return;
          const roomDocRef = doc(db, 'rooms', roomId);
          const updateData: any = {
            [`users.${uid}.lastActive`]: Date.now(),
            [`users.${uid}.isOnline`]: !isAwayRef.current,
            [`users.${uid}.status`]: isAwayRef.current ? 'away' : 'online'
          };
          if (index !== undefined) updateData[`users.${uid}.cursorIndex`] = index;
          if (selectionEnd !== undefined) updateData[`users.${uid}.selectionEnd`] = selectionEnd;
          if (lineNumber !== undefined) updateData[`users.${uid}.lineNumber`] = lineNumber;
          if (columnNumber !== undefined) updateData[`users.${uid}.columnNumber`] = columnNumber;
          if (selectionEndLine !== undefined) updateData[`users.${uid}.selectionEndLine`] = selectionEndLine;
          if (selectionEndColumn !== undefined) updateData[`users.${uid}.selectionEndColumn`] = selectionEndColumn;

          await updateDoc(roomDocRef, updateData);
        } catch (err) {
          const errStr = String(err);
          if (errStr.includes('resource-exhausted') || errStr.includes('Quota')) {
            markQuotaExhausted();
            setUseFirebase(false);
          }
        }
      }, 1000);
    }
  }, [roomId, uid, useFirebase]);

  // Focused Phase 3 responsibilities: presence, participants and membership mutations.
  const { activeUsers, allParticipants } = useWorkspacePresence(room, uid);
  const currentRole: WorkspaceRole = room
    ? (room.participants?.[uid]?.role || (room.creatorId === uid ? room.creatorRole : (WORKSPACE_TYPES[room.workspaceType || 'team']?.participantRole || 'member')))
    : 'member';
  const isCreator = room ? room.creatorId === uid : false;
  const isOwner = room ? (room.creatorId === uid || room.participants?.[uid]?.role === 'owner' || currentRole === 'owner') : false;
  const canEdit = useMemo(() => {
    if (!room) return true;
    if (room.status === 'archived' || room.status === 'expired' || room.status === 'deleted') return false;
    return ['owner', 'editor', 'collaborator', 'teacher', 'admin', 'member'].includes(currentRole);
  }, [room, currentRole]);
  const canComment = useMemo(() => {
    if (!room) return true;
    if (room.status === 'archived' || room.status === 'expired' || room.status === 'deleted') return false;
    return ['owner', 'editor', 'commenter', 'collaborator', 'student', 'teacher', 'admin', 'member'].includes(currentRole);
  }, [room, currentRole]);
  const { archiveWorkspace, restoreWorkspace, deleteWorkspace, updateParticipantRole, removeParticipant, transferOwnership } =
    useWorkspaceMembership({ roomId, uid, useFirebase, setRoom });

  const setCodeModeOpen = useCallback(async (open: boolean) => {
    if (!roomId || !room || !['owner', 'admin', 'teacher'].includes(currentRole)) return false;
    const openedAt = Date.now();
    setRoom(prev => prev ? { ...prev, codeModeOpen: open, codeModeOpenedBy: uid, codeModeOpenedAt: openedAt } : prev);
    if (useFirebase && db) {
      try {
        const roomDocRef = doc(db, 'rooms', roomId);
        await updateDoc(roomDocRef, {
          codeModeOpen: open,
          codeModeOpenedBy: uid,
          codeModeOpenedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        setRoom(prev => prev ? { ...prev, codeModeOpen: room.codeModeOpen, codeModeOpenedBy: room.codeModeOpenedBy, codeModeOpenedAt: room.codeModeOpenedAt } : prev);
        channelRef.current?.postMessage({ type: 'code_mode', senderUid: uid, data: { open, openedBy: uid, openedAt } });
        return false;
      }
    }
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'code_mode',
        senderUid: uid,
        data: { open, openedBy: uid, openedAt }
      });
    }
    return true;
  }, [roomId, room, uid, currentRole, useFirebase]);

  return {
    room,
    syncStatus,
    error,
    uid,
    userColor,
    isConnected,
    updateContent,
    setIsConnected,
    activeUsers,
    allParticipants,
    setTyping: announceTyping,
    updateLabel,
    updateTitle,
    history,
    revertToHistory,
    updateCursorIndex,
    updateAttachments,
    refresh,
    currentRole,
    isCreator,
    isOwner,
    canEdit,
    canComment,
    archiveWorkspace,
    restoreWorkspace,
    deleteWorkspace,
    updateParticipantRole,
    removeParticipant,
    transferOwnership,
    workspaceType: room?.workspaceType || 'team',
    workspaceName: room?.workspaceName || room?.title || 'Workspace',
    roomCode: room?.roomCode || roomId,
    workspaceStatus: room?.status || workspaceStatus || 'active',
    codeModeOpen: room?.codeModeOpen === true,
    setCodeModeOpen
  };
}

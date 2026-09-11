import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Code, 
  Smile, 
  X, 
  CheckCheck,
  Check, 
  Sparkles, 
  Terminal, 
  User, 
  Copy, 
  CornerDownRight,
  CornerUpLeft,
  Edit2,
  Hash,
  Activity,
  Minimize2,
  Maximize2,
  Search,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  Layers,
  Calendar,
  Volume2,
  AtSign,
  Clock,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPresence, WorkspaceRole } from '../../types';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, isFirestoreQuotaExhausted, markQuotaExhausted } from '../../lib/firebase';
import { playMentionChime, isUserMentioned } from '../../utils/soundAlert';

export interface ChatMessage {
  id: string;
  clientKey?: string;
  senderUid: string;
  senderName: string;
  senderColor?: string;
  senderRole?: WorkspaceRole;
  text: string;
  isEdited?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
    hasSnippet?: boolean;
  };
  codeSnippet?: {
    language: string;
    code: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of user uids
  readBy?: string[]; // array of user UIDs who have read this message
  timestamp: number;
  type?: 'user' | 'system' | 'commit';
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  activeUsers: UserPresence[];
  currentUid: string;
  userName: string;
  currentRole: WorkspaceRole;
  isFloating?: boolean;
  theme?: 'light' | 'dark' | 'sepia' | 'system';
  onInsertCodeToEditor?: (code: string) => void;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

const QUICK_EMOJIS = ['👍', '🚀', '🔥', '💡', '🎉', '❤️', '👀', '💯'];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface UserColorTheme {
  avatarBg: string;
  avatarText: string;
  avatarBorder: string;
  bubbleBg: string;
  bubbleBorder: string;
  bubbleText: string;
  nameText: string;
}

const USER_THEMES: UserColorTheme[] = [
  {
    avatarBg: 'bg-emerald-500/15 dark:bg-emerald-500/25 sepia:bg-emerald-600/15',
    avatarText: 'text-emerald-700 dark:text-emerald-300 sepia:text-emerald-800',
    avatarBorder: 'border-emerald-500/40 dark:border-emerald-500/50 sepia:border-emerald-600/40',
    bubbleBg: 'bg-emerald-50/90 dark:bg-emerald-950/60 sepia:bg-[#e8f3e9]',
    bubbleBorder: 'border-emerald-200 dark:border-emerald-700/60 sepia:border-emerald-300/80',
    bubbleText: 'text-emerald-950 dark:text-emerald-100 sepia:text-[#1c3c22]',
    nameText: 'text-emerald-700 dark:text-emerald-400 sepia:text-emerald-800'
  },
  {
    avatarBg: 'bg-sky-500/15 dark:bg-sky-500/25 sepia:bg-sky-600/15',
    avatarText: 'text-sky-700 dark:text-sky-300 sepia:text-sky-800',
    avatarBorder: 'border-sky-500/40 dark:border-sky-500/50 sepia:border-sky-600/40',
    bubbleBg: 'bg-sky-50/90 dark:bg-sky-950/60 sepia:bg-[#e6f1f8]',
    bubbleBorder: 'border-sky-200 dark:border-sky-700/60 sepia:border-sky-300/80',
    bubbleText: 'text-sky-950 dark:text-sky-100 sepia:text-[#18354b]',
    nameText: 'text-sky-700 dark:text-sky-400 sepia:text-sky-800'
  },
  {
    avatarBg: 'bg-amber-500/15 dark:bg-amber-500/25 sepia:bg-amber-600/15',
    avatarText: 'text-amber-700 dark:text-amber-300 sepia:text-amber-800',
    avatarBorder: 'border-amber-500/40 dark:border-amber-500/50 sepia:border-amber-600/40',
    bubbleBg: 'bg-amber-50/90 dark:bg-amber-950/60 sepia:bg-[#f8f0df]',
    bubbleBorder: 'border-amber-200 dark:border-amber-700/60 sepia:border-amber-300/80',
    bubbleText: 'text-amber-950 dark:text-amber-100 sepia:text-[#432e12]',
    nameText: 'text-amber-700 dark:text-amber-400 sepia:text-amber-800'
  },
  {
    avatarBg: 'bg-rose-500/15 dark:bg-rose-500/25 sepia:bg-rose-600/15',
    avatarText: 'text-rose-700 dark:text-rose-300 sepia:text-rose-800',
    avatarBorder: 'border-rose-500/40 dark:border-rose-500/50 sepia:border-rose-600/40',
    bubbleBg: 'bg-rose-50/90 dark:bg-rose-950/60 sepia:bg-[#fae8eb]',
    bubbleBorder: 'border-rose-200 dark:border-rose-700/60 sepia:border-rose-300/80',
    bubbleText: 'text-rose-950 dark:text-rose-100 sepia:text-[#481822]',
    nameText: 'text-rose-700 dark:text-rose-400 sepia:text-rose-800'
  },
  {
    avatarBg: 'bg-indigo-500/15 dark:bg-indigo-500/25 sepia:bg-indigo-600/15',
    avatarText: 'text-indigo-700 dark:text-indigo-300 sepia:text-indigo-800',
    avatarBorder: 'border-indigo-500/40 dark:border-indigo-500/50 sepia:border-indigo-600/40',
    bubbleBg: 'bg-indigo-50/90 dark:bg-indigo-950/60 sepia:bg-[#eae8f8]',
    bubbleBorder: 'border-indigo-200 dark:border-indigo-700/60 sepia:border-indigo-300/80',
    bubbleText: 'text-indigo-950 dark:text-indigo-100 sepia:text-[#211d4b]',
    nameText: 'text-indigo-700 dark:text-indigo-400 sepia:text-indigo-800'
  },
  {
    avatarBg: 'bg-teal-500/15 dark:bg-teal-500/25 sepia:bg-teal-600/15',
    avatarText: 'text-teal-700 dark:text-teal-300 sepia:text-teal-800',
    avatarBorder: 'border-teal-500/40 dark:border-teal-500/50 sepia:border-teal-600/40',
    bubbleBg: 'bg-teal-50/90 dark:bg-teal-950/60 sepia:bg-[#e5f4f3]',
    bubbleBorder: 'border-teal-200 dark:border-teal-700/60 sepia:border-teal-300/80',
    bubbleText: 'text-teal-950 dark:text-teal-100 sepia:text-[#143b39]',
    nameText: 'text-teal-700 dark:text-teal-400 sepia:text-teal-800'
  },
  {
    avatarBg: 'bg-fuchsia-500/15 dark:bg-fuchsia-500/25 sepia:bg-fuchsia-600/15',
    avatarText: 'text-fuchsia-700 dark:text-fuchsia-300 sepia:text-fuchsia-800',
    avatarBorder: 'border-fuchsia-500/40 dark:border-fuchsia-500/50 sepia:border-fuchsia-600/40',
    bubbleBg: 'bg-fuchsia-50/90 dark:bg-fuchsia-950/60 sepia:bg-[#f8e7f5]',
    bubbleBorder: 'border-fuchsia-200 dark:border-fuchsia-700/60 sepia:border-fuchsia-300/80',
    bubbleText: 'text-fuchsia-950 dark:text-fuchsia-100 sepia:text-[#451441]',
    nameText: 'text-fuchsia-700 dark:text-fuchsia-400 sepia:text-fuchsia-800'
  },
  {
    avatarBg: 'bg-cyan-500/15 dark:bg-cyan-500/25 sepia:bg-cyan-600/15',
    avatarText: 'text-cyan-700 dark:text-cyan-300 sepia:text-cyan-800',
    avatarBorder: 'border-cyan-500/40 dark:border-cyan-500/50 sepia:border-cyan-600/40',
    bubbleBg: 'bg-cyan-50/90 dark:bg-cyan-950/60 sepia:bg-[#e4f6f8]',
    bubbleBorder: 'border-cyan-200 dark:border-cyan-700/60 sepia:border-cyan-300/80',
    bubbleText: 'text-cyan-950 dark:text-cyan-100 sepia:text-[#123e44]',
    nameText: 'text-cyan-700 dark:text-cyan-400 sepia:text-cyan-800'
  }
];

function renderTextWithMentions(text: string) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_ -]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={index}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 my-0.5 mx-0.5 shadow-xs select-none"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function getUserTheme(uid?: string, name?: string): UserColorTheme {
  const str = (uid || name || 'default').toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_THEMES.length;
  return USER_THEMES[index];
}

function getRelativeTimeString(timestamp: number, nowTime: number = Date.now()): string {
  if (!timestamp) return '';
  const diffInSeconds = Math.floor((nowTime - timestamp) / 1000);

  if (diffInSeconds < 10) return 'just now';
  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatExactTime(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({
  isOpen,
  onClose,
  roomId,
  activeUsers = [],
  currentUid,
  userName,
  currentRole,
  isFloating = true,
  onInsertCodeToEditor,
  onAddToast,
  onUnreadCountChange
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippetText, setCodeSnippetText] = useState('');
  const [codeSnippetLang, setCodeSnippetLang] = useState('typescript');
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; lastTyped: number }>>({}); // uid -> { name, lastTyped }
  const [unreadCount, setUnreadCount] = useState(0);
  const [nowTime, setNowTime] = useState(Date.now());
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);

  // Mention suggestion popup state
  const [mentionMenu, setMentionMenu] = useState<{
    query: string;
    fromIndex: number;
  } | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  const mentionSuggestions = useMemo(() => {
    if (!mentionMenu) return [];
    const q = mentionMenu.query.toLowerCase();

    const options: Array<{ uid: string; name: string; tag: string; isGroup?: boolean }> = [
      { uid: 'all', name: 'all (Notify workspace)', tag: 'all', isGroup: true },
      { uid: 'here', name: 'here (Notify online peers)', tag: 'here', isGroup: true }
    ];

    activeUsers.forEach((u) => {
      if (u.uid !== currentUid && u.name) {
        options.push({
          uid: u.uid,
          name: u.name,
          tag: u.name.replace(/\s+/g, '')
        });
      }
    });

    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.tag.toLowerCase().includes(q)
    );
  }, [mentionMenu, activeUsers, currentUid]);

  const insertMention = (tag: string) => {
    if (!mentionMenu) return;
    const cursorPos = inputRef.current?.selectionStart ?? inputText.length;
    const textBefore = inputText.slice(0, mentionMenu.fromIndex);
    const textAfter = inputText.slice(cursorPos);
    const newText = `${textBefore}@${tag} `;
    setInputText(newText);
    setMentionMenu(null);

    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = textBefore.length + tag.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Grouping options: 'none' | 'date' | 'author'
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'author'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Auto prune stale typing indicators after 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.entries(next).forEach(([uid, info]) => {
          if (now - info.lastTyped > 3500) {
            delete next[uid];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Periodically refresh relative time labels
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleStartReply = (msg: ChatMessage) => {
    setReplyingToMessage(msg);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text || '');
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setEditingText('');
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editingText.trim()) return;
    const newText = editingText.trim();

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          text: newText,
          isEdited: true
        };
      })
    );

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'EDIT_CHAT_MESSAGE',
        msgId,
        newText
      });
    }

    setEditingMsgId(null);
    setEditingText('');
    if (onAddToast) onAddToast('success', 'Message updated');
  };

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 60;
    setShowScrollBottomBtn(!isBottom);
    if (isBottom) {
      setHasUnreadBelow(false);
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setShowScrollBottomBtn(false);
    setHasUnreadBelow(false);
  };

  const lastMsgKeyRef = useRef<string | null>(null);

  // Intelligent auto-scroll on new messages or open
  useEffect(() => {
    if (!isMinimized && isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const lastKey = lastMsg.clientKey || lastMsg.id;

      if (lastMsgKeyRef.current !== lastKey) {
        lastMsgKeyRef.current = lastKey;
        if (!messagesContainerRef.current) {
          scrollToBottom(true);
        } else {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 140;
          const isSelf = lastMsg.senderUid === currentUid;

          if (isNearBottom || isSelf) {
            scrollToBottom(true);
          } else {
            setHasUnreadBelow(true);
            setShowScrollBottomBtn(true);
          }
        }
      }
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    }
  }, [messages, isMinimized, isOpen, currentUid]);

  // Setup Real-time Chat Sync (Firestore & BroadcastChannel)
  useEffect(() => {
    const defaultWelcome: ChatMessage = {
      id: 'welcome-1',
      clientKey: 'welcome-1',
      senderUid: 'system',
      senderName: 'System',
      text: roomId
        ? `Connected to Workspace Room #${roomId}. Real-time chat is active with ${activeUsers.length || 1} online participant(s).`
        : 'Welcome to Collaborative Workspace Chat! Connected peers can exchange instant messages and live code snippets.',
      timestamp: Date.now(),
      type: 'system'
    };
    setMessages([defaultWelcome]);

    const channelName = `livepad_chat_${roomId || 'default'}`;
    try {
      channelRef.current = new BroadcastChannel(channelName);
      channelRef.current.onmessage = (event) => {
        if (!event.data) return;

        if (event.data.type === 'NEW_CHAT_MESSAGE') {
          const newMsg = event.data.message;
          setMessages((prev) => {
            const key = newMsg.clientKey || newMsg.id;
            if (prev.some((m) => m.id === newMsg.id || (m.clientKey && m.clientKey === key))) return prev;
            return [...prev, { ...newMsg, clientKey: key }];
          });

          if (newMsg.senderUid !== currentUid && isUserMentioned(newMsg.text, currentUid, userName)) {
            playMentionChime();
            if (onAddToast) {
              onAddToast('info', `🔔 @${newMsg.senderName} mentioned you in chat: "${newMsg.text.slice(0, 50)}..."`);
            }
          }

          if (!isOpen || isMinimized) {
            setUnreadCount((c) => {
              const next = c + 1;
              if (onUnreadCountChange) onUnreadCountChange(next);
              return next;
            });
          }
        } else if (event.data.type === 'TYPING_STATUS') {
          const { uid, name, isTyping } = event.data;
          if (uid !== currentUid) {
            setTypingUsers((prev) => {
              const copy = { ...prev };
              if (isTyping) {
                copy[uid] = { name, lastTyped: Date.now() };
              } else {
                delete copy[uid];
              }
              return copy;
            });
          }
        } else if (event.data.type === 'MESSAGE_REACTION') {
          const { msgId, emoji, uid } = event.data;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== msgId && m.clientKey !== msgId) return m;
              const reactions = m.reactions ? { ...m.reactions } : {};
              const list = reactions[emoji] ? [...reactions[emoji]] : [];
              if (list.includes(uid)) {
                reactions[emoji] = list.filter((u) => u !== uid);
              } else {
                reactions[emoji] = [...list, uid];
              }
              return { ...m, reactions };
            })
          );
        } else if (event.data.type === 'READ_RECEIPT') {
          const { readerUid, msgIds } = event.data;
          setMessages((prev) =>
            prev.map((m) => {
              if (msgIds && msgIds.length > 0 && !msgIds.includes(m.id) && !msgIds.includes(m.clientKey)) return m;
              const list = m.readBy || [m.senderUid];
              if (!list.includes(readerUid)) {
                return { ...m, readBy: [...list, readerUid] };
              }
              return m;
            })
          );
        } else if (event.data.type === 'EDIT_CHAT_MESSAGE') {
          const { msgId, newText } = event.data;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== msgId && m.clientKey !== msgId) return m;
              return {
                ...m,
                text: newText,
                isEdited: true
              };
            })
          );
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not available for workspace chat', e);
    }

    // Firestore Realtime Listener
    let unsubscribe: () => void = () => {};
    if (db && roomId) {
      try {
        const messagesRef = collection(db, 'rooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const loadedMsgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
              loadedMsgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            if (loadedMsgs.length > 0) {
              setMessages((prev) => {
                const merged = [...prev];
                loadedMsgs.forEach((serverMsg) => {
                  // 1. Existing message match by ID or clientKey
                  const existingIdx = merged.findIndex(
                    (m) => m.id === serverMsg.id || (m.clientKey && (m.clientKey === serverMsg.id || m.id === serverMsg.id))
                  );
                  if (existingIdx >= 0) {
                    const preservedKey = merged[existingIdx].clientKey || merged[existingIdx].id;
                    merged[existingIdx] = {
                      ...merged[existingIdx],
                      ...serverMsg,
                      clientKey: preservedKey
                    };
                  } else {
                    // 2. Match local optimistic message (same sender, text, timestamp within 15 seconds)
                    const optIdx = merged.findIndex(
                      (m) =>
                        m.senderUid === serverMsg.senderUid &&
                        m.text === serverMsg.text &&
                        Math.abs(m.timestamp - serverMsg.timestamp) < 15000
                    );
                    if (optIdx >= 0) {
                      const preservedKey = merged[optIdx].clientKey || merged[optIdx].id;
                      merged[optIdx] = {
                        ...serverMsg,
                        id: serverMsg.id,
                        clientKey: preservedKey
                      };
                    } else {
                      merged.push({ ...serverMsg, clientKey: serverMsg.id });
                    }
                  }
                });
                merged.sort((a, b) => a.timestamp - b.timestamp);
                return merged;
              });
            }
          },
          (err) => {
            console.warn('Firestore chat listener error:', err);
          }
        );
      } catch (err) {
        console.warn('Unable to attach Firestore chat listener:', err);
      }
    }

    return () => {
      unsubscribe();
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [roomId]);

  // Auto-mark incoming/unread messages from others as read when chat is open
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
      const unreadMsgs = messages.filter(
        (m) => m.senderUid !== currentUid && (!m.readBy || !m.readBy.includes(currentUid))
      );
      if (unreadMsgs.length > 0) {
        const unreadIds = unreadMsgs.map((m) => m.id);
        setMessages((prev) =>
          prev.map((m) => {
            if (unreadIds.includes(m.id)) {
              const list = m.readBy || [m.senderUid];
              return { ...m, readBy: Array.from(new Set([...list, currentUid])) };
            }
            return m;
          })
        );

        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'READ_RECEIPT',
            readerUid: currentUid,
            readerName: userName,
            msgIds: unreadIds
          });
        }
      }
    }
  }, [isOpen, isMinimized, messages, currentUid, userName]);

  // Handle Typing indicator broadcast & Mention menu trigger
  const handleInputChange = (text: string) => {
    setInputText(text);

    // Detect @ mention trigger before selection/cursor
    const cursorPos = inputRef.current?.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ -]{0,20})$/);

    if (match) {
      const query = match[1];
      const fromIndex = cursorPos - match[0].length;
      setMentionMenu({ query, fromIndex });
      setMentionSelectedIndex(0);
    } else {
      setMentionMenu(null);
    }

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'TYPING_STATUS',
        uid: currentUid,
        name: userName || 'Anonymous',
        isTyping: text.length > 0
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'TYPING_STATUS',
          uid: currentUid,
          name: userName || 'Anonymous',
          isTyping: false
        });
      }
    }, 2000);
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !codeSnippetText.trim()) return;

    setMentionMenu(null);

    // Auto mark read by other active users in room if online
    const otherActiveUids = activeUsers.filter((u) => u.uid !== currentUid).map((u) => u.uid);
    const initialReadBy = Array.from(new Set([currentUid, ...otherActiveUids]));

    const replyToData = replyingToMessage
      ? {
          id: replyingToMessage.id,
          senderName: replyingToMessage.senderName,
          text: replyingToMessage.text
            ? replyingToMessage.text.slice(0, 100)
            : replyingToMessage.codeSnippet
            ? `[Code snippet: ${replyingToMessage.codeSnippet.language}]`
            : '',
          hasSnippet: !!replyingToMessage.codeSnippet
        }
      : undefined;

    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMsg: ChatMessage = {
      id: tempId,
      clientKey: tempId,
      senderUid: currentUid,
      senderName: userName || 'Anonymous',
      senderRole: currentRole,
      text: inputText.trim(),
      timestamp: Date.now(),
      type: 'user',
      readBy: initialReadBy,
      ...(replyToData ? { replyTo: replyToData } : {}),
      ...(showCodeInput && codeSnippetText.trim()
        ? {
            codeSnippet: {
              language: codeSnippetLang,
              code: codeSnippetText.trim()
            }
          }
        : {})
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setCodeSnippetText('');
    setShowCodeInput(false);
    setReplyingToMessage(null);

    // Stop typing status
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'TYPING_STATUS',
        uid: currentUid,
        name: userName || 'Anonymous',
        isTyping: false
      });
      channelRef.current.postMessage({ type: 'NEW_CHAT_MESSAGE', message: newMsg });
    }

    // Firestore save
    if (roomId && db && !isFirestoreQuotaExhausted()) {
      try {
        const messagesRef = collection(db, 'rooms', roomId, 'messages');
        await addDoc(messagesRef, {
          senderUid: newMsg.senderUid,
          senderName: newMsg.senderName,
          senderRole: newMsg.senderRole || 'member',
          text: newMsg.text,
          timestamp: newMsg.timestamp,
          type: newMsg.type,
          ...(newMsg.replyTo ? { replyTo: newMsg.replyTo } : {}),
          ...(newMsg.codeSnippet ? { codeSnippet: newMsg.codeSnippet } : {})
        });
      } catch (err) {
        if (String(err).includes('resource-exhausted') || String(err).includes('Quota')) {
          markQuotaExhausted();
        } else {
          console.warn('Failed to persist chat message to Firestore', err);
        }
      }
    }
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = m.reactions ? { ...m.reactions } : {};
        const list = reactions[emoji] ? [...reactions[emoji]] : [];
        if (list.includes(currentUid)) {
          reactions[emoji] = list.filter((u) => u !== currentUid);
        } else {
          reactions[emoji] = [...list, currentUid];
        }
        return { ...m, reactions };
      })
    );

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'MESSAGE_REACTION',
        msgId,
        emoji,
        uid: currentUid
      });
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `clear-${Date.now()}`,
        senderUid: 'system',
        senderName: 'System',
        text: 'Chat history cleared by local user.',
        timestamp: Date.now(),
        type: 'system'
      }
    ]);
    if (onAddToast) onAddToast('info', 'Chat history cleared');
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    return (
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.codeSnippet && m.codeSnippet.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const getDateKeyAndLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return { key: 'today', label: 'Today' };
    if (isYesterday) return { key: 'yesterday', label: 'Yesterday' };

    const formatted = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
    return { key: date.toISOString().split('T')[0], label: formatted };
  };

  const dateGroups = useMemo(() => {
    if (groupBy !== 'date') return [];
    const map = new Map<string, { key: string; label: string; messages: ChatMessage[] }>();
    filteredMessages.forEach((m) => {
      const { key, label } = getDateKeyAndLabel(m.timestamp);
      if (!map.has(key)) {
        map.set(key, { key, label, messages: [] });
      }
      map.get(key)!.messages.push(m);
    });
    return Array.from(map.values());
  }, [filteredMessages, groupBy]);

  const authorGroups = useMemo(() => {
    if (groupBy !== 'author') return [];
    const map = new Map<string, { key: string; authorUid: string; authorName: string; authorRole?: WorkspaceRole; messages: ChatMessage[] }>();
    filteredMessages.forEach((m) => {
      const key = m.senderUid || m.senderName;
      if (!map.has(key)) {
        map.set(key, {
          key,
          authorUid: m.senderUid,
          authorName: m.senderName,
          authorRole: m.senderRole,
          messages: []
        });
      }
      map.get(key)!.messages.push(m);
    });
    return Array.from(map.values());
  }, [filteredMessages, groupBy]);

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleAllGroups = (keys: string[]) => {
    const allCollapsed = keys.length > 0 && keys.every((k) => collapsedGroups[k]);
    if (allCollapsed) {
      setCollapsedGroups({});
    } else {
      const next: Record<string, boolean> = {};
      keys.forEach((k) => { next[k] = true; });
      setCollapsedGroups(next);
    }
  };

  const typingNames = Object.values(typingUsers).map((u) => u.name);

  const renderSingleMessage = (msg: ChatMessage) => {
    const isSelf = msg.senderUid === currentUid;
    const isSystem = msg.type === 'system';

    if (isSystem) {
      return (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center py-1"
        >
          <span
            className="inline-block px-2.5 py-1 bg-[#252526] border border-[#3c3c3c] rounded-full text-[10px] text-slate-400 font-mono"
            title={new Date(msg.timestamp).toLocaleString()}
          >
            {msg.text} <span className="opacity-60 ml-1">({getRelativeTimeString(msg.timestamp, nowTime)})</span>
          </span>
        </motion.div>
      );
    }

    const theme = isSelf ? null : getUserTheme(msg.senderUid, msg.senderName);
    const initials = getInitials(msg.senderName);
    const readByList = msg.readBy || [msg.senderUid];
    const readersExceptSelf = readByList.filter((uid) => uid !== currentUid);
    const isReadByOthers = readersExceptSelf.length > 0;
    const isUserTagged = !isSelf && isUserMentioned(msg.text, currentUid, userName);
    const isOnline = isSelf || activeUsers.some((u) => u.uid === msg.senderUid);

    const messageKey = msg.clientKey || msg.id;

    return (
      <motion.div
        id={`chat-msg-${msg.id}`}
        key={messageKey}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`flex ${isSelf ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group transition-all duration-200 my-1`}
      >
        {/* User Avatar Circle with Status Indicator */}
        <div className="relative shrink-0 group select-none">
          <div
            className={`w-7.5 h-7.5 rounded-full font-bold text-[10.5px] flex items-center justify-center shadow-md border transition-transform group-hover:scale-105 ${
              isSelf
                ? 'bg-gradient-to-br from-purple-500 via-indigo-500 to-indigo-600 text-white border-purple-400/60 shadow-purple-500/20'
                : `${theme!.avatarBg} ${theme!.avatarText} ${theme!.avatarBorder}`
            }`}
            title={`${msg.senderName} (${isSelf ? 'You - Online' : isOnline ? 'Online' : 'Offline'})`}
          >
            {initials}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#18181b] sepia:border-[#f6ebd4] ${
              isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-400 opacity-60'
            }`}
            title={isOnline ? 'Online' : 'Offline'}
          />
        </div>

        {/* Message Bubble & Meta */}
        <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[82%] space-y-1`}>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47] select-none flex-wrap">
            <span className={`font-bold ${isSelf ? 'text-purple-600 dark:text-purple-300 sepia:text-purple-800' : theme!.nameText}`}>
              {isSelf ? 'You' : msg.senderName}
            </span>
            {msg.senderRole && (
              <span className="px-1 rounded bg-slate-200/80 dark:bg-[#2a2d2e] sepia:bg-[#e2d5c3] text-[9px] uppercase font-mono border border-slate-300 dark:border-[#3c3c3c] sepia:border-[#d0c2af] text-slate-700 dark:text-slate-300 sepia:text-[#4e3f2e]">
                {msg.senderRole}
              </span>
            )}
            {isUserTagged && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 sepia:text-amber-800 border border-amber-500/40 font-bold text-[9px] flex items-center gap-0.5 shrink-0 animate-pulse select-none">
                <AtSign className="w-2.5 h-2.5" /> Mentioned You
              </span>
            )}
            {/* Explicit Timestamp & Relative Time */}
            <span
              title={new Date(msg.timestamp).toLocaleString()}
              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-help bg-slate-100 dark:bg-[#222225] sepia:bg-[#ede1ce] px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700/80 sepia:border-[#dbcebc] text-[9.5px]"
            >
              <Clock className="w-2.5 h-2.5 text-purple-500 dark:text-purple-400" />
              <span className="font-mono text-slate-700 dark:text-slate-200 sepia:text-[#4a3928]">{formatExactTime(msg.timestamp)}</span>
              <span className="opacity-60 text-[9px] text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47]">({getRelativeTimeString(msg.timestamp, nowTime)})</span>
            </span>
            {isSelf && (
              <span
                title={
                  isReadByOthers
                    ? `Read by ${readersExceptSelf.length} participant${readersExceptSelf.length > 1 ? 's' : ''}`
                    : 'Delivered to workspace'
                }
                className="inline-flex items-center gap-0.5 ml-0.5 transition-colors cursor-help"
              >
                {isReadByOthers ? (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 drop-shadow-[0_0_3px_rgba(56,189,248,0.5)]" />
                ) : (
                  <Check className="w-3 h-3 text-slate-400 opacity-80" />
                )}
              </span>
            )}
          </div>

          <div
            className={`px-3 py-2.5 rounded-[18px] text-xs leading-relaxed break-words shadow-xs relative backdrop-blur-md transition-all duration-200 ${
              isUserTagged
                ? 'bg-amber-500/20 backdrop-blur-lg border-2 border-amber-400/80 text-amber-950 dark:text-amber-100 rounded-tl-xs shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                : isSelf
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border border-white/20 rounded-br-xs shadow-sm'
                : `${theme!.bubbleBg} ${theme!.bubbleText} border ${theme!.bubbleBorder} rounded-bl-xs shadow-xs`
            }`}
          >
            {/* Quoted / Replied Message Banner */}
            {msg.replyTo && (
              <div
                onClick={() => {
                  const el = document.getElementById(`chat-msg-${msg.replyTo?.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-blue-400', 'rounded-2xl');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'rounded-2xl'), 1500);
                  }
                }}
                className={`mb-2 p-2 rounded-xl text-[11px] border-l-2 cursor-pointer transition-all ${
                  isSelf
                    ? 'bg-black/20 border-white/80 text-white hover:bg-black/35'
                    : 'bg-black/5 dark:bg-white/10 border-blue-500 text-slate-800 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/15'
                }`}
                title="Click to view quoted message"
              >
                <div className={`flex items-center gap-1 font-semibold text-[10px] mb-0.5 ${isSelf ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                  <CornerUpLeft className="w-3 h-3 shrink-0" />
                  <span>{msg.replyTo.senderName}</span>
                </div>
                <p className="truncate opacity-90 text-[11px] italic">
                  {msg.replyTo.text || (msg.replyTo.hasSnippet ? '[Code snippet]' : '')}
                </p>
              </div>
            )}

            {editingMsgId === msg.id ? (
              <div className="space-y-2 py-1 min-w-[200px] md:min-w-[240px]">
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit(msg.id);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  className="w-full p-2 bg-white/10 dark:bg-black/40 border border-purple-300/50 rounded-lg text-xs text-inherit placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-300 custom-scrollbar resize-none font-sans"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5 select-none">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2 py-1 rounded text-[10px] font-medium bg-black/20 hover:bg-black/40 text-inherit transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(msg.id)}
                    className="px-2.5 py-1 rounded text-[10px] font-semibold bg-purple-500 hover:bg-purple-400 text-white transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {msg.text && (
                  <p className="whitespace-pre-wrap">
                    {renderTextWithMentions(msg.text)}
                    {msg.isEdited && (
                      <span className="text-[9px] opacity-75 font-mono italic ml-1.5 select-none" title="Edited message">
                        (edited)
                      </span>
                    )}
                  </p>
                )}
              </>
            )}

            {/* Code Snippet Box */}
            {msg.codeSnippet && (
              <div className="mt-2 p-2.5 bg-slate-900 dark:bg-[#121212] sepia:bg-[#2b231a] rounded-xl border border-slate-800 dark:border-[#333333] sepia:border-[#42372a] text-slate-100 font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800 dark:border-[#2d2d2d]">
                  <span className="uppercase text-purple-400 font-bold">{msg.codeSnippet.language}</span>
                  <div className="flex items-center gap-2 font-sans">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.codeSnippet!.code);
                        if (onAddToast) onAddToast('success', 'Copied snippet to clipboard!');
                      }}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-0.5"
                      title="Copy snippet"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    {onInsertCodeToEditor && (
                      <button
                        onClick={() => {
                          onInsertCodeToEditor(msg.codeSnippet!.code);
                          if (onAddToast) onAddToast('success', 'Inserted snippet into editor!');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-bold"
                        title="Insert snippet into open editor"
                      >
                        <CornerDownRight className="w-3 h-3" /> Insert
                      </button>
                    )}
                  </div>
                </div>
                <pre className="overflow-x-auto text-slate-200 p-1 custom-scrollbar max-h-36 font-mono text-[11px]">
                  {msg.codeSnippet.code}
                </pre>
              </div>
            )}

            {/* Floating Reaction Emoji Picker Popover */}
            <AnimatePresence>
              {activeReactionPickerId === msg.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute z-30 ${
                    isSelf ? 'right-0 -top-10' : 'left-0 -top-10'
                  } bg-white dark:bg-[#1a1a1a] sepia:bg-[#faf4e8] border border-purple-500/50 shadow-xl rounded-full px-2 py-1 flex items-center gap-1.5 backdrop-blur-md select-none`}
                >
                  {QUICK_EMOJIS.map((emoji) => {
                    const hasReacted = msg.reactions?.[emoji]?.includes(currentUid);
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          handleToggleReaction(msg.id, emoji);
                          setActiveReactionPickerId(null);
                        }}
                        className={`p-1 text-sm hover:scale-125 transition-transform rounded-full ${
                          hasReacted ? 'bg-purple-500/35 ring-1 ring-purple-400' : 'hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emoji Reactions display */}
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1 border-t border-white/10 select-none">
                {Object.entries(msg.reactions).map(([emoji, uids]) => {
                  if (!uids || uids.length === 0) return null;
                  const hasReacted = uids.includes(currentUid);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleToggleReaction(msg.id, emoji)}
                      className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 transition-all hover:scale-105 ${
                        hasReacted
                          ? 'bg-purple-500/35 text-purple-700 dark:text-purple-200 border border-purple-400/60 shadow-xs'
                          : 'bg-slate-100 dark:bg-[#181818] sepia:bg-[#eee3d1] text-slate-700 dark:text-slate-300 sepia:text-[#4d3c2b] border border-slate-200 dark:border-[#3c3c3c] sepia:border-[#d8ccba] hover:border-slate-400'
                      }`}
                      title={`Reacted by ${uids.length} participant(s)`}
                    >
                      <span>{emoji}</span>
                      <span className="font-bold text-[9px]">{uids.length}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setActiveReactionPickerId(activeReactionPickerId === msg.id ? null : msg.id)}
                  className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-[#181818]/60 sepia:bg-[#eee3d1] hover:bg-slate-200 dark:hover:bg-[#252525] text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47] hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-[#333333] sepia:border-[#d8ccba] transition-colors flex items-center gap-0.5"
                  title="Add reaction"
                >
                  <Smile className="w-2.5 h-2.5" />
                  <span>+</span>
                </button>
              </div>
            )}

            {/* Quick action buttons on hover (Edit + Reply + Add Reaction) */}
            <div className={`absolute top-1 ${isSelf ? '-left-[112px]' : '-right-24'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10`}>
              {isSelf && (
                <button
                  type="button"
                  onClick={() => handleStartEdit(msg)}
                  className="p-1 bg-white dark:bg-[#1e1e1e] sepia:bg-[#faf4e8] border border-slate-200 dark:border-[#3c3c3c] sepia:border-[#d9cbba] hover:border-amber-500 rounded-full text-slate-600 dark:text-slate-300 sepia:text-[#5c4a38] hover:text-amber-500 text-[10px] transition-colors shadow-md"
                  title="Edit message"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleStartReply(msg)}
                className="p-1 bg-white dark:bg-[#1e1e1e] sepia:bg-[#faf4e8] border border-slate-200 dark:border-[#3c3c3c] sepia:border-[#d9cbba] hover:border-purple-500 rounded-full text-slate-600 dark:text-slate-300 sepia:text-[#5c4a38] hover:text-purple-600 dark:hover:text-purple-300 text-[10px] transition-colors shadow-md"
                title="Reply to message"
              >
                <CornerUpLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setActiveReactionPickerId(activeReactionPickerId === msg.id ? null : msg.id)}
                className={`p-1 bg-white dark:bg-[#1e1e1e] sepia:bg-[#faf4e8] border hover:border-amber-400 rounded-full text-slate-600 dark:text-slate-300 sepia:text-[#5c4a38] hover:text-amber-500 text-[10px] transition-colors shadow-md ${
                  activeReactionPickerId === msg.id ? 'border-purple-400 text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/20' : 'border-slate-200 dark:border-[#3c3c3c] sepia:border-[#d9cbba]'
                }`}
                title="Add reaction"
              >
                <Smile className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleReaction(msg.id, '❤️')}
                className="p-1 bg-white dark:bg-[#1e1e1e] sepia:bg-[#faf4e8] border border-slate-200 dark:border-[#3c3c3c] sepia:border-[#d9cbba] hover:border-rose-500 rounded-full text-slate-600 dark:text-slate-300 sepia:text-[#5c4a38] hover:text-rose-500 text-[10px] transition-colors shadow-md"
                title="React with heart"
              >
                ❤️
              </button>
            </div>
          </div>

          {/* Read receipt status indicator below bubble for sent messages */}
          {isSelf && (
            <div className="flex items-center justify-end gap-1 text-[9px] font-mono pt-0.5 px-0.5 select-none">
              {isReadByOthers ? (
                <span className="flex items-center gap-0.5 text-sky-600 dark:text-sky-300/90 font-medium" title={`Read by ${readersExceptSelf.length} participant(s)`}>
                  <CheckCheck className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                  <span>Read</span>
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-slate-400/80" title="Delivered to workspace">
                  <Check className="w-3 h-3 text-slate-400" />
                  <span>Delivered</span>
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  const panelContainerClasses = isFloating
    ? 'fixed right-4 bottom-14 z-50 w-80 md:w-96 max-h-[80vh] bg-white/70 dark:bg-zinc-900/60 sepia:bg-[#f6ebd4]/70 border border-white/40 dark:border-white/10 sepia:border-[#e2d5c3] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 sepia:text-[#433422] font-sans backdrop-blur-2xl transition-all duration-300'
    : 'w-full h-full bg-white/70 dark:bg-zinc-900/60 sepia:bg-[#f6ebd4]/70 border-r border-slate-200/50 dark:border-zinc-800/60 sepia:border-[#e2d5c3] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 sepia:text-[#433422] font-sans backdrop-blur-2xl transition-all duration-300';

  return (
    <div className={panelContainerClasses}>
      {/* Header */}
      <div className="px-4 py-3 bg-white/60 dark:bg-zinc-900/50 sepia:bg-[#f6ebd4]/60 border-b border-slate-200/50 dark:border-zinc-800/60 sepia:border-[#e2d5c3]/60 flex items-center justify-between shrink-0 select-none backdrop-blur-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 text-blue-600 dark:text-blue-400 sepia:text-purple-700 rounded-full shrink-0 border border-blue-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 sepia:text-[#3d2e1e] flex items-center gap-1.5 truncate">
              <span>Workspace Chat</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 sepia:text-purple-800 font-mono font-semibold backdrop-blur-xs">
                #{roomId || 'Local'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 sepia:text-[#78634d] truncate">
              {activeUsers.length || 1} active user{(activeUsers.length || 1) !== 1 ? 's' : ''} in room
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSearch
                ? 'bg-purple-600/20 text-purple-600 dark:text-purple-300'
                : 'text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 sepia:hover:bg-[#ded2c0]'
            }`}
            title="Search Messages"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {isFloating && (
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47] hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 sepia:hover:bg-[#ded2c0] transition-colors"
              title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47] hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 sepia:hover:bg-[#ded2c0] transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Minimized view */}
      {isMinimized ? (
        <div className="p-3 bg-white dark:bg-[#18181b] sepia:bg-[#f6ebd4] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 sepia:text-[#4d3c2b]">
          <span>Chat Minimized ({messages.length} messages)</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-purple-600 dark:text-purple-400 hover:underline font-bold text-[11px]"
          >
            Expand
          </button>
        </div>
      ) : (
        <>
          {/* Active Users Strip & Search Input */}
          <div className="bg-white/40 dark:bg-zinc-950/40 sepia:bg-[#f0e5d3]/50 backdrop-blur-lg px-3.5 py-2 border-b border-slate-200/50 dark:border-zinc-800/50 sepia:border-[#e2d5c3] space-y-2">
            {showSearch && (
              <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-800/60 sepia:bg-[#faf4e8]/80 border border-slate-200/80 dark:border-zinc-700/60 sepia:border-[#d9cbba] rounded-full px-3 py-1 text-slate-800 dark:text-slate-100 sepia:text-[#3d2e1e] backdrop-blur-md shadow-inner">
                <Search className="w-3 h-3 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter chat history..."
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 sepia:text-[#3d2e1e] placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-sans"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47]">
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
                <Users className="w-3 h-3 text-sky-500 shrink-0" />
                <span className="font-bold text-slate-700 dark:text-slate-300 sepia:text-[#4d3c2b] shrink-0">Peers:</span>
                {activeUsers.length === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">You (Online)</span>
                ) : (
                  activeUsers.map((u) => {
                    const theme = getUserTheme(u.uid, u.name);
                    const initials = getInitials(u.name);
                    return (
                      <span
                        key={u.uid}
                        className={`px-2 py-0.5 rounded-full ${theme.avatarBg} ${theme.avatarText} border ${theme.avatarBorder} shrink-0 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs shadow-2xs`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-black/20 dark:bg-black/40 flex items-center justify-center text-[8px] font-bold">
                          {initials}
                        </span>
                        <span>{u.name || 'Peer'}</span>
                      </span>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={handleClearChat}
                className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                title="Clear Chat History"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Grouping Options Toolbar */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 dark:border-zinc-800/50 sepia:border-[#e2d5c3] text-[10px] text-slate-500 dark:text-slate-400 sepia:text-[#6e5a47] select-none">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 sepia:text-[#4d3c2b]">Group:</span>
                <div className="flex items-center bg-white/70 dark:bg-[#1f1f22]/70 sepia:bg-[#faf4e8]/70 p-0.5 rounded-full border border-slate-200/80 dark:border-zinc-700/70 sepia:border-[#d9cbba] text-[9.5px] backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => { setGroupBy('none'); setCollapsedGroups({}); }}
                    className={`px-2 py-0.5 rounded-full transition-all ${
                      groupBy === 'none' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGroupBy('date'); setCollapsedGroups({}); }}
                    className={`px-2 py-0.5 rounded-full transition-all flex items-center gap-1 ${
                      groupBy === 'date' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="w-2.5 h-2.5" />
                    Date
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGroupBy('author'); setCollapsedGroups({}); }}
                    className={`px-2 py-0.5 rounded-full transition-all flex items-center gap-1 ${
                      groupBy === 'author' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <User className="w-2.5 h-2.5" />
                    Author
                  </button>
                </div>
              </div>

              {groupBy !== 'none' && (
                <button
                  type="button"
                  onClick={() => {
                    const keys = groupBy === 'date' ? dateGroups.map((g) => g.key) : authorGroups.map((g) => g.key);
                    handleToggleAllGroups(keys);
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-mono text-[9.5px] transition-colors"
                >
                  {(groupBy === 'date' ? dateGroups : authorGroups).every((g) => collapsedGroups[g.key]) ? 'Expand All' : 'Collapse All'}
                </button>
              )}
            </div>
          </div>

          {/* Messages List Container */}
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-white/20 dark:bg-zinc-950/20 sepia:bg-[#f6ebd4]/20 backdrop-blur-xs">
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-3.5 space-y-3.5 font-sans text-xs custom-scrollbar min-h-[220px]"
            >
              {filteredMessages.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 sepia:text-[#806c58] italic py-8 text-xs">
                  {searchQuery ? 'No messages match search query.' : 'No messages yet. Start the conversation!'}
                </div>
              ) : groupBy === 'date' ? (
                <div className="space-y-3">
                  {dateGroups.map((group) => {
                    const isCollapsed = !!collapsedGroups[group.key];
                    return (
                      <div key={group.key} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(group.key)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-100/90 dark:bg-[#222225] sepia:bg-[#ede1ce] hover:bg-slate-200/80 dark:hover:bg-[#2a2a2e] sepia:hover:bg-[#dfd3c0] border border-slate-200 dark:border-zinc-800 sepia:border-[#d9cbba] rounded-lg transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 sepia:text-[#3d2e1e]">
                            <Calendar className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                            <span>{group.label}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 sepia:text-purple-800 rounded-full font-mono font-normal">
                              {group.messages.length} msg{group.messages.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 flex items-center gap-1 text-[11px] font-mono">
                            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        {!isCollapsed && (
                          <div className="space-y-3 pl-1.5 border-l border-purple-500/20 ml-1.5">
                            <AnimatePresence initial={false}>
                              {group.messages.map((msg) => renderSingleMessage(msg))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : groupBy === 'author' ? (
                <div className="space-y-3">
                  {authorGroups.map((group) => {
                    const isCollapsed = !!collapsedGroups[group.key];
                    const theme = getUserTheme(group.authorUid, group.authorName);
                    const initials = getInitials(group.authorName);

                    return (
                      <div key={group.key} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(group.key)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-100/90 dark:bg-[#222225] sepia:bg-[#ede1ce] hover:bg-slate-200/80 dark:hover:bg-[#2a2a2e] sepia:hover:bg-[#dfd3c0] border border-slate-200 dark:border-zinc-800 sepia:border-[#d9cbba] rounded-lg transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 sepia:text-[#3d2e1e] min-w-0">
                            <div className={`w-5 h-5 rounded-full ${theme.avatarBg} ${theme.avatarText} border ${theme.avatarBorder} flex items-center justify-center text-[9px] font-bold shrink-0`}>
                              {initials}
                            </div>
                            <span className="truncate">{group.authorName}</span>
                            {group.authorRole && (
                              <span className="text-[9px] px-1 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded uppercase font-mono border border-slate-300 dark:border-[#3a3a3a] shrink-0">
                                {group.authorRole}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 sepia:text-sky-800 rounded-full font-mono font-normal shrink-0">
                              {group.messages.length} msg{group.messages.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 flex items-center gap-1 text-[11px] font-mono shrink-0">
                            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        {!isCollapsed && (
                          <div className="space-y-3 pl-1.5 border-l border-sky-500/20 ml-1.5">
                            <AnimatePresence initial={false}>
                              {group.messages.map((msg) => renderSingleMessage(msg))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredMessages.map((msg) => renderSingleMessage(msg))}
                </AnimatePresence>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Floating Scroll-to-Bottom Button */}
            <AnimatePresence>
              {showScrollBottomBtn && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-3 right-4 z-20 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-xs font-semibold shadow-xl flex items-center gap-1.5 border border-purple-400/50 transition-all cursor-pointer backdrop-blur-md"
                  title="Scroll to latest messages"
                >
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                  <span>Scroll to latest</span>
                  {hasUnreadBelow && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Code Snippet Drawer Toggle */}
          {showCodeInput && (
            <div className="p-2.5 bg-slate-100/90 dark:bg-[#181818] sepia:bg-[#ede1ce] border-t border-slate-200 dark:border-[#2d2d2d] sepia:border-[#e2d5c3] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                  <Code className="w-3.5 h-3.5" /> Attach Code Snippet
                </span>
                <select
                  value={codeSnippetLang}
                  onChange={(e) => setCodeSnippetLang(e.target.value)}
                  className="bg-white dark:bg-[#252526] sepia:bg-[#faf4e8] text-slate-800 dark:text-slate-300 sepia:text-[#3d2e1e] border border-slate-200 dark:border-[#3c3c3c] sepia:border-[#d9cbba] rounded text-[10px] px-1.5 py-0.5"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <textarea
                value={codeSnippetText}
                onChange={(e) => setCodeSnippetText(e.target.value)}
                placeholder="Paste code snippet here..."
                className="w-full h-20 bg-white dark:bg-[#121212] sepia:bg-[#faf4e8] border border-slate-200 dark:border-[#3c3c3c] sepia:border-[#d9cbba] rounded-lg p-2 font-mono text-xs text-slate-800 dark:text-slate-200 sepia:text-[#3d2e1e] focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Real-time Typing Status Indicator above Chat Input */}
          <AnimatePresence>
            {typingNames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 4 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="px-3.5 py-1.5 bg-white/70 dark:bg-zinc-900/70 sepia:bg-[#f6ebd4]/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-zinc-800/50 flex items-center justify-between text-xs font-sans select-none overflow-hidden shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1 bg-blue-500/15 dark:bg-blue-500/25 px-2 py-0.5 rounded-full border border-blue-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 sepia:text-[#3d2e1e] truncate">
                    <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                      {typingNames.length === 1
                        ? typingNames[0]
                        : typingNames.length === 2
                        ? `${typingNames[0]} and ${typingNames[1]}`
                        : `${typingNames[0]}, ${typingNames[1]} and ${typingNames.length - 2} other${typingNames.length - 2 > 1 ? 's' : ''}`}
                    </strong>{' '}
                    {typingNames.length === 1 ? 'is typing...' : 'are typing...'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Replying Banner */}
          {replyingToMessage && (
            <div className="px-3.5 py-2 bg-blue-50/90 dark:bg-blue-950/60 border-t border-b border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs backdrop-blur-xl select-none transition-all">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div className="w-1 h-7 bg-blue-500 rounded-full shrink-0" />
                <div className="truncate text-[11px] leading-tight">
                  <div className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <CornerUpLeft className="w-3 h-3 shrink-0" />
                    <span>Replying to {replyingToMessage.senderUid === currentUid ? 'yourself' : replyingToMessage.senderName}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 truncate opacity-90 italic">
                    "{replyingToMessage.text || (replyingToMessage.codeSnippet ? `[Code: ${replyingToMessage.codeSnippet.language}]` : '')}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
                title="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Emojis Bar */}
          <div className="px-3 py-1.5 bg-white/50 dark:bg-zinc-900/50 sepia:bg-[#eee3d1]/60 backdrop-blur-xl border-t border-slate-200/50 dark:border-zinc-800/50 sepia:border-[#e2d5c3] flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="p-1 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 sepia:hover:bg-[#e0d4c0] rounded-full text-xs transition-colors shrink-0"
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 ${
                showCodeInput
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 sepia:text-[#6e5a47] hover:text-slate-900 dark:hover:text-white bg-slate-200/60 dark:bg-zinc-800/60 sepia:bg-[#e2d5c3]'
              }`}
              title="Toggle Code Snippet Input"
            >
              <Code className="w-3 h-3" />
              <span>Snippet</span>
            </button>
          </div>

          {/* Mention Suggestions Popover Dropdown */}
          <AnimatePresence>
            {mentionMenu && mentionSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="mx-2.5 mb-1 bg-white/90 dark:bg-[#1a1a1a]/90 sepia:bg-[#faf4e8]/90 border border-cyan-500/50 shadow-2xl rounded-2xl p-1 z-50 text-slate-800 dark:text-white sepia:text-[#3d2e1e] max-h-48 overflow-y-auto custom-scrollbar backdrop-blur-xl select-none"
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-300 border-b border-slate-200/50 dark:border-[#2d2d2d] sepia:border-[#e2d5c3] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-cyan-500" /> Tag Peer / Notify Group
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">↑↓ navigate, Enter/Tab insert</span>
                </div>
                <div className="space-y-0.5">
                  {mentionSuggestions.map((item, idx) => (
                    <button
                      key={item.uid + idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(item.tag);
                      }}
                      onMouseEnter={() => setMentionSelectedIndex(idx)}
                      className={`w-full text-left px-2 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        idx === mentionSelectedIndex
                          ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 font-bold border border-cyan-500/40'
                          : 'hover:bg-slate-100 dark:hover:bg-[#252526] sepia:hover:bg-[#f0e5d3] text-slate-800 dark:text-slate-200 sepia:text-[#3d2e1e]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-[10px]">
                          @
                        </span>
                        <span className="font-medium text-xs">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 px-1.5 py-0.5 rounded-full">
                        @{item.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Field */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white/70 dark:bg-zinc-900/70 sepia:bg-[#ebe1cf]/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-zinc-800/50 sepia:border-[#e2d5c3] flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (mentionMenu && mentionSuggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionSelectedIndex((prev) => (prev + 1) % mentionSuggestions.length);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionSelectedIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
                    return;
                  }
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const selected = mentionSuggestions[mentionSelectedIndex];
                    if (selected) {
                      insertMention(selected.tag);
                    }
                    return;
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setMentionMenu(null);
                    return;
                  }
                }
              }}
              placeholder="Type a message, or @mention peer..."
              className="flex-1 bg-slate-100/90 dark:bg-zinc-800/70 sepia:bg-[#faf4e8]/90 border border-slate-200/70 dark:border-zinc-700/60 sepia:border-[#d9cbba] rounded-full px-4 py-2 text-xs text-slate-800 dark:text-white sepia:text-[#3d2e1e] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 font-sans shadow-inner backdrop-blur-md transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() && !codeSnippetText.trim()}
              className="p-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-30 text-white rounded-full shadow-md active:scale-90 transition-all shrink-0 cursor-pointer flex items-center justify-center w-8 h-8"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/**
 * Floating Chat Trigger Button to place at the bottom-right of the Workspace canvas
 */
export function FloatingChatTrigger({
  isOpen,
  onToggle,
  unreadCount = 0,
  activeUsersCount = 1
}: {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  activeUsersCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`fixed right-6 bottom-10 z-40 p-3 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer transform hover:scale-105 active:scale-95 border ${
        isOpen
          ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-500/50'
          : 'bg-[#1e1e1e] text-purple-400 border-[#3c3c3c] hover:border-purple-500 hover:text-purple-300'
      }`}
      title={isOpen ? 'Close Workspace Chat' : 'Open Floating Workspace Chat'}
    >
      <div className="relative">
        <MessageSquare className="w-5 h-5" />
        
        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-3 -right-3 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full border-2 border-[#1e1e1e] animate-bounce shadow-lg flex items-center justify-center min-w-[20px] h-[20px] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Online pulse dot */}
        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#1e1e1e]" />
      </div>
    </button>
  );
}

export default ChatPanel;


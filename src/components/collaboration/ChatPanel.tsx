import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Search, X, Reply, Code2, Pencil, Trash2, Users, WifiOff, ThumbsUp, Lightbulb, PartyPopper } from 'lucide-react';
import { collection, setDoc, doc, updateDoc, deleteDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { chatOutbox } from '../../sync/chatOutbox';
import { UserPresence, WorkspaceRole } from '../../types';

export interface ChatMessage {
  id: string;
  clientKey?: string;
  senderUid: string;
  senderName: string;
  senderRole?: WorkspaceRole;
  text: string;
  isEdited?: boolean;
  editedAt?: number;
  timestamp: number;
  replyTo?: { id: string; senderName: string; text: string };
  codeSnippet?: { language: string; code: string };
  reactions?: Record<string, string[]>;
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
  theme?: string;
  isFloating?: boolean;
  onInsertCodeToEditor?: (code: string) => void;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

const REACTIONS = [
  { key: 'like', label: 'Like', Icon: ThumbsUp },
  { key: 'idea', label: 'Idea', Icon: Lightbulb },
  { key: 'celebrate', label: 'Celebrate', Icon: PartyPopper }
];

function initials(name: string) {
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] || ''}`.toUpperCase() : clean.slice(0, 2).toUpperCase();
}

function safeName(name: string) {
  const clean = name.trim();
  return clean || 'Unnamed participant';
}

export function ChatPanel({
  isOpen, onClose, roomId, activeUsers = [], currentUid, userName, currentRole,
  isFloating = false, onInsertCodeToEditor, onAddToast, onUnreadCountChange
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [snippetMode, setSnippetMode] = useState(false);
  const [snippet, setSnippet] = useState('');
  const [snippetLanguage, setSnippetLanguage] = useState('javascript');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [chatError, setChatError] = useState<string | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const didInitialScroll = useRef(false);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const [serverRoomTransport, setServerRoomTransport] = useState(false);
  const cloudChatEnabled = Boolean(db && auth?.currentUser?.uid === currentUid && !serverRoomTransport);
  const localStorageKey = roomId ? `livepad_chat_${roomId}` : '';

  const readLocalMessages = () => {
    if (!localStorageKey) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      return Array.isArray(parsed) ? parsed.slice(-200) as ChatMessage[] : [];
    } catch { return []; }
  };

  const persistLocalMessage = (message: ChatMessage) => {
    if (!localStorageKey) return;
    try {
      const next = [...readLocalMessages().filter((item) => item.id !== message.id), message].slice(-200);
      localStorage.setItem(localStorageKey, JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    if (!roomId || !currentUid) {
      setMessages([]);
      setChatError(null);
      setServerRoomTransport(false);
      return;
    }

    let cancelled = false;
    setServerRoomTransport(false);

    // Detect the shared public-room transport before selecting Firestore. This
    // keeps every browser on the same message path.
    const detectServerTransport = async () => {
      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (payload?.room?.privacy !== 'private' && !cancelled) {
          setServerRoomTransport(true);
        }
      } catch {
        // Authenticated private rooms continue with Firestore.
      }
    };
    void detectServerTransport();

    const mergeMessages = (incoming: ChatMessage[]) => {
      setMessages((current) => {
        const map = new Map<string, ChatMessage>(current.map((item) => [item.id, item]));
        incoming.forEach((item) => map.set(item.id, item));
        return [...map.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-200);
      });
    };

    if (!cloudChatEnabled) {
      // Public-room server transport keeps chat realtime across different browsers
      // when Firebase Auth is unavailable. BroadcastChannel remains the fast same-tab path.
      mergeMessages(readLocalMessages());
      const loadServerMessages = async () => {
        try {
          const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`, { cache: 'no-store' });
          if (!response.ok) return;
          const payload = await response.json();
          if (Array.isArray(payload?.messages)) {
            mergeMessages(payload.messages as ChatMessage[]);
            payload.messages.forEach((message: ChatMessage) => persistLocalMessage(message));
            setChatError(null);
            setOnline(true);
          } else {
            throw new Error('Invalid chat response');
          }
        } catch {
          if (!cancelled) setChatError('Live chat connection is unavailable. Retrying…');
        }
      };
      void loadServerMessages();
      const pollTimer = setInterval(() => { void loadServerMessages(); }, 600);
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(`livepad-chat:${roomId}`);
        localChannelRef.current = channel;
        channel.onmessage = (event) => {
          if (event.data?.type === 'chat-delete' && event.data.id) {
            const id = String(event.data.id);
            try { localStorage.setItem(localStorageKey, JSON.stringify(readLocalMessages().filter((item: ChatMessage) => item.id !== id))); } catch {}
            setMessages((current) => current.filter((item) => item.id !== id));
            return;
          }
          if (event.data?.type === 'chat-message' && event.data.message) {
            const message = event.data.message as ChatMessage;
            persistLocalMessage(message);
            mergeMessages([message]);
          }
        };
        return () => { channel.close(); localChannelRef.current = null; clearInterval(pollTimer); };
      }
      return () => { clearInterval(pollTimer); };
    }

    const ref = collection(db, 'rooms', roomId, 'messages');
    const q = query(ref, orderBy('timestamp', 'asc'), limit(200));
    return onSnapshot(q, (snapshot) => {
      mergeMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ChatMessage)));
      setChatError(null);
      setOnline(true);
    }, (error) => {
      console.warn('[LivePad Chat] realtime listener failed', error);
      setChatError(error instanceof Error ? error.message : 'Chat connection failed.');
      setOnline(false);
    });
  }, [roomId, currentUid, connectionAttempt, cloudChatEnabled, serverRoomTransport]);

  // Flush messages that were intentionally queued while offline or while Firestore was unavailable.
  useEffect(() => {
    if (!roomId || !cloudChatEnabled || !online) return;
    let cancelled = false;
    const flush = async () => {
      const pending = chatOutbox.list(roomId);
      for (const item of pending) {
        if (cancelled) return;
        try {
          await setDoc(doc(db, 'rooms', roomId, 'messages', item.clientKey), item.data);
          chatOutbox.remove(item.clientKey);
        } catch (error) {
          console.warn('[LivePad Chat] queued message flush failed', error);
          break;
        }
      }
    };
    void flush();
    return () => { cancelled = true; };
  }, [roomId, currentUid, online, cloudChatEnabled]);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;
    if (!didInitialScroll.current || nearBottom) {
      endRef.current?.scrollIntoView({ behavior: didInitialScroll.current ? 'smooth' : 'auto' });
      didInitialScroll.current = true;
    } else if (messages.length) {
      onUnreadCountChange?.(1);
    }
  }, [messages.length, isOpen, onUnreadCountChange]);

  const visibleMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => `${m.senderName} ${m.text} ${m.codeSnippet?.code || ''}`.toLowerCase().includes(q));
  }, [messages, search]);

  const send = async () => {
    const cleanText = text.trim();
    const cleanSnippet = snippet.trim();
    if (!roomId || !currentUid || (!cleanText && !cleanSnippet)) return;
    const senderName = userName.trim();
    if (!senderName) {
      onAddToast?.('error', 'Add your real profile name before sending a message.');
      return;
    }
    const clientKey = `${currentUid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload: Record<string, unknown> = {
      clientKey,
      senderUid: currentUid,
      senderName,
      senderRole: currentRole,
      text: cleanText,
      timestamp: Date.now(),
      ...(replyTo ? { replyTo: { id: replyTo.id, senderName: replyTo.senderName, text: replyTo.text } } : {}),
      ...(cleanSnippet ? { codeSnippet: { language: snippetLanguage, code: cleanSnippet } } : {})
    };
    const optimistic = { id: clientKey, ...payload } as ChatMessage;
    setMessages((prev) => prev.some((item) => item.id === clientKey) ? prev : [...prev, optimistic]);
    try {
      if (!cloudChatEnabled) {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(optimistic),
        });
        if (!response.ok) {
          throw new Error(`server-chat-unavailable:${response.status}`);
        }
        const payload = await response.json().catch(() => ({}));
        const savedMessage = (payload?.message || optimistic) as ChatMessage;
        persistLocalMessage(savedMessage);
        setMessages((prev) => prev.map((item) => item.id === clientKey ? savedMessage : item));
        localChannelRef.current?.postMessage({ type: 'chat-message', message: savedMessage });
        setChatError(null);
        setOnline(true);
      } else if (!online) {
        throw new Error('offline');
      } else {
        await setDoc(doc(db, 'rooms', roomId, 'messages', clientKey), payload);
        chatOutbox.remove(clientKey);
        setChatError(null);
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'offline') {
        setMessages((prev) => prev.filter((item) => item.id !== clientKey));
        setChatError(error.message || 'Message could not be sent.');
        onAddToast?.('error', 'Message could not be sent. Check room access.');
      } else {
        chatOutbox.enqueue({ roomId, clientKey, data: payload, queuedAt: Date.now() });
        onAddToast?.('info', 'Message saved locally and will sync when you reconnect.');
      }
    }
    setText(''); setSnippet(''); setSnippetMode(false); setReplyTo(null);
    inputRef.current?.focus();
  };

  const saveEdit = async (message: ChatMessage) => {
    const clean = editingText.trim();
    if (!roomId || !clean || message.senderUid !== currentUid) return;
    if (!cloudChatEnabled) {
      const updated = { ...message, text: clean, isEdited: true, editedAt: Date.now() };
      try { await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(message.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }); } catch {}
      persistLocalMessage(updated); setMessages((prev) => prev.map((item) => item.id === message.id ? updated : item));
      localChannelRef.current?.postMessage({ type: 'chat-message', message: updated });
      setEditingId(null); setEditingText(''); return;
    }
    try {
      await updateDoc(doc(db, 'rooms', roomId, 'messages', message.id), { text: clean, isEdited: true, editedAt: Date.now() });
      setEditingId(null); setEditingText('');
    } catch { onAddToast?.('error', 'Message could not be edited.'); }
  };

  const toggleReaction = async (message: ChatMessage, emoji: string) => {
    if (!roomId || !currentUid) return;
    if (!cloudChatEnabled) {
      const current = message.reactions || {};
      const users = current[emoji] || [];
      const nextUsers = users.includes(currentUid) ? users.filter((uid) => uid !== currentUid) : [...users, currentUid];
      const updated = { ...message, reactions: { ...current, [emoji]: nextUsers } };
      try { await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(message.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reactions: { ...current, [emoji]: nextUsers } }) }); } catch {}
      persistLocalMessage(updated); setMessages((prev) => prev.map((item) => item.id === message.id ? updated : item));
      localChannelRef.current?.postMessage({ type: 'chat-message', message: updated }); return;
    }
    const current = message.reactions || {};
    const users = current[emoji] || [];
    const nextUsers = users.includes(currentUid) ? users.filter((uid) => uid !== currentUid) : [...users, currentUid];
    try { await updateDoc(doc(db, 'rooms', roomId, 'messages', message.id), { reactions: { ...current, [emoji]: nextUsers } }); }
    catch { onAddToast?.('error', 'Reaction could not be updated.'); }
  };

  const removeMessage = async (message: ChatMessage) => {
    if (!roomId || (message.senderUid !== currentUid && !['owner', 'admin'].includes(String(currentRole)))) return;
    if (!cloudChatEnabled) {
      try { localStorage.setItem(localStorageKey, JSON.stringify(readLocalMessages().filter((item) => item.id !== message.id))); } catch {}
      try { await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(message.id)}`, { method: 'DELETE' }); } catch {}
      setMessages((prev) => prev.filter((item) => item.id !== message.id));
      localChannelRef.current?.postMessage({ type: 'chat-delete', id: message.id }); return;
    }
    try { await deleteDoc(doc(db, 'rooms', roomId, 'messages', message.id)); }
    catch { onAddToast?.('error', 'Message could not be deleted.'); }
  };

  if (!isOpen) return null;

  return (
    <section className={`livepad-chat-panel ${isFloating ? 'is-floating' : ''}`} aria-label="Workspace chat">
      <header className="livepad-chat-header">
        <div className="livepad-chat-title">
          <div className="livepad-chat-icon"><MessageSquare size={16} /></div>
          <div className="min-w-0">
            <h2>Workspace chat</h2>
            <p>{activeUsers.length || 1} participant{(activeUsers.length || 1) !== 1 ? 's' : ''} · {online ? 'Live' : 'Offline'}</p>
          </div>
        </div>
        <div className="livepad-chat-header-actions">
          <button type="button" onClick={() => setSearch((v) => v ? '' : ' ')} aria-label="Search chat"><Search size={15} /></button>
          <button type="button" onClick={onClose} aria-label="Close chat"><X size={15} /></button>
        </div>
      </header>

      {!online && <div className="livepad-chat-offline"><WifiOff size={13} /> Messages will sync after reconnecting.</div>}
      {chatError && <div className="livepad-chat-error"><span>{chatError}</span><button type="button" onClick={() => { setChatError(null); setOnline(true); setConnectionAttempt((value) => value + 1); }}>Retry</button></div>}
      {search !== '' && (
        <div className="livepad-chat-search"><Search size={13} /><input autoFocus value={search.trimStart()} onChange={(e) => setSearch(e.target.value)} placeholder="Search this chat" /><button onClick={() => setSearch('')}><X size={13} /></button></div>
      )}

      <div className="livepad-chat-people">
        <Users size={13} />
        {activeUsers.slice(0, 5).map((u) => <span key={u.uid} title={u.name}>{initials(u.name)}</span>)}
        {activeUsers.length > 5 && <em>+{activeUsers.length - 5}</em>}
      </div>

      <div ref={scrollRef} className="livepad-chat-messages">
        {visibleMessages.length === 0 ? (
          <div className="livepad-chat-empty">
            <div><MessageSquare size={22} /></div>
            <strong>{search ? 'No messages found' : 'Start the conversation'}</strong>
            <span>Ask a question, share a solution, or discuss the code.</span>
          </div>
        ) : visibleMessages.map((message) => {
          const self = message.senderUid === currentUid;
          return (
            <article id={`chat-${message.id}`} key={message.id} className={`livepad-chat-message ${self ? 'is-self' : ''}`}>
              <div className="livepad-chat-avatar" title={message.senderName}>{initials(message.senderName)}</div>
              <div className="livepad-chat-message-main">
                <div className="livepad-chat-meta"><strong>{self ? 'You' : safeName(message.senderName)}</strong>{message.senderRole && <span>{message.senderRole}</span>}<time>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
                <div className="livepad-chat-bubble">
                  {message.replyTo && <button className="livepad-chat-reply-preview" onClick={() => document.getElementById(`chat-${message.replyTo!.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><Reply size={12} /> {message.replyTo.senderName}: {message.replyTo.text}</button>}
                  {editingId === message.id ? (
                    <div className="livepad-chat-edit"><textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus /><div><button onClick={() => { setEditingId(null); setEditingText(''); }}>Cancel</button><button onClick={() => void saveEdit(message)}>Save</button></div></div>
                  ) : <p>{message.text}</p>}
                  {message.codeSnippet && <div className="livepad-chat-snippet"><div><Code2 size={12} /> {message.codeSnippet.language}</div><pre>{message.codeSnippet.code}</pre>{onInsertCodeToEditor && <button onClick={() => onInsertCodeToEditor(message.codeSnippet!.code)}>Insert into editor</button>}</div>}
                </div>
                <div className="livepad-chat-tools">
                  {REACTIONS.map(({ key, label, Icon }) => { const count = message.reactions?.[key]?.length || 0; return <button key={key} title={label} aria-label={label} onClick={() => void toggleReaction(message, key)} className={message.reactions?.[key]?.includes(currentUid) ? 'active' : ''}><Icon size={12} />{count ? ` ${count}` : ''}</button>; })}
                  <button onClick={() => setReplyTo(message)}><Reply size={12} /> Reply</button>
                  {self && <button onClick={() => { setEditingId(message.id); setEditingText(message.text); }}><Pencil size={12} /></button>}
                  {(self || ['owner', 'admin'].includes(String(currentRole))) && <button onClick={() => void removeMessage(message)}><Trash2 size={12} /></button>}
                </div>
              </div>
            </article>
          );
        })}
        <div ref={endRef} />
      </div>

      {replyTo && <div className="livepad-chat-composer-context"><Reply size={13} /><span>Replying to <strong>{replyTo.senderName}</strong>: {replyTo.text}</span><button onClick={() => setReplyTo(null)}><X size={13} /></button></div>}
      {snippetMode && <div className="livepad-chat-snippet-composer"><select value={snippetLanguage} onChange={(e) => setSnippetLanguage(e.target.value)}><option>html</option><option>css</option><option>javascript</option></select><textarea value={snippet} onChange={(e) => setSnippet(e.target.value)} placeholder="Paste a small code example…" /></div>}
      <footer className="livepad-chat-composer">
        <button className={snippetMode ? 'active' : ''} onClick={() => setSnippetMode((v) => !v)} title="Attach code"><Code2 size={15} /></button>
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Message your group…" />
        <button className="send" onClick={() => void send()} disabled={!text.trim() && !snippet.trim()} aria-label="Send message"><Send size={15} /></button>
      </footer>
    </section>
  );
}

export function FloatingChatTrigger({ isOpen, onToggle, unreadCount = 0 }: { isOpen: boolean; onToggle: () => void; unreadCount?: number; activeUsersCount?: number }) {
  return <button type="button" className="livepad-floating-chat-trigger" onClick={onToggle} aria-label={isOpen ? 'Close workspace chat' : 'Open workspace chat'}><MessageSquare size={18} />{unreadCount > 0 && !isOpen && <b>{unreadCount > 99 ? '99+' : unreadCount}</b>}</button>;
}

export default ChatPanel;

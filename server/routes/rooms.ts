import { Router } from 'express';

export interface ServerRoomRecord {
  workspaceId: string;
  roomCode: string;
  workspaceName?: string;
  title?: string;
  workspaceType?: string;
  privacy?: string;
  participantLimit?: number;
  creatorId?: string;
  creatorRole?: string;
  defaultRole?: string;
  ownerName?: string;
  status?: string;
  codeModeOpen?: boolean;
  codeModeOpenedBy?: string;
  codeModeOpenedAt?: number;
  participants?: Record<string, unknown>;
  users?: Record<string, unknown>;
  content?: string;
  label?: string;
  createdAt?: number;
  updatedAt?: number;
}

const rooms = new Map<string, ServerRoomRecord>();
const chat = new Map<string, Map<string, Record<string, unknown>>>();

function cleanCode(value: unknown): string {
  return String(value || '').trim().toUpperCase();
}

function sanitizeRoom(input: Partial<ServerRoomRecord>): ServerRoomRecord | null {
  const roomCode = cleanCode(input.roomCode || input.workspaceId);
  if (!roomCode || roomCode.length > 64) return null;
  return {
    ...input,
    roomCode,
    workspaceId: cleanCode(input.workspaceId || roomCode),
    privacy: input.privacy === 'private' ? 'private' : 'public',
    status: input.status || 'active',
    participantLimit: Math.max(1, Math.min(Number(input.participantLimit || 50), 500)),
    content: typeof input.content === 'string' ? input.content.slice(0, 2_000_000) : '',
    participants: input.participants && typeof input.participants === 'object' ? input.participants : {},
    users: input.users && typeof input.users === 'object' ? input.users : {},
    updatedAt: Date.now(),
  };
}

export const roomsRouter = Router();

// Server-backed development/offline transport. This does not weaken Firestore rules;
// it only keeps a room registry available when Firebase Auth is unavailable.
roomsRouter.post('/rooms/register', (req, res) => {
  const room = sanitizeRoom(req.body || {});
  if (!room) return res.status(400).json({ error: 'Invalid room descriptor.' });
  if (room.privacy === 'private') {
    // Private rooms are never discoverable through this fallback registry.
    return res.status(403).json({ error: 'Private workspaces require Firebase authentication.' });
  }
  rooms.set(room.roomCode, room);
  return res.status(201).json({ room });
});

roomsRouter.get('/rooms/:roomCode', (req, res) => {
  const code = cleanCode(req.params.roomCode);
  const room = rooms.get(code);
  if (!room || room.status === 'deleted') return res.status(404).json({ error: 'Workspace not found.' });
  return res.json({ room });
});

roomsRouter.patch('/rooms/:roomCode', (req, res) => {
  const code = cleanCode(req.params.roomCode);
  const existing = rooms.get(code);
  if (!existing) return res.status(404).json({ error: 'Workspace not found.' });
  const patch = req.body || {};
  const nextInput: Partial<ServerRoomRecord> = { ...existing, ...patch, roomCode: code, workspaceId: existing.workspaceId };
  for (const key of ['participants', 'users'] as const) {
    if (patch[key] && typeof patch[key] === 'object') {
      nextInput[key] = { ...(existing[key] || {}), ...patch[key] } as Record<string, unknown>;
    }
  }
  const next = sanitizeRoom(nextInput);
  if (!next) return res.status(400).json({ error: 'Invalid workspace update.' });
  rooms.set(code, next);
  return res.json({ room: next });
});


// Public-room chat fallback for development/offline transport. Firestore remains the
// authoritative cloud transport when Firebase Auth is available.
roomsRouter.get('/rooms/:roomCode/messages', (req, res) => {
  const code = cleanCode(req.params.roomCode);
  const room = rooms.get(code);
  if (!room || room.status === 'deleted') return res.status(404).json({ error: 'Workspace not found.' });
  if (room.privacy === 'private') return res.status(403).json({ error: 'Private workspaces require Firebase authentication.' });
  const items = Array.from(chat.get(code)?.values() || [])
    .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0))
    .slice(-200);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  return res.json({ messages: items, serverTime: Date.now() });
});

roomsRouter.post('/rooms/:roomCode/messages', (req, res) => {
  const code = cleanCode(req.params.roomCode);
  const room = rooms.get(code);
  if (!room || room.status === 'deleted') return res.status(404).json({ error: 'Workspace not found.' });
  if (room.privacy === 'private') return res.status(403).json({ error: 'Private workspaces require Firebase authentication.' });
  const message = req.body || {};
  const timestamp = Number(message.timestamp || Date.now());
  if (!Number.isFinite(timestamp)) return res.status(400).json({ error: 'Invalid message timestamp.' });
  const id = String(message.id || message.clientKey || '').trim();
  if (!id || id.length > 160 || !String(message.senderUid || '').trim()) {
    return res.status(400).json({ error: 'Invalid chat message.' });
  }
  let bucket = chat.get(code);
  if (!bucket) { bucket = new Map(); chat.set(code, bucket); }
  const stored = { ...message, id, timestamp };
  bucket.set(id, stored);
  return res.status(201).json({ message: stored });
});

roomsRouter.patch('/rooms/:roomCode/messages/:messageId', (req, res) => {
  const code = cleanCode(req.params.roomCode);
  const room = rooms.get(code);
  if (!room || room.status === 'deleted') return res.status(404).json({ error: 'Workspace not found.' });
  if (room.privacy === 'private') return res.status(403).json({ error: 'Private workspaces require Firebase authentication.' });
  const bucket = chat.get(code);
  const existing = bucket?.get(req.params.messageId);
  if (!existing) return res.status(404).json({ error: 'Message not found.' });
  const patch = req.body || {};
  const messageId = String(existing.id || req.params.messageId);
  const senderUid = String(existing.senderUid || '');
  const next = { ...existing, ...patch, id: messageId, senderUid };
  bucket!.set(messageId, next);
  return res.json({ message: next });
});

roomsRouter.delete('/rooms/:roomCode/messages/:messageId', (req, res) => {
  const code = cleanCode(req.params.roomCode);
  const room = rooms.get(code);
  if (!room || room.status === 'deleted') return res.status(404).json({ error: 'Workspace not found.' });
  if (room.privacy === 'private') return res.status(403).json({ error: 'Private workspaces require Firebase authentication.' });
  const bucket = chat.get(code);
  if (!bucket?.has(req.params.messageId)) return res.status(404).json({ error: 'Message not found.' });
  bucket.delete(req.params.messageId);
  return res.status(204).end();
});

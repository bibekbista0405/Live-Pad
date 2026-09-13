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
  const next = sanitizeRoom({ ...existing, ...patch, roomCode: code, workspaceId: existing.workspaceId });
  if (!next) return res.status(400).json({ error: 'Invalid workspace update.' });
  rooms.set(code, next);
  return res.json({ room: next });
});

export interface PendingSyncPayload {
  roomId: string;
  content: string;
  txId: string;
  clientId: string;
  updatedAt: number;
}

const KEY = 'livepad_sync_outbox_v1';

function readQueue(): PendingSyncPayload[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingSyncPayload[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(queue.slice(-100)));
  } catch {
    // Storage quota is already handled by the local document persistence layer.
  }
}

/** Durable, last-write-wins outbox. One pending content update is kept per room. */
export const offlineOutbox = {
  enqueue(payload: PendingSyncPayload) {
    const queue = readQueue().filter((item) => item.roomId !== payload.roomId);
    queue.push(payload);
    writeQueue(queue);
  },
  remove(roomId: string, txId?: string) {
    const queue = readQueue().filter((item) => item.roomId !== roomId || (txId ? item.txId !== txId : false));
    writeQueue(queue);
  },
  list(): PendingSyncPayload[] {
    return readQueue();
  },
  count(): number {
    return readQueue().length;
  },
};

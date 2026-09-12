export interface PendingChatMessage {
  roomId: string;
  clientKey: string;
  data: Record<string, unknown>;
  queuedAt: number;
}

const KEY = 'livepad_chat_outbox_v1';

function readQueue(): PendingChatMessage[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingChatMessage[]) {
  try { localStorage.setItem(KEY, JSON.stringify(queue.slice(-200))); } catch { /* local storage may be full */ }
}

export const chatOutbox = {
  enqueue(item: PendingChatMessage) {
    const queue = readQueue().filter((entry) => entry.clientKey !== item.clientKey);
    queue.push(item);
    writeQueue(queue);
  },
  remove(clientKey: string) {
    writeQueue(readQueue().filter((entry) => entry.clientKey !== clientKey));
  },
  list(roomId?: string) {
    return roomId ? readQueue().filter((entry) => entry.roomId === roomId) : readQueue();
  },
  count(roomId?: string) {
    return this.list(roomId).length;
  }
};

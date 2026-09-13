import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const chat = fs.readFileSync(path.join(root, 'src/components/collaboration/ChatPanel.tsx'), 'utf8');
const rooms = fs.readFileSync(path.join(root, 'server/routes/rooms.ts'), 'utf8');
const editor = fs.readFileSync(path.join(root, 'src/components/RichTextEditor.tsx'), 'utf8');
const codeWorkspace = fs.readFileSync(path.join(root, 'src/components/CodeWorkspace.tsx'), 'utf8');

function count(haystack: string, needle: string) { return haystack.split(needle).length - 1; }

describe('Code Studio collaboration transport', () => {
  it('uses the public server room transport consistently for chat', () => {
    expect(chat).toContain('/api/rooms/${encodeURIComponent(roomId)}');
    expect(chat).toContain('/messages');
    expect(chat).toContain('serverRoomTransport');
    expect(chat).toContain("cache: 'no-store'");
    expect(rooms).toContain("roomsRouter.get('/rooms/:roomCode/messages'");
    expect(rooms).toContain("roomsRouter.post('/rooms/:roomCode/messages'");
  });

  it('does not silently fall back after a failed public-room send', () => {
    expect(chat).toContain('Live chat server is unavailable. Message is kept locally.');
  });

  it('keeps rich text updates from rebuilding the editor while focused', () => {
    expect(editor).toContain('if (editor.isFocused)');
    expect(editor).toContain('editor.commands.setContent');
  });

  it('passes real active users into Code Studio collaboration surfaces', () => {
    expect(count(codeWorkspace, 'activeUsers={activeUsers}')).toBeGreaterThan(0);
    expect(codeWorkspace).toContain('roomId={roomCode}');
  });
});

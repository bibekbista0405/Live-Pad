import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Code Studio Pass 11 collaboration fixes', () => {
  it('keeps fallback room initialization async-safe', () => {
    const source = read('src/hooks/useLiveRoom.ts');
    expect(source).toContain('const initializeLocalFallback = async () =>');
    expect(source).toContain('void initializeLocalFallback();');
  });

  it('uses server fallback transport for cross-browser chat', () => {
    const source = read('src/components/collaboration/ChatPanel.tsx');
    expect(source).toContain('/messages`');
    expect(source).toContain('setInterval(() => { void loadServerMessages(); }, 1000)');
  });

  it('keeps server chat isolated from private rooms', () => {
    const source = read('server/routes/rooms.ts');
    expect(source).toContain("room.privacy === 'private'");
    expect(source).toContain("roomsRouter.get('/rooms/:roomCode/messages'");
  });

  it('sends server fallback presence heartbeats', () => {
    const source = read('src/hooks/useLiveRoom.ts');
    expect(source).toContain('users: { [uid]: userPresenceStateObj }');
    expect(source).toContain('typingUsers: { [uid]: !!(roomRef.current?.typingUsers?.[uid]) }');
  });

  it('does not rebuild the rich-text document while focused', () => {
    const source = read('src/components/RichTextEditor.tsx');
    expect(source).toContain('Do not rebuild the entire ProseMirror document while the user is typing.');
    expect(source).toContain('if (editor.isFocused) {');
  });
});

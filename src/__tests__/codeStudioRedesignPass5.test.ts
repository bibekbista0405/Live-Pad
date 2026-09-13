import { describe, expect, it } from 'vitest';
import { buildVirtualProject } from '../utils/virtualProjectBuilder';

describe('Code Studio Pass 5 preview safety', () => {
  it('escapes embedded HTML so script tags cannot break the preview runtime', () => {
    const files: any[] = [
      { id: 'html', projectId: 'p', name: 'index.html', extension: 'html', language: 'html', path: 'index.html', content: '<!doctype html><html><body><script src="app.js"></script></body></html>' },
      { id: 'js', projectId: 'p', name: 'app.js', extension: 'js', language: 'javascript', path: 'app.js', content: 'console.log("ready");' },
      { id: 'css', projectId: 'p', name: 'style.css', extension: 'css', language: 'css', path: 'style.css', content: 'body { margin: 0; }' }
    ];
    const result = buildVirtualProject(files, files[0]);
    expect(result.html).toContain('data-linked-file="app.js"');
    expect(result.html).toContain('console.log("ready");');
    expect(result.html).not.toContain('"type":"html"},{"id":"js"');
  });

  it('does not inject React bootstrap into vanilla HTML/CSS/JS projects', () => {
    const files: any[] = [
      { id: 'html', projectId: 'p', name: 'index.html', extension: 'html', language: 'html', path: 'index.html', content: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Hello</h1><script src="app.js"></script></body></html>' },
      { id: 'js', projectId: 'p', name: 'app.js', extension: 'js', language: 'javascript', path: 'app.js', content: 'document.body.dataset.ready = "true";' },
      { id: 'css', projectId: 'p', name: 'style.css', extension: 'css', language: 'css', path: 'style.css', content: 'body { color: black; }' }
    ];
    const result = buildVirtualProject(files, files[0]);
    expect(result.html).not.toContain('react.development.js');
    expect(result.html).not.toContain('__modules__');
  });
});


describe('Code Studio Pass 5 collaboration and editor responsiveness', () => {
  it('keeps the teaching room switch authoritative across room snapshots', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/hooks/useLiveRoom.ts', 'utf8'));
    expect(source).toContain('codeModeOpen: roomData.codeModeOpen');
    expect(source).toContain("codeModeOpenedBy: roomData.codeModeOpenedBy");
  });

  it('does not write every editor keystroke directly to Firestore', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/components/CodeWorkspace.tsx', 'utf8'));
    expect(source).toContain('projectSaveDebounceRef');
    expect(source).toContain('isAutoSaveEnabled ? 450 : 900');
  });
});


describe('Code Studio collaboration hardening', () => {
  it('avoids duplicate Tiptap Link and Underline extensions', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/components/RichTextEditor.tsx', 'utf8'));
    expect(source).toContain('link: false');
    expect(source).toContain('underline: false');
    expect(source).toContain('Link.configure');
    expect(source).toContain('Underline,');
  });

  it('does not repeatedly attempt disabled anonymous Firebase auth', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/lib/firebase.ts', 'utf8'));
    expect(source).toContain('anonymousAuthUnavailable');
    expect(source).toContain('Anonymous provider');
  });

  it('keeps Monaco uncontrolled during normal typing', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/components/code/MonacoEditorWrapper.tsx', 'utf8'));
    expect(source).toContain('defaultValue={value}');
    expect(source).toContain('pushEditOperations');
    expect(source).toContain('formatOnType: false');
  });
});


describe('Code Studio Pass 7 collaboration and stability', () => {
  it('persists local room metadata for same-browser room fallback', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/App.tsx', 'utf8'));
    expect(source).toContain('livepad_local_room_meta_');
    expect(source).toContain('cloudAuthenticated');
  });

  it('keeps the live room hook return type explicit to avoid compiler inference recursion', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/hooks/useLiveRoom.ts', 'utf8'));
    expect(source).toContain('interface UseLiveRoomResult');
    expect(source).toContain('): UseLiveRoomResult');
  });

  it('removes large animated background blur layers from the scroll surface', async () => {
    const source = await import('node:fs/promises').then((m) => m.readFile('src/components/BackgroundParticles.tsx', 'utf8'));
    expect(source).not.toContain('blur-[120px]');
    expect(source).not.toContain('blur-[140px]');
  });
});

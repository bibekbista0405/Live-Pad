import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Code Studio Pass 8 — collaboration and smooth UI', () => {
  it('provides a secure server guest-token bridge when Anonymous Auth is disabled', () => {
    const firebase = read('src/lib/firebase.ts');
    const route = read('server/routes/auth.ts');
    expect(firebase).toContain("/api/auth/guest-token");
    expect(firebase).toContain('signInWithCustomToken');
    expect(route).toContain("post('/auth/guest-token'");
    expect(route).toContain('createCustomToken');
    expect(route).toContain('randomUUID');
  });

  it('keeps room-code joining strict while allowing authenticated public-room self join', () => {
    const app = read('src/App.tsx');
    const rules = read('firestore.rules');
    expect(app).toContain('await ensureAuth()');
    expect(app).toContain('Workspace "${cleanCode}" does not exist');
    expect(rules).toContain('function isPublicSelfJoin()');
    expect(rules).toContain("resource.data.privacy == 'public'");
    expect(rules).toContain('allow update: if isPublicSelfJoin();');
  });

  it('uses a flat Code Studio header instead of a stacked floating title box', () => {
    const workspace = read('src/components/CodeWorkspace.tsx');
    const css = read('src/components/code/code-workspace.css');
    expect(workspace).toContain('grid-cols-[1fr_auto_1fr]');
    expect(workspace).toContain('livepad-code-project-title');
    expect(css).toContain('box-shadow: none !important;');
    expect(css).toContain('background: transparent !important;');
  });

  it('removes JavaScript-driven landing motion from the scroll surface', () => {
    const app = read('src/App.tsx');
    const landingStart = app.indexOf('/* ================= LANDING PAGE REDESIGN ================= */');
    const landingEnd = app.indexOf('/* ================= WORKSPACE REDESIGN', landingStart);
    const landing = app.slice(landingStart, landingEnd);
    expect(landing).not.toContain('<motion.button');
    expect(landing).not.toContain('<motion.div');
    expect(landing).not.toContain('whileHover=');
    expect(landing).not.toContain('whileTap=');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertWorkspacePath,
  assertWorkspaceRoot,
  authorizeWorkspaceRoot,
  forgetWorkspace,
} from '../../electron/ipc/workspaceAccess';

const windows = new Set<number>();
const fakeWebContents = (id: number) => ({ id }) as any;

function tempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'livepad-workspace-'));
}

afterEach(() => {
  for (const id of windows) forgetWorkspace(id);
  windows.clear();
});

describe('Electron workspace path authorization', () => {
  it('allows paths inside a selected workspace', () => {
    const root = tempWorkspace();
    const id = Math.floor(Math.random() * 1000000);
    windows.add(id);
    authorizeWorkspaceRoot(fakeWebContents(id), root);
    fs.writeFileSync(path.join(root, 'hello.txt'), 'hello');

    expect(assertWorkspaceRoot(id, root)).toBe(fs.realpathSync(root));
    expect(assertWorkspacePath(id, path.join(root, 'hello.txt'))).toBe(fs.realpathSync(path.join(root, 'hello.txt')));
  });

  it('rejects traversal outside the selected workspace', () => {
    const root = tempWorkspace();
    const outside = tempWorkspace();
    const id = Math.floor(Math.random() * 1000000);
    windows.add(id);
    authorizeWorkspaceRoot(fakeWebContents(id), root);

    expect(() => assertWorkspacePath(id, path.join(root, '..', path.basename(outside)))).toThrow(/outside the authorized workspace/);
  });

  it('allows creation of a missing child path but not a missing path outside the root', () => {
    const root = tempWorkspace();
    const id = Math.floor(Math.random() * 1000000);
    windows.add(id);
    authorizeWorkspaceRoot(fakeWebContents(id), root);

    const child = path.join(root, 'new', 'file.txt');
    expect(assertWorkspacePath(id, child, { allowMissing: true })).toBe(path.resolve(child));
    expect(() => assertWorkspacePath(id, path.join(root, '..', 'outside.txt'), { allowMissing: true })).toThrow(/outside the authorized workspace/);
  });

  it('rejects a symlink that escapes the authorized workspace', () => {
    const root = tempWorkspace();
    const outside = tempWorkspace();
    const id = Math.floor(Math.random() * 1000000);
    windows.add(id);
    authorizeWorkspaceRoot(fakeWebContents(id), root);

    const link = path.join(root, 'escape');
    try {
      fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
    } catch {
      return;
    }

    expect(() => assertWorkspacePath(id, path.join(link, 'file.txt'), { allowMissing: true })).toThrow(/outside the authorized workspace/);
  });
});

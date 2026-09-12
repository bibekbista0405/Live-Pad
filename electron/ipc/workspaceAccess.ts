import fs from 'fs';
import path from 'path';
import type { WebContents } from 'electron';

const authorizedRoots = new Map<number, Set<string>>();

function canonicalExistingPath(targetPath: string): string {
  return fs.realpathSync.native(path.resolve(targetPath));
}

function stripWindowsExtendedPrefix(value: string): string {
  if (value.startsWith('\\\\?\\UNC\\')) return `\\\\${value.slice(8)}`;
  if (value.startsWith('\\\\?\\')) return value.slice(4);
  return value;
}

function normalizeForComparison(targetPath: string): string {
  if (process.platform !== 'win32') return path.posix.normalize(path.posix.resolve(targetPath));

  const normalized = stripWindowsExtendedPrefix(path.win32.normalize(path.win32.resolve(targetPath)));
  return normalized.toLowerCase();
}

function isWithinRoot(targetPath: string, rootPath: string): boolean {
  const target = normalizeForComparison(targetPath);
  const root = normalizeForComparison(rootPath);
  const relative = process.platform === 'win32'
    ? path.win32.relative(root, target)
    : path.posix.relative(root, target);

  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

export function authorizeWorkspaceRoot(webContents: WebContents, selectedPath: string): string {
  const root = canonicalExistingPath(selectedPath);
  if (!fs.statSync(root).isDirectory()) throw new Error('Workspace root must be a directory');

  let roots = authorizedRoots.get(webContents.id);
  if (!roots) {
    roots = new Set<string>();
    authorizedRoots.set(webContents.id, roots);
  }
  roots.add(root);
  return root;
}

export function forgetWorkspace(webContentsId: number): void {
  authorizedRoots.delete(webContentsId);
}

export function getAuthorizedRoots(webContentsId: number): string[] {
  return [...(authorizedRoots.get(webContentsId) || [])];
}

export function assertWorkspacePath(webContentsId: number, targetPath: string, options: { allowMissing?: boolean } = {}): string {
  if (typeof targetPath !== 'string' || !targetPath.trim()) throw new Error('Path is required');

  const resolved = path.resolve(targetPath);
  const roots = authorizedRoots.get(webContentsId);
  if (!roots || roots.size === 0) throw new Error('No authorized workspace. Open a project folder first.');

  const matchingRoot = [...roots].find((root) => isWithinRoot(resolved, root));
  if (!matchingRoot) throw new Error('Path is outside the authorized workspace');

  if (fs.existsSync(resolved)) {
    const canonical = canonicalExistingPath(resolved);
    if (!isWithinRoot(canonical, matchingRoot)) throw new Error('Resolved path is outside the authorized workspace');
    return canonical;
  }

  if (!options.allowMissing) throw new Error(`Path does not exist: ${targetPath}`);

  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('Unable to validate path');
    ancestor = parent;
  }

  const canonicalAncestor = canonicalExistingPath(ancestor);
  if (!isWithinRoot(canonicalAncestor, matchingRoot)) throw new Error('Path resolves outside the authorized workspace');

  return resolved;
}

export function assertWorkspaceRoot(webContentsId: number, targetPath: string): string {
  const resolved = assertWorkspacePath(webContentsId, targetPath);
  if (!fs.statSync(resolved).isDirectory()) throw new Error('Workspace path must be a directory');
  return resolved;
}

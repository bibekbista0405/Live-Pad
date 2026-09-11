import { ipcMain } from 'electron';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { assertWorkspaceRoot, assertWorkspacePath } from './workspaceAccess.js';

const MAX_OUTPUT_BYTES = 10 * 1024 * 1024;
const GIT_TIMEOUT_MS = 120_000;

function validateRepoPath(cwd: string): string {
  if (typeof cwd !== 'string' || !cwd.trim()) throw new Error('Repository path is required');
  const resolved = path.resolve(cwd);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Repository path does not exist: ${cwd}`);
  }
  return resolved;
}

function runGitCmd(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const safeCwd = validateRepoPath(cwd);
    execFile('git', args, {
      cwd: safeCwd,
      maxBuffer: MAX_OUTPUT_BYTES,
      timeout: GIT_TIMEOUT_MS,
      windowsHide: true,
    }, (err, stdout, stderr) => {
      if (err) {
        const detail = String(stderr || err.message || 'Git command failed').trim();
        reject(new Error(detail.slice(0, 4000)));
      } else {
        resolve(String(stdout).trim());
      }
    });
  });
}

function validateBranchName(branchName: string): string {
  if (typeof branchName !== 'string' || !branchName.trim() || branchName.length > 255) {
    throw new Error('Invalid branch name');
  }
  return branchName;
}

function validateCommitMessage(message: string): string {
  if (typeof message !== 'string' || !message.trim() || message.length > 20_000) {
    throw new Error('Commit message must be between 1 and 20,000 characters');
  }
  return message;
}

function validateGitRelativePath(filePath: string): string {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('File path is required');
  if (path.isAbsolute(filePath)) throw new Error('Git file path must be relative to the repository');
  const normalized = path.normalize(filePath);
  if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) throw new Error('Git file path escapes the repository');
  return normalized;
}

export function setupGitIPC() {
  ipcMain.handle('git:status', async (event, repoPath: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      const branch = await runGitCmd(['rev-parse', '--abbrev-ref', 'HEAD'], repoPath);
      const statusRaw = await runGitCmd(['status', '--porcelain'], repoPath);
      const files = statusRaw.split('\n').filter(Boolean).map((line) => ({
        status: line.slice(0, 2).trim(),
        file: line.slice(3).trim(),
      }));
      return { isGitRepo: true, branch, files };
    } catch {
      return { isGitRepo: false, branch: '', files: [] };
    }
  });

  ipcMain.handle('git:init', async (event, repoPath: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      return { success: true, output: await runGitCmd(['init'], repoPath) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:clone', async (event, url: string, targetPath: string) => {
    try {
      if (typeof url !== 'string' || !url.trim() || url.length > 4096) throw new Error('Invalid clone URL');
      if (typeof targetPath !== 'string' || !targetPath.trim()) throw new Error('Target path is required');
      const resolvedTarget = assertWorkspacePath(event.sender.id, targetPath, { allowMissing: true });
      const parentDir = assertWorkspacePath(event.sender.id, path.dirname(resolvedTarget), { allowMissing: true });
      fs.mkdirSync(parentDir, { recursive: true });
      return { success: true, output: await runGitCmd(['clone', url, resolvedTarget], parentDir) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:stage', async (event, repoPath: string, filePath?: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      if (filePath) filePath = validateGitRelativePath(filePath);
      const args = filePath ? ['add', '--', filePath] : ['add', '.'];
      return { success: true, output: await runGitCmd(args, repoPath) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:unstage', async (event, repoPath: string, filePath?: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      if (filePath) filePath = validateGitRelativePath(filePath);
      const args = filePath ? ['restore', '--staged', '--', filePath] : ['restore', '--staged', '.'];
      return { success: true, output: await runGitCmd(args, repoPath) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:branches', async (event, repoPath: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      const raw = await runGitCmd(['branch', '-a'], repoPath);
      return raw.split('\n').filter(Boolean).map((b) => b.replace(/^\*\s*/, '').trim());
    } catch {
      return [];
    }
  });

  ipcMain.handle('git:checkout', async (event, repoPath: string, branchName: string, isNew: boolean = false) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      const branch = validateBranchName(branchName);
      const args = isNew ? ['checkout', '-b', branch] : ['checkout', branch];
      return { success: true, output: await runGitCmd(args, repoPath) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:sync', async (event, repoPath: string, action: 'fetch' | 'pull' | 'push') => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      if (!['fetch', 'pull', 'push'].includes(action)) throw new Error('Invalid Git sync action');
      return { success: true, output: await runGitCmd([action], repoPath) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:diff', async (event, repoPath: string, filePath?: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      if (filePath) filePath = validateGitRelativePath(filePath);
      const args = filePath ? ['diff', '--', filePath] : ['diff'];
      return await runGitCmd(args, repoPath);
    } catch (e: any) {
      return e.message || 'No diff available';
    }
  });

  ipcMain.handle('git:commit', async (event, repoPath: string, message: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      const safeMessage = validateCommitMessage(message);
      await runGitCmd(['add', '.'], repoPath);
      return { success: true, output: await runGitCmd(['commit', '-m', safeMessage], repoPath) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:log', async (event, repoPath: string, count: number = 20) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      const safeCount = Number.isInteger(count) ? Math.max(1, Math.min(count, 100)) : 20;
      const raw = await runGitCmd(['log', '-n', String(safeCount), '--pretty=format:%h|%an|%ar|%s'], repoPath);
      return raw.split('\n').filter(Boolean).map((line) => {
        const [hash, author, date, ...messageParts] = line.split('|');
        return { hash, author, date, message: messageParts.join('|') };
      });
    } catch {
      return [];
    }
  });

  ipcMain.handle('git:blame', async (event, repoPath: string, filePath: string) => {
    try {
      repoPath = assertWorkspaceRoot(event.sender.id, repoPath);
      filePath = validateGitRelativePath(filePath);
      if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('File path is required');
      return await runGitCmd(['blame', '-s', '--', filePath], repoPath);
    } catch {
      return '';
    }
  });
}

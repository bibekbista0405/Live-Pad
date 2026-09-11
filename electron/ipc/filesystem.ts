import { ipcMain, shell, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { assertWorkspacePath, assertWorkspaceRoot } from './workspaceAccess.js';

interface DirectoryTreeItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  updatedAt?: number;
  children?: DirectoryTreeItem[];
  extension?: string;
}

const activeWatchers = new Map<string, { watcher: fs.FSWatcher; webContentsId: number }>();

export function setupFileSystemIPC() {
  ipcMain.handle('fs:readDir', async (event, dirPath: string, recursive: boolean = true): Promise<DirectoryTreeItem[]> => {
    const safePath = assertWorkspaceRoot(event.sender.id, dirPath);

    const readItems = (currentPath: string, depth: number = 0): DirectoryTreeItem[] => {
      if (depth > 8) return [];
      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        const items: DirectoryTreeItem[] = [];
        for (const entry of entries) {
          if (['node_modules', '.git', '.DS_Store', 'dist', '.cache'].includes(entry.name)) continue;
          const fullPath = path.join(currentPath, entry.name);
          let stats: fs.Stats | null = null;
          try { stats = fs.statSync(fullPath); } catch { continue; }
          const isDir = stats.isDirectory();
          const item: DirectoryTreeItem = {
            name: entry.name,
            path: fullPath,
            isDirectory: isDir,
            size: stats.size,
            updatedAt: stats.mtimeMs,
            extension: isDir ? '' : path.extname(entry.name).slice(1),
          };
          if (isDir && recursive) item.children = readItems(fullPath, depth + 1);
          items.push(item);
        }
        return items.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      } catch (e) {
        console.error('Error reading dir:', currentPath, e);
        return [];
      }
    };

    return readItems(safePath);
  });

  ipcMain.handle('fs:readFile', async (event, filePath: string) => {
    const safePath = assertWorkspacePath(event.sender.id, filePath);
    const stats = fs.statSync(safePath);
    if (!stats.isFile()) throw new Error('Path is not a file');
    if (stats.size > 10 * 1024 * 1024) throw new Error('File is too large to read through IPC');
    return { path: safePath, content: fs.readFileSync(safePath, 'utf8') };
  });

  ipcMain.handle('fs:writeFile', async (event, filePath: string, content: string) => {
    if (typeof content !== 'string' || content.length > 10 * 1024 * 1024) throw new Error('File content is too large');
    const safePath = assertWorkspacePath(event.sender.id, filePath, { allowMissing: true });
    const parentDir = assertWorkspacePath(event.sender.id, path.dirname(safePath), { allowMissing: true });
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(safePath, content, 'utf8');
    return safePath;
  });

  ipcMain.handle('fs:createItem', async (event, targetPath: string, isDirectory: boolean) => {
    const safePath = assertWorkspacePath(event.sender.id, targetPath, { allowMissing: true });
    if (fs.existsSync(safePath)) throw new Error(`Item already exists at path: ${targetPath}`);
    const parentDir = assertWorkspacePath(event.sender.id, path.dirname(safePath), { allowMissing: true });
    fs.mkdirSync(parentDir, { recursive: true });
    if (isDirectory) fs.mkdirSync(safePath, { recursive: true });
    else fs.writeFileSync(safePath, '', 'utf8');
    return safePath;
  });

  ipcMain.handle('fs:rename', async (event, oldPath: string, newPath: string) => {
    const safeOld = assertWorkspacePath(event.sender.id, oldPath);
    const safeNew = assertWorkspacePath(event.sender.id, newPath, { allowMissing: true });
    if (fs.existsSync(safeNew)) throw new Error(`Destination already exists: ${newPath}`);
    assertWorkspaceRoot(event.sender.id, path.dirname(safeNew));
    fs.renameSync(safeOld, safeNew);
    return safeNew;
  });

  ipcMain.handle('fs:delete', async (event, targetPath: string, useRecycleBin: boolean = true) => {
    const safePath = assertWorkspacePath(event.sender.id, targetPath);
    if (useRecycleBin) {
      try { await shell.trashItem(safePath); return true; } catch { /* fallback */ }
    }
    const stats = fs.statSync(safePath);
    if (stats.isDirectory()) fs.rmSync(safePath, { recursive: true, force: true });
    else fs.unlinkSync(safePath);
    return true;
  });

  ipcMain.handle('fs:duplicate', async (event, targetPath: string) => {
    const safePath = assertWorkspacePath(event.sender.id, targetPath);
    const ext = path.extname(safePath);
    const base = path.basename(safePath, ext);
    const dir = path.dirname(safePath);
    let copyPath = path.join(dir, `${base}-copy${ext}`);
    let counter = 2;
    while (fs.existsSync(copyPath)) copyPath = path.join(dir, `${base}-copy-${counter++}${ext}`);
    assertWorkspacePath(event.sender.id, copyPath, { allowMissing: true });
    const stats = fs.statSync(safePath);
    if (stats.isDirectory()) fs.cpSync(safePath, copyPath, { recursive: true });
    else fs.copyFileSync(safePath, copyPath);
    return copyPath;
  });

  ipcMain.handle('fs:reveal', async (event, targetPath: string) => {
    const safePath = assertWorkspacePath(event.sender.id, targetPath);
    shell.showItemInFolder(safePath);
    return true;
  });

  ipcMain.handle('fs:watch', async (event, dirPath: string) => {
    const safePath = assertWorkspaceRoot(event.sender.id, dirPath);
    const existing = activeWatchers.get(safePath);
    if (existing && existing.webContentsId === event.sender.id) return true;
    if (existing) existing.watcher.close();

    try {
      const watcher = fs.watch(safePath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
          const relative = String(filename);
          const fullPath = path.resolve(safePath, relative);
          try { assertWorkspacePath(event.sender.id, fullPath, { allowMissing: true }); } catch { return; }
          win.webContents.send('fs:changed', { eventType, filename: relative, dirPath: safePath, fullPath });
        }
      });
      activeWatchers.set(safePath, { watcher, webContentsId: event.sender.id });
      return true;
    } catch (err) {
      console.error('Failed to start folder watcher:', err);
      return false;
    }
  });

  ipcMain.handle('fs:unwatch', async (event, dirPath: string) => {
    const safePath = assertWorkspaceRoot(event.sender.id, dirPath);
    const existing = activeWatchers.get(safePath);
    if (!existing || existing.webContentsId !== event.sender.id) return false;
    existing.watcher.close();
    activeWatchers.delete(safePath);
    return true;
  });
}

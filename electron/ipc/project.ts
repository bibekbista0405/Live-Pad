import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { assertWorkspaceRoot, authorizeWorkspaceRoot } from './workspaceAccess.js';

export interface RecentProjectItem {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
  isPinned?: boolean;
}

export function setupProjectIPC(userDataPath: string) {
  const storeFile = path.join(userDataPath, 'livepad-recent-projects.json');

  const loadRecent = (): RecentProjectItem[] => {
    try {
      if (fs.existsSync(storeFile)) {
        return JSON.parse(fs.readFileSync(storeFile, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to read recent projects file:', e);
    }
    return [];
  };

  const saveRecent = (list: RecentProjectItem[]) => {
    try {
      fs.writeFileSync(storeFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save recent projects file:', e);
    }
  };

  // 1. Get Recent Projects List
  ipcMain.handle('project:getRecent', async (): Promise<RecentProjectItem[]> => {
    return loadRecent().filter(p => fs.existsSync(p.path));
  });

  // 2. Add / Update Recent Project
  ipcMain.handle('project:addRecent', async (event, projectPath: string, name?: string): Promise<RecentProjectItem[]> => {
    if (typeof projectPath !== 'string' || !projectPath.trim() || !fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    let list = loadRecent();
    const knownRecent = list.some((item) => path.resolve(item.path) === path.resolve(projectPath));
    if (knownRecent) {
      projectPath = authorizeWorkspaceRoot(event.sender, projectPath);
    } else {
      projectPath = assertWorkspaceRoot(event.sender.id, projectPath);
    }

    const folderName = name || path.basename(projectPath);

    const existingIndex = list.findIndex(p => p.path === projectPath);
    if (existingIndex >= 0) {
      list[existingIndex].lastOpened = Date.now();
      if (name) list[existingIndex].name = name;
    } else {
      list.unshift({
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: folderName,
        path: projectPath,
        lastOpened: Date.now(),
        isPinned: false,
      });
    }

    // Keep top 20 recent
    list = list.slice(0, 20);
    saveRecent(list);
    return list;
  });

  // 3. Pin / Unpin Project
  ipcMain.handle('project:togglePin', async (_event, projectPath: string): Promise<RecentProjectItem[]> => {
    const list = loadRecent();
    const item = list.find(p => p.path === projectPath);
    if (item) {
      item.isPinned = !item.isPinned;
      saveRecent(list);
    }
    return list;
  });

  // 4. Remove Recent Project Record
  ipcMain.handle('project:removeRecent', async (_event, projectPath: string): Promise<RecentProjectItem[]> => {
    let list = loadRecent();
    list = list.filter(p => p.path !== projectPath);
    saveRecent(list);
    return list;
  });

  // 5. Desktop File & Content Search Engine across Project
  ipcMain.handle('project:search', async (event, projectPath: string, query: string, isRegex: boolean = false) => {
    projectPath = assertWorkspaceRoot(event.sender.id, projectPath);
    if (!fs.existsSync(projectPath) || !query || query.trim().length === 0) {
      return [];
    }

    const results: { path: string; relativePath: string; matches: { line: number; text: string }[] }[] = [];
    let searchPattern: RegExp;

    try {
      searchPattern = isRegex ? new RegExp(query, 'gi') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    } catch {
      return [];
    }

    const searchDirectory = (currentDir: string) => {
      if (results.length >= 100) return; // Limit total results to 100

      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          if (['node_modules', '.git', 'dist', '.cache', 'build'].includes(entry.name)) {
            continue;
          }

          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.relative(projectPath, fullPath);

          if (entry.isDirectory()) {
            searchDirectory(fullPath);
          } else if (entry.isFile()) {
            // Check file name match
            const matches: { line: number; text: string }[] = [];

            // Only inspect text files (< 2MB)
            try {
              const stats = fs.statSync(fullPath);
              if (stats.size < 2 * 1024 * 1024) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n');

                lines.forEach((lineText, idx) => {
                  if (searchPattern.test(lineText) && matches.length < 10) {
                    matches.push({
                      line: idx + 1,
                      text: lineText.trim().slice(0, 150),
                    });
                    searchPattern.lastIndex = 0; // Reset regex state
                  }
                });

                if (matches.length > 0 || searchPattern.test(entry.name)) {
                  results.push({
                    path: fullPath,
                    relativePath,
                    matches,
                  });
                }
              }
            } catch {
              // Ignore unreadable binary files
            }
          }
        }
      } catch {
        // Ignore unreadable directories
      }
    };

    searchDirectory(projectPath);
    return results;
  });
}

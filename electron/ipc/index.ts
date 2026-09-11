import { ipcMain, Notification, shell, app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { setupFileSystemIPC } from './filesystem.js';
import { setupProjectIPC } from './project.js';
import { setupTerminalIPC } from './terminal.js';
import { setupGitIPC } from './git.js';
import { setupClipboardIPC } from './clipboard.js';
import { setupDialogIPC } from './dialog.js';
import { setupWindowIPC } from './window.js';
import { setupUpdatesIPC } from './updates.js';
import { setupDebuggerIPC } from './debugger.js';
import { installIPCSecurityBoundary } from './security.js';
import { forgetWorkspace } from './workspaceAccess.js';

export function setupIPCHandlers(userDataPath: string) {
  installIPCSecurityBoundary();
  const storageFilePath = path.join(userDataPath, 'desktop-native-storage.json');

  const getNativeStore = (): Record<string, any> => {
    try {
      if (fs.existsSync(storageFilePath)) {
        return JSON.parse(fs.readFileSync(storageFilePath, 'utf8'));
      }
    } catch (err) {
      console.error('Error reading native storage:', err);
    }
    return {};
  };

  const saveNativeStore = (data: Record<string, any>) => {
    try {
      fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error writing native storage:', err);
    }
  };

  // 1. App / Platform Info
  ipcMain.handle('app:getPlatformInfo', async () => {
    return {
      name: 'LivePad Desktop',
      version: app.getVersion() || '1.0.0',
      os: process.platform,
      architecture: process.arch,
      isElectron: true,
    };
  });

  // 2. Desktop Notifications
  ipcMain.handle('notification:show', async (_event, { title, body, icon }: { title: string; body: string; icon?: string }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'LivePad',
        body: body || '',
        icon: icon || undefined,
      });
      notification.show();
      return true;
    }
    return false;
  });

  // 3. External Shell Links
  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // 4. Key-Value Storage
  ipcMain.handle('storage:get', async (_event, key: string) => {
    const store = getNativeStore();
    return store[key] !== undefined ? store[key] : null;
  });

  ipcMain.handle('storage:set', async (_event, { key, value }: { key: string; value: any }) => {
    const store = getNativeStore();
    store[key] = value;
    saveNativeStore(store);
    return true;
  });

  // Setup Specialized Submodules
  setupFileSystemIPC();
  setupProjectIPC(userDataPath);
  setupTerminalIPC();
  setupGitIPC();
  setupClipboardIPC();
  setupDialogIPC();
  setupWindowIPC();
  setupUpdatesIPC();
  setupDebuggerIPC();

  app.on('browser-window-created', (_event, win) => {
    win.webContents.once('destroyed', () => forgetWorkspace(win.webContents.id));
  });
}

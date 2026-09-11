import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupWindowIPC() {
  ipcMain.handle('window:control', async (event, action: 'minimize' | 'maximize' | 'unmaximize' | 'close' | 'isMaximized') => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    switch (action) {
      case 'minimize':
        win.minimize();
        return true;
      case 'maximize':
        if (!win.isMaximized()) win.maximize();
        return true;
      case 'unmaximize':
        if (win.isMaximized()) win.unmaximize();
        return true;
      case 'close':
        win.close();
        return true;
      case 'isMaximized':
        return win.isMaximized();
      default:
        return false;
    }
  });

  // Create Secondary Window for Multi-Project / Document Workspace
  ipcMain.handle('window:create', async (_event, projectPath?: string) => {
    const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;
    const baseUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

    const subWin = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      title: 'LivePad Desktop — Secondary Workspace',
      backgroundColor: '#0f172a',
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    if (isDev) {
      const targetUrl = projectPath ? `${baseUrl}?project=${encodeURIComponent(projectPath)}` : baseUrl;
      await subWin.loadURL(targetUrl);
    } else {
      const indexPath = path.join(__dirname, '../../dist/index.html');
      await subWin.loadFile(indexPath, {
        search: projectPath ? `project=${encodeURIComponent(projectPath)}` : '',
      });
    }

    return true;
  });
}

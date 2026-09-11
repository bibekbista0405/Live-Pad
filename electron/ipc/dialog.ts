import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import { authorizeWorkspaceRoot } from './workspaceAccess.js';

export function setupDialogIPC() {
  ipcMain.handle('dialog:openFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return authorizeWorkspaceRoot(event.sender, result.filePaths[0]);
  });

  ipcMain.handle('dialog:saveFile', async (event, payload: { content: string; defaultName?: string; filters?: { name: string; extensions: string[] }[] }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: payload.defaultName || 'LivePad-Document.md',
      filters: payload.filters || [
        { name: 'Markdown Document', extensions: ['md', 'markdown'] },
        { name: 'Text File', extensions: ['txt'] },
        { name: 'HTML Document', extensions: ['html'] },
        { name: 'JSON Data', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    try {
      fs.writeFileSync(result.filePath, payload.content, 'utf8');
      return result.filePath;
    } catch (e: any) {
      console.error('Failed to write file via IPC:', e);
      throw new Error(e.message || 'Failed to save file to disk');
    }
  });

  ipcMain.handle('dialog:readFile', async (event, filePath?: string) => {
    let targetPath = filePath;

    if (!targetPath) {
      const win = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(win!, {
        properties: ['openFile'],
        filters: [
          { name: 'Supported Documents', extensions: ['md', 'txt', 'html', 'json', 'ts', 'js', 'py', 'css', 'tsx', 'jsx'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      targetPath = result.filePaths[0];
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      return { path: targetPath, content };
    } catch (e: any) {
      console.error('Failed to read file via IPC:', e);
      throw new Error(e.message || 'Failed to read file from disk');
    }
  });

  ipcMain.handle('dialog:showMessage', async (event, payload: { type?: 'info' | 'error' | 'warning' | 'question'; title: string; message: string; buttons?: string[] }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showMessageBox(win!, {
      type: payload.type || 'info',
      title: payload.title || 'LivePad Desktop',
      message: payload.message || '',
      buttons: payload.buttons || ['OK'],
    });
    return result.response;
  });
}

import { ipcMain, clipboard, nativeImage } from 'electron';

export function setupClipboardIPC() {
  ipcMain.handle('clipboard:writeText', async (_event, text: string) => {
    clipboard.writeText(text || '');
    return true;
  });

  ipcMain.handle('clipboard:readText', async () => {
    return clipboard.readText();
  });

  ipcMain.handle('clipboard:writeHTML', async (_event, html: string) => {
    clipboard.writeHTML(html || '');
    return true;
  });

  ipcMain.handle('clipboard:readHTML', async () => {
    return clipboard.readHTML();
  });

  ipcMain.handle('clipboard:writeImage', async (_event, dataUrl: string) => {
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      clipboard.writeImage(img);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('clipboard:readImage', async () => {
    const img = clipboard.readImage();
    return img.isEmpty() ? null : img.toDataURL();
  });
}

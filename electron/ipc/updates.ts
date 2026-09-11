import { ipcMain, app } from 'electron';

export function setupUpdatesIPC() {
  ipcMain.handle('updates:check', async () => {
    // Returns status structure ready for electron-updater
    return {
      updateAvailable: false,
      currentVersion: app.getVersion() || '1.0.0',
      latestVersion: app.getVersion() || '1.0.0',
      releaseNotes: 'You are using the latest version of LivePad Desktop Edition.',
    };
  });

  ipcMain.handle('updates:download', async () => {
    return { status: 'completed' };
  });

  ipcMain.handle('updates:install', async () => {
    app.relaunch();
    app.exit(0);
    return true;
  });
}

import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { WindowManager } from './window.js';
import { createApplicationMenu } from './menu.js';
import { setupIPCHandlers } from './ipc/index.js';

// ES Module resolution helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let windowManager: WindowManager | null = null;

async function createWindow() {
  const userDataPath = app.getPath('userData');
  windowManager = new WindowManager(userDataPath);
  const windowState = windowManager.getState();

  // Create native desktop browser window with security settings
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 900,
    minHeight: 600,
    title: 'LivePad Desktop — Modern Workspace & Document Editor',
    show: false, // Don't show until ready-to-show for smooth rendering
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // Security Rule: Context Isolation
      nodeIntegration: false,   // Security Rule: Disable Node Integration in renderer
      sandbox: true,           // Security Rule: Sandbox enabled
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  windowManager.trackWindow(mainWindow);

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Setup CSP and secure headers. Development is slightly more permissive for Vite HMR;
  // production removes unsafe-eval and keeps executable content same-origin.
  const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;
  const contentSecurityPolicy = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:* https: wss:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [contentSecurityPolicy],
      },
    });
  });

  // Setup Application Menu
  createApplicationMenu(mainWindow);

  // Load URL depending on environment (Dev vs Production build)
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

  if (isDev) {
    await mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    const userDataPath = app.getPath('userData');
    setupIPCHandlers(userDataPath);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

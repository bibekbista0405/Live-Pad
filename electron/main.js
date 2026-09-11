// electron/main.ts
import { app as app3, BrowserWindow as BrowserWindow4, session } from "electron";
import path3 from "path";
import { fileURLToPath } from "url";

// electron/window.ts
import { screen } from "electron";
import fs from "fs";
import path from "path";
var WindowManager = class {
  constructor(userDataPath) {
    this.window = null;
    this.stateFilePath = path.join(userDataPath, "window-state.json");
    this.state = this.loadState();
  }
  loadState() {
    const defaultState = {
      width: 1280,
      height: 800,
      isMaximized: false,
      isFullScreen: false
    };
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, "utf8");
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const visible = screen.getAllDisplays().some((display) => {
            return parsed.x >= display.bounds.x && parsed.y >= display.bounds.y && parsed.x < display.bounds.x + display.bounds.width && parsed.y < display.bounds.y + display.bounds.height;
          });
          if (!visible) {
            delete parsed.x;
            delete parsed.y;
          }
        }
        return { ...defaultState, ...parsed };
      }
    } catch {
    }
    return defaultState;
  }
  saveState() {
    if (!this.window) return;
    try {
      const isMaximized = this.window.isMaximized();
      const isFullScreen = this.window.isFullScreen();
      if (!isMaximized && !isFullScreen) {
        const bounds = this.window.getBounds();
        this.state.x = bounds.x;
        this.state.y = bounds.y;
        this.state.width = bounds.width;
        this.state.height = bounds.height;
      }
      this.state.isMaximized = isMaximized;
      this.state.isFullScreen = isFullScreen;
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error("Failed to save window state:", e);
    }
  }
  getState() {
    return this.state;
  }
  trackWindow(window) {
    this.window = window;
    const saveHandler = () => this.saveState();
    window.on("resize", saveHandler);
    window.on("move", saveHandler);
    window.on("close", saveHandler);
  }
};

// electron/menu.ts
import { Menu, app, shell } from "electron";
function createApplicationMenu(mainWindow2) {
  const isMac = process.platform === "darwin";
  const sendCommand = (command, data) => {
    if (mainWindow2 && !mainWindow2.isDestroyed()) {
      mainWindow2.webContents.send("menu:command", command, data);
    }
  };
  const template = [
    ...isMac ? [{
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    }] : [],
    {
      label: "&File",
      submenu: [
        {
          label: "New Note",
          accelerator: "CmdOrCtrl+N",
          click: () => sendCommand("file:new-note")
        },
        {
          label: "New Workspace Room",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => sendCommand("workspace:new-room")
        },
        {
          label: "Open Document...",
          accelerator: "CmdOrCtrl+O",
          click: () => sendCommand("file:open")
        },
        { type: "separator" },
        {
          label: "Save File",
          accelerator: "CmdOrCtrl+S",
          click: () => sendCommand("file:save")
        },
        {
          label: "Export Document...",
          accelerator: "CmdOrCtrl+E",
          click: () => sendCommand("file:export")
        },
        { type: "separator" },
        {
          label: "Join Workspace Room...",
          accelerator: "CmdOrCtrl+J",
          click: () => sendCommand("workspace:join")
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    {
      label: "&Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
        { type: "separator" },
        {
          label: "Find in Document...",
          accelerator: "CmdOrCtrl+F",
          click: () => sendCommand("edit:find")
        }
      ]
    },
    {
      label: "&View",
      submenu: [
        {
          label: "Toggle Sidebar",
          accelerator: "CmdOrCtrl+B",
          click: () => sendCommand("view:toggle-sidebar")
        },
        {
          label: "Toggle Inspector Panel",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => sendCommand("view:toggle-inspector")
        },
        {
          label: "Toggle Code Mode",
          accelerator: "CmdOrCtrl+Alt+C",
          click: () => sendCommand("view:toggle-code-mode")
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "&Workspace",
      submenu: [
        {
          label: "Workspace Settings",
          click: () => sendCommand("workspace:settings")
        },
        {
          label: "Invite Collaborators",
          click: () => sendCommand("workspace:invite")
        },
        {
          label: "Version History",
          click: () => sendCommand("workspace:history")
        },
        { type: "separator" },
        {
          label: "Open AI Assistant",
          accelerator: "CmdOrCtrl+K",
          click: () => sendCommand("workspace:ai-assistant")
        }
      ]
    },
    {
      label: "&Code",
      submenu: [
        {
          label: "Run Code Snippet",
          accelerator: "CmdOrCtrl+Enter",
          click: () => sendCommand("code:run")
        },
        {
          label: "Open Native Terminal",
          accelerator: "CmdOrCtrl+`",
          click: () => sendCommand("code:terminal")
        },
        {
          label: "Insert Snippet Template",
          click: () => sendCommand("code:snippet-template")
        }
      ]
    },
    {
      label: "&Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...isMac ? [
          { type: "separator" },
          { role: "front" },
          { type: "separator" },
          { role: "window" }
        ] : [{ role: "close" }]
      ]
    },
    {
      label: "&Help",
      submenu: [
        {
          label: "LivePad Documentation & Help",
          click: async () => {
            await shell.openExternal("https://github.com");
          }
        },
        {
          label: "Keyboard Shortcuts",
          accelerator: "CmdOrCtrl+/",
          click: () => sendCommand("help:shortcuts")
        },
        { type: "separator" },
        {
          label: "About LivePad Desktop",
          click: () => sendCommand("help:about")
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

// electron/ipc/index.ts
import { ipcMain, dialog, BrowserWindow as BrowserWindow3, Notification, shell as shell2, app as app2 } from "electron";
import fs2 from "fs";
import path2 from "path";
import { exec } from "child_process";
function setupIPCHandlers(userDataPath) {
  const storageFilePath = path2.join(userDataPath, "desktop-native-storage.json");
  const getNativeStore = () => {
    try {
      if (fs2.existsSync(storageFilePath)) {
        return JSON.parse(fs2.readFileSync(storageFilePath, "utf8"));
      }
    } catch (err) {
      console.error("Error reading native storage:", err);
    }
    return {};
  };
  const saveNativeStore = (data) => {
    try {
      fs2.writeFileSync(storageFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error writing native storage:", err);
    }
  };
  ipcMain.handle("app:getPlatformInfo", async () => {
    return {
      name: "LivePad Desktop",
      version: app2.getVersion() || "1.0.0",
      os: process.platform,
      architecture: process.arch,
      isElectron: true
    };
  });
  ipcMain.handle("dialog:openFolder", async (event) => {
    const win = BrowserWindow3.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
  ipcMain.handle("dialog:saveFile", async (event, payload) => {
    const win = BrowserWindow3.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, {
      defaultPath: payload.defaultName || "LivePad-Document.md",
      filters: payload.filters || [
        { name: "Markdown Document", extensions: ["md", "markdown"] },
        { name: "Text File", extensions: ["txt"] },
        { name: "HTML Document", extensions: ["html"] },
        { name: "JSON Data", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    try {
      fs2.writeFileSync(result.filePath, payload.content, "utf8");
      return result.filePath;
    } catch (e) {
      console.error("Failed to write file via IPC:", e);
      throw new Error(e.message || "Failed to save file to disk");
    }
  });
  ipcMain.handle("dialog:readFile", async (event, filePath) => {
    let targetPath = filePath;
    if (!targetPath) {
      const win = BrowserWindow3.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(win, {
        properties: ["openFile"],
        filters: [
          { name: "Supported Documents", extensions: ["md", "txt", "html", "json", "ts", "js", "py"] },
          { name: "All Files", extensions: ["*"] }
        ]
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      targetPath = result.filePaths[0];
    }
    try {
      const content = fs2.readFileSync(targetPath, "utf8");
      return { path: targetPath, content };
    } catch (e) {
      console.error("Failed to read file via IPC:", e);
      throw new Error(e.message || "Failed to read file from disk");
    }
  });
  ipcMain.handle("notification:show", async (_event, { title, body, icon }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || "LivePad",
        body: body || "",
        icon: icon || void 0
      });
      notification.show();
      return true;
    }
    return false;
  });
  ipcMain.handle("shell:openExternal", async (_event, url) => {
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
      await shell2.openExternal(url);
      return true;
    }
    return false;
  });
  ipcMain.handle("terminal:open", async (_event, workingDir) => {
    const cwd = workingDir && fs2.existsSync(workingDir) ? workingDir : process.cwd();
    if (process.platform === "win32") {
      exec("start cmd.exe", { cwd });
    } else if (process.platform === "darwin") {
      exec("open -a Terminal", { cwd });
    } else {
      exec("x-terminal-emulator || gnome-terminal || xterm", { cwd });
    }
    return true;
  });
  ipcMain.handle("window:control", async (event, action) => {
    const win = BrowserWindow3.fromWebContents(event.sender);
    if (!win) return null;
    switch (action) {
      case "minimize":
        win.minimize();
        return true;
      case "maximize":
        if (!win.isMaximized()) win.maximize();
        return true;
      case "unmaximize":
        if (win.isMaximized()) win.unmaximize();
        return true;
      case "close":
        win.close();
        return true;
      case "isMaximized":
        return win.isMaximized();
      default:
        return false;
    }
  });
  ipcMain.handle("storage:get", async (_event, key) => {
    const store = getNativeStore();
    return store[key] !== void 0 ? store[key] : null;
  });
  ipcMain.handle("storage:set", async (_event, { key, value }) => {
    const store = getNativeStore();
    store[key] = value;
    saveNativeStore(store);
    return true;
  });
}

// electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var mainWindow = null;
var windowManager = null;
async function createWindow() {
  const userDataPath = app3.getPath("userData");
  windowManager = new WindowManager(userDataPath);
  const windowState = windowManager.getState();
  mainWindow = new BrowserWindow4({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 900,
    minHeight: 600,
    title: "LivePad Desktop \u2014 Modern Workspace & Document Editor",
    show: false,
    // Don't show until ready-to-show for smooth rendering
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path3.join(__dirname, "preload.js"),
      contextIsolation: true,
      // Security Rule: Context Isolation
      nodeIntegration: false,
      // Security Rule: Disable Node Integration in renderer
      sandbox: true,
      // Security Rule: Sandbox enabled
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  windowManager.trackWindow(mainWindow);
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https: wss:; object-src 'none';"
        ]
      }
    });
  });
  createApplicationMenu(mainWindow);
  const isDev = process.env.NODE_ENV === "development" || process.env.VITE_DEV_SERVER_URL !== void 0;
  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:3000";
  if (isDev) {
    await mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path3.join(__dirname, "../dist/index.html");
    await mainWindow.loadFile(indexPath);
  }
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
var gotTheLock = app3.requestSingleInstanceLock();
if (!gotTheLock) {
  app3.quit();
} else {
  app3.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app3.whenReady().then(() => {
    const userDataPath = app3.getPath("userData");
    setupIPCHandlers(userDataPath);
    createWindow();
    app3.on("activate", () => {
      if (BrowserWindow4.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}
app3.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app3.quit();
  }
});

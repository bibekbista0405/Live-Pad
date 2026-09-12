import { contextBridge, ipcRenderer } from 'electron';

export interface LivePadElectronAPI {
  getPlatformInfo: () => Promise<{
    name: string;
    version: string;
    os: string;
    architecture: string;
    isElectron: boolean;
  }>;
  openFolder: () => Promise<string | null>;
  saveFile: (content: string, defaultName?: string, filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  readFile: (filePath?: string) => Promise<{ path: string; content: string } | null>;
  readWorkspaceFile: (filePath: string) => Promise<{ path: string; content: string } | null>;
  showMessageBox: (options: { type?: 'info' | 'error' | 'warning' | 'question'; title: string; message: string; buttons?: string[] }) => Promise<number>;
  showNotification: (title: string, body: string, icon?: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  openTerminal: (workingDir?: string) => Promise<boolean>;
  windowControl: (action: 'minimize' | 'maximize' | 'unmaximize' | 'close' | 'isMaximized') => Promise<any>;
  createWindow: (projectPath?: string) => Promise<boolean>;
  getNativeStorage: (key: string) => Promise<any>;
  setNativeStorage: (key: string, value: any) => Promise<boolean>;
  onMenuCommand: (callback: (command: string, data?: any) => void) => () => void;

  // File System
  readDir: (dirPath: string, recursive?: boolean) => Promise<any[]>;
  createItem: (targetPath: string, isDirectory: boolean) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<string>;
  renameItem: (oldPath: string, newPath: string) => Promise<string>;
  deleteItem: (targetPath: string, useRecycleBin?: boolean) => Promise<boolean>;
  duplicateItem: (targetPath: string) => Promise<string>;
  revealInExplorer: (targetPath: string) => Promise<boolean>;
  watchFolder: (dirPath: string) => Promise<boolean>;
  unwatchFolder: (dirPath: string) => Promise<boolean>;
  onFolderChanged: (callback: (data: { eventType: string; filename: string; dirPath: string; fullPath: string }) => void) => () => void;

  // Project Workspace
  getRecentProjects: () => Promise<any[]>;
  addRecentProject: (projectPath: string, name?: string) => Promise<any[]>;
  togglePinProject: (projectPath: string) => Promise<any[]>;
  removeRecentProject: (projectPath: string) => Promise<any[]>;
  searchProject: (projectPath: string, query: string, isRegex?: boolean) => Promise<any[]>;

  // Native Terminal & Execution
  getShells: () => Promise<{ name: string; path: string; isDefault: boolean }[]>;
  executeCommand: (command: string, cwd?: string, processId?: string) => Promise<{ processId: string; status: string }>;
  killProcess: (processId: string) => Promise<boolean>;
  onTerminalOutput: (callback: (data: { processId: string; type: 'stdout' | 'stderr'; data: string }) => void) => () => void;
  onTerminalExit: (callback: (data: { processId: string; code: number }) => void) => () => void;

  // Git Integration
  getGitStatus: (repoPath: string) => Promise<{ isGitRepo: boolean; branch: string; files: { file: string; status: string }[] }>;
  getGitBranches: (repoPath: string) => Promise<string[]>;
  getGitDiff: (repoPath: string, filePath?: string) => Promise<string>;
  commitGit: (repoPath: string, message: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  initGit: (repoPath: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  cloneGit: (url: string, targetPath: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  stageGit: (repoPath: string, filePath?: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  unstageGit: (repoPath: string, filePath?: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  checkoutGit: (repoPath: string, branchName: string, isNew?: boolean) => Promise<{ success: boolean; output?: string; error?: string }>;
  syncGit: (repoPath: string, action: 'fetch' | 'pull' | 'push') => Promise<{ success: boolean; output?: string; error?: string }>;
  getGitLog: (repoPath: string, count?: number) => Promise<Array<{ hash: string; author: string; date: string; message: string }>>;
  getGitBlame: (repoPath: string, filePath: string) => Promise<string>;

  // Debugger Integration
  launchDebugger: (payload: { scriptPath: string; cwd?: string; args?: string[] }) => Promise<{ sessionId: string; port: number; status: string }>;
  controlDebugger: (sessionId: string, action: 'resume' | 'stepOver' | 'stepInto' | 'stepOut' | 'pause' | 'stop') => Promise<boolean>;
  setDebuggerBreakpoint: (sessionId: string, file: string, line: number) => Promise<{ verified: boolean; id: string }>;
  removeDebuggerBreakpoint: (sessionId: string, breakpointId: string) => Promise<boolean>;
  evaluateDebugger: (sessionId: string, expression: string) => Promise<any>;
  onDebuggerOutput: (callback: (data: { sessionId: string; type: 'stdout' | 'stderr'; data: string }) => void) => () => void;
  onDebuggerEvent: (callback: (data: { sessionId: string; event: string; details?: any; port?: number }) => void) => () => void;

  // Native Clipboard
  writeClipboardText: (text: string) => Promise<boolean>;
  readClipboardText: () => Promise<string>;
  writeClipboardHTML: (html: string) => Promise<boolean>;
  readClipboardHTML: () => Promise<string>;

  // Auto Updates
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<any>;
  installUpdate: () => Promise<boolean>;
}

const electronBridge: LivePadElectronAPI = {
  getPlatformInfo: () => ipcRenderer.invoke('app:getPlatformInfo'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (content, defaultName, filters) => ipcRenderer.invoke('dialog:saveFile', { content, defaultName, filters }),
  readFile: (filePath) => ipcRenderer.invoke('dialog:readFile', filePath),
  readWorkspaceFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  showMessageBox: (options) => ipcRenderer.invoke('dialog:showMessage', options),
  showNotification: (title, body, icon) => ipcRenderer.invoke('notification:show', { title, body, icon }),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  openTerminal: (workingDir) => ipcRenderer.invoke('terminal:open', workingDir),
  windowControl: (action) => ipcRenderer.invoke('window:control', action),
  createWindow: (projectPath) => ipcRenderer.invoke('window:create', projectPath),
  getNativeStorage: (key) => ipcRenderer.invoke('storage:get', key),
  setNativeStorage: (key, value) => ipcRenderer.invoke('storage:set', { key, value }),
  onMenuCommand: (callback) => {
    const handler = (_event: any, command: string, data?: any) => callback(command, data);
    ipcRenderer.on('menu:command', handler);
    return () => {
      ipcRenderer.removeListener('menu:command', handler);
    };
  },

  // File System
  readDir: (dirPath, recursive) => ipcRenderer.invoke('fs:readDir', dirPath, recursive),
  createItem: (targetPath, isDirectory) => ipcRenderer.invoke('fs:createItem', targetPath, isDirectory),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  deleteItem: (targetPath, useRecycleBin) => ipcRenderer.invoke('fs:delete', targetPath, useRecycleBin),
  duplicateItem: (targetPath) => ipcRenderer.invoke('fs:duplicate', targetPath),
  revealInExplorer: (targetPath) => ipcRenderer.invoke('fs:reveal', targetPath),
  watchFolder: (dirPath) => ipcRenderer.invoke('fs:watch', dirPath),
  unwatchFolder: (dirPath) => ipcRenderer.invoke('fs:unwatch', dirPath),
  onFolderChanged: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('fs:changed', handler);
    return () => {
      ipcRenderer.removeListener('fs:changed', handler);
    };
  },

  // Project Workspace
  getRecentProjects: () => ipcRenderer.invoke('project:getRecent'),
  addRecentProject: (projectPath, name) => ipcRenderer.invoke('project:addRecent', projectPath, name),
  togglePinProject: (projectPath) => ipcRenderer.invoke('project:togglePin', projectPath),
  removeRecentProject: (projectPath) => ipcRenderer.invoke('project:removeRecent', projectPath),
  searchProject: (projectPath, query, isRegex) => ipcRenderer.invoke('project:search', projectPath, query, isRegex),

  // Native Terminal & Execution
  getShells: () => ipcRenderer.invoke('terminal:getShells'),
  executeCommand: (command, cwd, processId) => ipcRenderer.invoke('terminal:execute', { command, cwd, processId }),
  killProcess: (processId) => ipcRenderer.invoke('terminal:kill', processId),
  onTerminalOutput: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('terminal:output', handler);
    return () => {
      ipcRenderer.removeListener('terminal:output', handler);
    };
  },
  onTerminalExit: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('terminal:exit', handler);
    return () => {
      ipcRenderer.removeListener('terminal:exit', handler);
    };
  },

  // Git Integration
  getGitStatus: (repoPath) => ipcRenderer.invoke('git:status', repoPath),
  getGitBranches: (repoPath) => ipcRenderer.invoke('git:branches', repoPath),
  getGitDiff: (repoPath, filePath) => ipcRenderer.invoke('git:diff', repoPath, filePath),
  commitGit: (repoPath, message) => ipcRenderer.invoke('git:commit', repoPath, message),
  initGit: (repoPath) => ipcRenderer.invoke('git:init', repoPath),
  cloneGit: (url, targetPath) => ipcRenderer.invoke('git:clone', url, targetPath),
  stageGit: (repoPath, filePath) => ipcRenderer.invoke('git:stage', repoPath, filePath),
  unstageGit: (repoPath, filePath) => ipcRenderer.invoke('git:unstage', repoPath, filePath),
  checkoutGit: (repoPath, branchName, isNew) => ipcRenderer.invoke('git:checkout', repoPath, branchName, isNew),
  syncGit: (repoPath, action) => ipcRenderer.invoke('git:sync', repoPath, action),
  getGitLog: (repoPath, count) => ipcRenderer.invoke('git:log', repoPath, count),
  getGitBlame: (repoPath, filePath) => ipcRenderer.invoke('git:blame', repoPath, filePath),

  // Debugger Integration
  launchDebugger: (payload) => ipcRenderer.invoke('debugger:launch', payload),
  controlDebugger: (sessionId, action) => ipcRenderer.invoke('debugger:control', sessionId, action),
  setDebuggerBreakpoint: (sessionId, file, line) => ipcRenderer.invoke('debugger:setBreakpoint', sessionId, file, line),
  removeDebuggerBreakpoint: (sessionId, breakpointId) => ipcRenderer.invoke('debugger:removeBreakpoint', sessionId, breakpointId),
  evaluateDebugger: (sessionId, expression) => ipcRenderer.invoke('debugger:evaluate', sessionId, expression),
  onDebuggerOutput: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('debugger:output', handler);
    return () => {
      ipcRenderer.removeListener('debugger:output', handler);
    };
  },
  onDebuggerEvent: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('debugger:event', handler);
    return () => {
      ipcRenderer.removeListener('debugger:event', handler);
    };
  },

  // Native Clipboard
  writeClipboardText: (text) => ipcRenderer.invoke('clipboard:writeText', text),
  readClipboardText: () => ipcRenderer.invoke('clipboard:readText'),
  writeClipboardHTML: (html) => ipcRenderer.invoke('clipboard:writeHTML', html),
  readClipboardHTML: () => ipcRenderer.invoke('clipboard:readHTML'),

  // Auto Updates
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
};

contextBridge.exposeInMainWorld('livepadElectron', electronBridge);

declare global {
  interface Window {
    livepadElectron?: LivePadElectronAPI;
  }
}

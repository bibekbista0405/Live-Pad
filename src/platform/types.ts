export type PlatformName = 'Web' | 'PWA' | 'Electron';
export type OSName = 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'unknown';

export interface IPlatformInfo {
  name: PlatformName;
  version: string;
  os: OSName;
  architecture: string;
  isWeb: boolean;
  isPWA: boolean;
  isElectron: boolean;
}

export interface FileFilterOption {
  name: string;
  extensions: string[];
}

export interface ReadFileResult {
  path: string;
  content: string;
}

export interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  updatedAt?: number;
  children?: DirectoryItem[];
  extension?: string;
}

export interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
  isPinned?: boolean;
}

export interface SearchMatch {
  path: string;
  relativePath: string;
  matches: { line: number; text: string }[];
}

export interface IPlatformServices {
  // Platform Detection
  getInfo(): IPlatformInfo;
  isWeb: boolean;
  isPWA: boolean;
  isElectron: boolean;
  getOS(): OSName;

  // File Operations
  openFolder(): Promise<string | null>;
  saveFile(content: string, defaultName?: string, filters?: FileFilterOption[]): Promise<string | null>;
  readFile(filePath?: string): Promise<ReadFileResult | null>;

  // Native Filesystem Services (Electron) / Virtual JS Fallback (Web)
  readDir(dirPath: string, recursive?: boolean): Promise<DirectoryItem[]>;
  createItem(targetPath: string, isDirectory: boolean): Promise<string>;
  writeFile(filePath: string, content: string): Promise<string>;
  renameItem(oldPath: string, newPath: string): Promise<string>;
  deleteItem(targetPath: string, useRecycleBin?: boolean): Promise<boolean>;
  duplicateItem(targetPath: string): Promise<string>;
  revealInExplorer(targetPath: string): Promise<boolean>;
  watchFolder(dirPath: string): Promise<boolean>;
  unwatchFolder(dirPath: string): Promise<boolean>;
  onFolderChanged(callback: (data: { eventType: string; filename: string; dirPath: string; fullPath: string }) => void): () => void;

  // Project Workspace Engine
  getRecentProjects(): Promise<RecentProject[]>;
  addRecentProject(projectPath: string, name?: string): Promise<RecentProject[]>;
  togglePinProject(projectPath: string): Promise<RecentProject[]>;
  removeRecentProject(projectPath: string): Promise<RecentProject[]>;
  searchProject(projectPath: string, query: string, isRegex?: boolean): Promise<SearchMatch[]>;

  // Native Terminal & Real Command Execution
  getShells(): Promise<{ name: string; path: string; isDefault: boolean }[]>;
  executeCommand(command: string, cwd?: string, processId?: string): Promise<{ processId: string; status: string }>;
  killProcess(processId: string): Promise<boolean>;
  onTerminalOutput(callback: (data: { processId: string; type: 'stdout' | 'stderr'; data: string }) => void): () => void;
  onTerminalExit(callback: (data: { processId: string; code: number }) => void): () => void;

  // Native Git Integration
  getGitStatus(repoPath: string): Promise<{ isGitRepo: boolean; branch: string; files: { file: string; status: string }[] }>;
  getGitBranches(repoPath: string): Promise<string[]>;
  getGitDiff(repoPath: string, filePath?: string): Promise<string>;
  commitGit(repoPath: string, message: string): Promise<{ success: boolean; output?: string; error?: string }>;
  initGit(repoPath: string): Promise<{ success: boolean; output?: string; error?: string }>;
  cloneGit(url: string, targetPath: string): Promise<{ success: boolean; output?: string; error?: string }>;
  stageGit(repoPath: string, filePath?: string): Promise<{ success: boolean; output?: string; error?: string }>;
  unstageGit(repoPath: string, filePath?: string): Promise<{ success: boolean; output?: string; error?: string }>;
  checkoutGit(repoPath: string, branchName: string, isNew?: boolean): Promise<{ success: boolean; output?: string; error?: string }>;
  syncGit(repoPath: string, action: 'fetch' | 'pull' | 'push'): Promise<{ success: boolean; output?: string; error?: string }>;
  getGitLog(repoPath: string, count?: number): Promise<Array<{ hash: string; author: string; date: string; message: string }>>;
  getGitBlame(repoPath: string, filePath: string): Promise<string>;

  // Debugger Services
  launchDebugger(payload: { scriptPath: string; cwd?: string; args?: string[] }): Promise<{ sessionId: string; port: number; status: string }>;
  controlDebugger(sessionId: string, action: 'resume' | 'stepOver' | 'stepInto' | 'stepOut' | 'pause' | 'stop'): Promise<boolean>;
  setDebuggerBreakpoint(sessionId: string, file: string, line: number): Promise<{ verified: boolean; id: string }>;
  evaluateDebugger(sessionId: string, expression: string): Promise<any>;
  onDebuggerOutput(callback: (data: { sessionId: string; type: 'stdout' | 'stderr'; data: string }) => void): () => void;
  onDebuggerEvent(callback: (data: { sessionId: string; event: string; details?: any; port?: number }) => void): () => void;

  // External / System Services
  openURL(url: string): Promise<boolean>;
  openExternal(url: string): Promise<boolean>;
  copyClipboard(text: string): Promise<boolean>;
  pasteClipboard(): Promise<string>;
  showNotification(title: string, body: string, icon?: string): Promise<boolean>;
  showError(title: string, message: string): Promise<void>;
  showSuccess(title: string, message: string): Promise<void>;
  showMessageBox(options: { type?: 'info' | 'error' | 'warning' | 'question'; title: string; message: string; buttons?: string[] }): Promise<number>;
  openTerminal(workingDir?: string): Promise<boolean>;

  // Window Controls & Multi-Window (Desktop)
  windowControl(action: 'minimize' | 'maximize' | 'unmaximize' | 'close' | 'isMaximized'): Promise<any>;
  createWindow(projectPath?: string): Promise<boolean>;

  // Desktop Native Storage
  getNativeStorage(key: string): Promise<any>;
  setNativeStorage(key: string, value: any): Promise<boolean>;

  // Auto Updates
  checkForUpdates(): Promise<any>;

  // IPC Menu Command Listener
  onMenuCommand(callback: (command: string, data?: any) => void): () => void;
}

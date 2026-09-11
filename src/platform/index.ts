import { IPlatformServices, IPlatformInfo, OSName, DirectoryItem, RecentProject, SearchMatch } from './types';
import { BrowserPlatform } from './browser';
import { ElectronPlatform } from './electron';
import { Logger } from './shared/logger';
import { SessionRestoreManager } from './shared/sessionRestore';

class PlatformManager implements IPlatformServices {
  private activePlatform: IPlatformServices;
  private cachedInfo: IPlatformInfo | null = null;

  constructor() {
    const isElectronEnv = typeof window !== 'undefined' && !!window.livepadElectron;
    if (isElectronEnv) {
      this.activePlatform = new ElectronPlatform();
      Logger.info('Platform Logs', 'Platform Abstraction Layer initialized in Electron Mode');
    } else {
      this.activePlatform = new BrowserPlatform();
      Logger.info('Platform Logs', `Platform Abstraction Layer initialized in ${this.activePlatform.getInfo().name} Mode`);
    }
  }

  public getInfo(): IPlatformInfo {
    if (!this.cachedInfo) {
      this.cachedInfo = this.activePlatform.getInfo();
    }
    return this.cachedInfo;
  }

  public get name(): string {
    return this.getInfo().name;
  }

  public get version(): string {
    return this.getInfo().version;
  }

  public get os(): OSName {
    return this.getInfo().os;
  }

  public get architecture(): string {
    return this.getInfo().architecture;
  }

  public get isWeb(): boolean {
    return this.activePlatform.isWeb;
  }

  public get isPWA(): boolean {
    return this.activePlatform.isPWA;
  }

  public get isElectron(): boolean {
    return this.activePlatform.isElectron;
  }

  public getOS(): OSName {
    return this.activePlatform.getOS();
  }

  public async openFolder() {
    return this.activePlatform.openFolder();
  }

  public async saveFile(content: string, defaultName?: string, filters?: any) {
    return this.activePlatform.saveFile(content, defaultName, filters);
  }

  public async readFile(filePath?: string) {
    return this.activePlatform.readFile(filePath);
  }

  // Filesystem
  public async readDir(dirPath: string, recursive?: boolean): Promise<DirectoryItem[]> {
    return this.activePlatform.readDir(dirPath, recursive);
  }

  public async createItem(targetPath: string, isDirectory: boolean): Promise<string> {
    return this.activePlatform.createItem(targetPath, isDirectory);
  }

  public async writeFile(filePath: string, content: string): Promise<string> {
    return this.activePlatform.writeFile(filePath, content);
  }

  public async renameItem(oldPath: string, newPath: string): Promise<string> {
    return this.activePlatform.renameItem(oldPath, newPath);
  }

  public async deleteItem(targetPath: string, useRecycleBin?: boolean): Promise<boolean> {
    return this.activePlatform.deleteItem(targetPath, useRecycleBin);
  }

  public async duplicateItem(targetPath: string): Promise<string> {
    return this.activePlatform.duplicateItem(targetPath);
  }

  public async revealInExplorer(targetPath: string): Promise<boolean> {
    return this.activePlatform.revealInExplorer(targetPath);
  }

  public async watchFolder(dirPath: string): Promise<boolean> {
    return this.activePlatform.watchFolder(dirPath);
  }

  public async unwatchFolder(dirPath: string): Promise<boolean> {
    return this.activePlatform.unwatchFolder(dirPath);
  }

  public onFolderChanged(callback: (data: { eventType: string; filename: string; dirPath: string; fullPath: string }) => void): () => void {
    return this.activePlatform.onFolderChanged(callback);
  }

  // Project Workspace Engine
  public async getRecentProjects(): Promise<RecentProject[]> {
    return this.activePlatform.getRecentProjects();
  }

  public async addRecentProject(projectPath: string, name?: string): Promise<RecentProject[]> {
    return this.activePlatform.addRecentProject(projectPath, name);
  }

  public async togglePinProject(projectPath: string): Promise<RecentProject[]> {
    return this.activePlatform.togglePinProject(projectPath);
  }

  public async removeRecentProject(projectPath: string): Promise<RecentProject[]> {
    return this.activePlatform.removeRecentProject(projectPath);
  }

  public async searchProject(projectPath: string, query: string, isRegex?: boolean): Promise<SearchMatch[]> {
    return this.activePlatform.searchProject(projectPath, query, isRegex);
  }

  // Native Terminal & Real Execution
  public async getShells() {
    return this.activePlatform.getShells();
  }

  public async executeCommand(command: string, cwd?: string, processId?: string) {
    return this.activePlatform.executeCommand(command, cwd, processId);
  }

  public async killProcess(processId: string) {
    return this.activePlatform.killProcess(processId);
  }

  public onTerminalOutput(callback: (data: { processId: string; type: 'stdout' | 'stderr'; data: string }) => void) {
    return this.activePlatform.onTerminalOutput(callback);
  }

  public onTerminalExit(callback: (data: { processId: string; code: number }) => void) {
    return this.activePlatform.onTerminalExit(callback);
  }

  // Git Integration
  public async getGitStatus(repoPath: string) {
    return this.activePlatform.getGitStatus(repoPath);
  }

  public async getGitBranches(repoPath: string) {
    return this.activePlatform.getGitBranches(repoPath);
  }

  public async getGitDiff(repoPath: string, filePath?: string) {
    return this.activePlatform.getGitDiff(repoPath, filePath);
  }

  public async commitGit(repoPath: string, message: string) {
    return this.activePlatform.commitGit(repoPath, message);
  }

  public async initGit(repoPath: string) {
    return this.activePlatform.initGit(repoPath);
  }

  public async cloneGit(url: string, targetPath: string) {
    return this.activePlatform.cloneGit(url, targetPath);
  }

  public async stageGit(repoPath: string, filePath?: string) {
    return this.activePlatform.stageGit(repoPath, filePath);
  }

  public async unstageGit(repoPath: string, filePath?: string) {
    return this.activePlatform.unstageGit(repoPath, filePath);
  }

  public async checkoutGit(repoPath: string, branchName: string, isNew?: boolean) {
    return this.activePlatform.checkoutGit(repoPath, branchName, isNew);
  }

  public async syncGit(repoPath: string, action: 'fetch' | 'pull' | 'push') {
    return this.activePlatform.syncGit(repoPath, action);
  }

  public async getGitLog(repoPath: string, count?: number) {
    return this.activePlatform.getGitLog(repoPath, count);
  }

  public async getGitBlame(repoPath: string, filePath: string) {
    return this.activePlatform.getGitBlame(repoPath, filePath);
  }

  // Debugger Services
  public async launchDebugger(payload: { scriptPath: string; cwd?: string; args?: string[] }) {
    return this.activePlatform.launchDebugger(payload);
  }

  public async controlDebugger(sessionId: string, action: 'resume' | 'stepOver' | 'stepInto' | 'stepOut' | 'pause' | 'stop') {
    return this.activePlatform.controlDebugger(sessionId, action);
  }

  public async setDebuggerBreakpoint(sessionId: string, file: string, line: number) {
    return this.activePlatform.setDebuggerBreakpoint(sessionId, file, line);
  }

  public async evaluateDebugger(sessionId: string, expression: string) {
    return this.activePlatform.evaluateDebugger(sessionId, expression);
  }

  public onDebuggerOutput(callback: (data: { sessionId: string; type: 'stdout' | 'stderr'; data: string }) => void) {
    return this.activePlatform.onDebuggerOutput(callback);
  }

  public onDebuggerEvent(callback: (data: { sessionId: string; event: string; details?: any; port?: number }) => void) {
    return this.activePlatform.onDebuggerEvent(callback);
  }

  public async openURL(url: string) {
    return this.activePlatform.openURL(url);
  }

  public async openExternal(url: string) {
    return this.activePlatform.openExternal(url);
  }

  public async copyClipboard(text: string) {
    return this.activePlatform.copyClipboard(text);
  }

  public async pasteClipboard() {
    return this.activePlatform.pasteClipboard();
  }

  public async showNotification(title: string, body: string, icon?: string) {
    return this.activePlatform.showNotification(title, body, icon);
  }

  public async showError(title: string, message: string) {
    return this.activePlatform.showError(title, message);
  }

  public async showSuccess(title: string, message: string) {
    return this.activePlatform.showSuccess(title, message);
  }

  public async showMessageBox(options: { type?: 'info' | 'error' | 'warning' | 'question'; title: string; message: string; buttons?: string[] }) {
    return this.activePlatform.showMessageBox(options);
  }

  public async openTerminal(workingDir?: string) {
    return this.activePlatform.openTerminal(workingDir);
  }

  public async windowControl(action: 'minimize' | 'maximize' | 'unmaximize' | 'close' | 'isMaximized') {
    return this.activePlatform.windowControl(action);
  }

  public async createWindow(projectPath?: string) {
    return this.activePlatform.createWindow(projectPath);
  }

  public async getNativeStorage(key: string) {
    return this.activePlatform.getNativeStorage(key);
  }

  public async setNativeStorage(key: string, value: any) {
    return this.activePlatform.setNativeStorage(key, value);
  }

  public async checkForUpdates() {
    return this.activePlatform.checkForUpdates();
  }

  public onMenuCommand(callback: (command: string, data?: any) => void) {
    return this.activePlatform.onMenuCommand(callback);
  }
}

export const Platform = new PlatformManager();

export { Logger, SessionRestoreManager };
export * from './types';

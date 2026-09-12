import { IPlatformServices, IPlatformInfo, OSName, FileFilterOption, ReadFileResult, DirectoryItem, RecentProject, SearchMatch } from '../types';
import { BrowserPlatform } from '../browser';
import { Logger } from '../shared/logger';

export class ElectronPlatform implements IPlatformServices {
  private fallbackBrowser = new BrowserPlatform();

  private get bridge() {
    return typeof window !== 'undefined' ? window.livepadElectron : undefined;
  }

  public getInfo(): IPlatformInfo {
    if (this.bridge) {
      return {
        name: 'Electron',
        version: '1.0.0',
        os: this.fallbackBrowser.detectOS(),
        architecture: 'x64',
        isWeb: false,
        isPWA: false,
        isElectron: true,
      };
    }
    return this.fallbackBrowser.getInfo();
  }

  public get isWeb(): boolean {
    return false;
  }

  public get isPWA(): boolean {
    return false;
  }

  public get isElectron(): boolean {
    return !!this.bridge;
  }

  public getOS(): OSName {
    return this.fallbackBrowser.detectOS();
  }

  public async openFolder(): Promise<string | null> {
    if (this.bridge) {
      try {
        Logger.info('Electron Logs', 'Calling openFolder via Electron IPC');
        return await this.bridge.openFolder();
      } catch (err) {
        Logger.error('Electron Logs', 'Electron openFolder failed', err);
      }
    }
    return this.fallbackBrowser.openFolder();
  }

  public async saveFile(content: string, defaultName?: string, filters?: FileFilterOption[]): Promise<string | null> {
    if (this.bridge) {
      try {
        Logger.info('Electron Logs', `Saving file via Electron IPC: ${defaultName}`);
        return await this.bridge.saveFile(content, defaultName, filters);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron saveFile failed', err);
      }
    }
    return this.fallbackBrowser.saveFile(content, defaultName);
  }

  public async readFile(filePath?: string): Promise<ReadFileResult | null> {
    if (this.bridge) {
      try {
        Logger.info('Electron Logs', 'Reading file via Electron IPC');
        return await this.bridge.readFile(filePath);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron readFile failed', err);
      }
    }
    return this.fallbackBrowser.readFile();
  }

  // Native Filesystem Services
  public async readDir(dirPath: string, recursive: boolean = true): Promise<DirectoryItem[]> {
    if (this.bridge) {
      try {
        return await this.bridge.readDir(dirPath, recursive);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron readDir failed', err);
      }
    }
    return [];
  }

  public async createItem(targetPath: string, isDirectory: boolean): Promise<string> {
    if (this.bridge) {
      try {
        return await this.bridge.createItem(targetPath, isDirectory);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron createItem failed', err);
      }
    }
    return targetPath;
  }

  public async writeFile(filePath: string, content: string): Promise<string> {
    if (this.bridge) {
      try {
        return await this.bridge.writeFile(filePath, content);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron writeFile failed', err);
      }
    }
    return filePath;
  }

  public async renameItem(oldPath: string, newPath: string): Promise<string> {
    if (this.bridge) {
      try {
        return await this.bridge.renameItem(oldPath, newPath);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron renameItem failed', err);
      }
    }
    return newPath;
  }

  public async deleteItem(targetPath: string, useRecycleBin: boolean = true): Promise<boolean> {
    if (this.bridge) {
      try {
        return await this.bridge.deleteItem(targetPath, useRecycleBin);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron deleteItem failed', err);
      }
    }
    return true;
  }

  public async duplicateItem(targetPath: string): Promise<string> {
    if (this.bridge) {
      try {
        return await this.bridge.duplicateItem(targetPath);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron duplicateItem failed', err);
      }
    }
    return `${targetPath}-copy`;
  }

  public async revealInExplorer(targetPath: string): Promise<boolean> {
    if (this.bridge) {
      try {
        return await this.bridge.revealInExplorer(targetPath);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron revealInExplorer failed', err);
      }
    }
    return false;
  }

  public async watchFolder(dirPath: string): Promise<boolean> {
    if (this.bridge) {
      return await this.bridge.watchFolder(dirPath);
    }
    return false;
  }

  public async unwatchFolder(dirPath: string): Promise<boolean> {
    if (this.bridge) {
      return await this.bridge.unwatchFolder(dirPath);
    }
    return false;
  }

  public onFolderChanged(callback: (data: { eventType: string; filename: string; dirPath: string; fullPath: string }) => void): () => void {
    if (this.bridge) {
      return this.bridge.onFolderChanged(callback);
    }
    return () => {};
  }

  // Project Workspace Engine
  public async getRecentProjects(): Promise<RecentProject[]> {
    if (this.bridge) {
      try {
        return await this.bridge.getRecentProjects();
      } catch (err) {
        Logger.error('Electron Logs', 'Failed to get recent projects', err);
      }
    }
    return this.fallbackBrowser.getRecentProjects();
  }

  public async addRecentProject(projectPath: string, name?: string): Promise<RecentProject[]> {
    if (this.bridge) {
      try {
        return await this.bridge.addRecentProject(projectPath, name);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed to add recent project', err);
      }
    }
    return this.fallbackBrowser.addRecentProject(projectPath, name);
  }

  public async togglePinProject(projectPath: string): Promise<RecentProject[]> {
    if (this.bridge) {
      try {
        return await this.bridge.togglePinProject(projectPath);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed to toggle pin project', err);
      }
    }
    return this.fallbackBrowser.togglePinProject(projectPath);
  }

  public async removeRecentProject(projectPath: string): Promise<RecentProject[]> {
    if (this.bridge) {
      try {
        return await this.bridge.removeRecentProject(projectPath);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed to remove recent project', err);
      }
    }
    return this.fallbackBrowser.removeRecentProject(projectPath);
  }

  public async searchProject(projectPath: string, query: string, isRegex: boolean = false): Promise<SearchMatch[]> {
    if (this.bridge) {
      try {
        return await this.bridge.searchProject(projectPath, query, isRegex);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed project search', err);
      }
    }
    return [];
  }

  // Native Terminal & Real Command Execution
  public async getShells(): Promise<{ name: string; path: string; isDefault: boolean }[]> {
    if (this.bridge) {
      return await this.bridge.getShells();
    }
    return this.fallbackBrowser.getShells();
  }

  public async executeCommand(command: string, cwd?: string, processId?: string): Promise<{ processId: string; status: string }> {
    if (this.bridge) {
      return await this.bridge.executeCommand(command, cwd, processId);
    }
    return this.fallbackBrowser.executeCommand(command);
  }

  public async killProcess(processId: string): Promise<boolean> {
    if (this.bridge) {
      return await this.bridge.killProcess(processId);
    }
    return true;
  }

  public onTerminalOutput(callback: (data: { processId: string; type: 'stdout' | 'stderr'; data: string }) => void): () => void {
    if (this.bridge) {
      return this.bridge.onTerminalOutput(callback);
    }
    return () => {};
  }

  public onTerminalExit(callback: (data: { processId: string; code: number }) => void): () => void {
    if (this.bridge) {
      return this.bridge.onTerminalExit(callback);
    }
    return () => {};
  }

  // Git Integration
  public async getGitStatus(repoPath: string): Promise<{ isGitRepo: boolean; branch: string; files: { file: string; status: string }[] }> {
    if (this.bridge) {
      try {
        return await this.bridge.getGitStatus(repoPath);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed getGitStatus', err);
      }
    }
    return { isGitRepo: false, branch: '', files: [] };
  }

  public async getGitBranches(repoPath: string): Promise<string[]> {
    if (this.bridge) {
      try {
        return await this.bridge.getGitBranches(repoPath);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed getGitBranches', err);
      }
    }
    return [];
  }

  public async getGitDiff(repoPath: string, filePath?: string): Promise<string> {
    if (this.bridge) {
      try {
        return await this.bridge.getGitDiff(repoPath, filePath);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed getGitDiff', err);
      }
    }
    return '';
  }

  public async commitGit(repoPath: string, message: string): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.bridge) {
      try {
        return await this.bridge.commitGit(repoPath, message);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Not in Electron mode' };
  }

  public async initGit(repoPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.bridge) {
      try {
        return await this.bridge.initGit(repoPath);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Not in Electron mode' };
  }

  public async cloneGit(url: string, targetPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.bridge) {
      try {
        return await this.bridge.cloneGit(url, targetPath);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Not in Electron mode' };
  }

  public async stageGit(repoPath: string, filePath?: string): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.bridge) {
      try {
        return await this.bridge.stageGit(repoPath, filePath);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Not in Electron mode' };
  }

  public async unstageGit(repoPath: string, filePath?: string): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.bridge) {
      try {
        return await this.bridge.unstageGit(repoPath, filePath);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Not in Electron mode' };
  }

  public async checkoutGit(repoPath: string, branchName: string, isNew?: boolean): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.bridge) {
      try {
        return await this.bridge.checkoutGit(repoPath, branchName, isNew);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Not in Electron mode' };
  }

  public async syncGit(repoPath: string, action: 'fetch' | 'pull' | 'push'): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.bridge) {
      try {
        return await this.bridge.syncGit(repoPath, action);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Not in Electron mode' };
  }

  public async getGitLog(repoPath: string, count?: number): Promise<Array<{ hash: string; author: string; date: string; message: string }>> {
    if (this.bridge) {
      try {
        return await this.bridge.getGitLog(repoPath, count);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed getGitLog', err);
      }
    }
    return [];
  }

  public async getGitBlame(repoPath: string, filePath: string): Promise<string> {
    if (this.bridge) {
      try {
        return await this.bridge.getGitBlame(repoPath, filePath);
      } catch (err) {
        Logger.error('Electron Logs', 'Failed getGitBlame', err);
      }
    }
    return '';
  }

  // Debugger Integration
  public async launchDebugger(payload: { scriptPath: string; cwd?: string; args?: string[] }): Promise<{ sessionId: string; port: number; status: string }> {
    if (this.bridge) {
      return await this.bridge.launchDebugger(payload);
    }
    return this.fallbackBrowser.launchDebugger();
  }

  public async controlDebugger(sessionId: string, action: 'resume' | 'stepOver' | 'stepInto' | 'stepOut' | 'pause' | 'stop'): Promise<boolean> {
    if (this.bridge) {
      return await this.bridge.controlDebugger(sessionId, action);
    }
    return true;
  }

  public async setDebuggerBreakpoint(sessionId: string, file: string, line: number): Promise<{ verified: boolean; id: string }> {
    if (this.bridge) {
      return await this.bridge.setDebuggerBreakpoint(sessionId, file, line);
    }
    return this.fallbackBrowser.setDebuggerBreakpoint();
  }

  public async evaluateDebugger(sessionId: string, expression: string): Promise<any> {
    if (this.bridge) {
      return await this.bridge.evaluateDebugger(sessionId, expression);
    }
    return 'Electron bridge missing';
  }

  public onDebuggerOutput(callback: (data: { sessionId: string; type: 'stdout' | 'stderr'; data: string }) => void): () => void {
    if (this.bridge) {
      return this.bridge.onDebuggerOutput(callback);
    }
    return () => {};
  }

  public onDebuggerEvent(callback: (data: { sessionId: string; event: string; details?: any; port?: number }) => void): () => void {
    if (this.bridge) {
      return this.bridge.onDebuggerEvent(callback);
    }
    return () => {};
  }

  public async openURL(url: string): Promise<boolean> {
    if (this.bridge) {
      try {
        return await this.bridge.openExternal(url);
      } catch (err) {
        Logger.warn('Electron Logs', 'Electron openExternal failed', err);
      }
    }
    return this.fallbackBrowser.openURL(url);
  }

  public async openExternal(url: string): Promise<boolean> {
    return this.openURL(url);
  }

  public async copyClipboard(text: string): Promise<boolean> {
    if (this.bridge) {
      return await this.bridge.writeClipboardText(text);
    }
    return this.fallbackBrowser.copyClipboard(text);
  }

  public async pasteClipboard(): Promise<string> {
    if (this.bridge) {
      return await this.bridge.readClipboardText();
    }
    return this.fallbackBrowser.pasteClipboard();
  }

  public async showNotification(title: string, body: string, icon?: string): Promise<boolean> {
    if (this.bridge) {
      try {
        return await this.bridge.showNotification(title, body, icon);
      } catch (err) {
        Logger.warn('Electron Logs', 'Electron notification failed', err);
      }
    }
    return this.fallbackBrowser.showNotification(title, body);
  }

  public async showError(title: string, message: string): Promise<void> {
    if (this.bridge) {
      await this.bridge.showMessageBox({ type: 'error', title, message });
    }
    Logger.error('Electron Logs', `[${title}] ${message}`);
  }

  public async showSuccess(title: string, message: string): Promise<void> {
    if (this.bridge) {
      await this.bridge.showNotification(title, message);
    }
    Logger.info('Electron Logs', `[${title}] ${message}`);
  }

  public async showMessageBox(options: { type?: 'info' | 'error' | 'warning' | 'question'; title: string; message: string; buttons?: string[] }): Promise<number> {
    if (this.bridge) {
      return await this.bridge.showMessageBox(options);
    }
    return this.fallbackBrowser.showMessageBox(options);
  }

  public async openTerminal(workingDir?: string): Promise<boolean> {
    if (this.bridge) {
      try {
        return await this.bridge.openTerminal(workingDir);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron openTerminal failed', err);
      }
    }
    return this.fallbackBrowser.openTerminal();
  }

  public async windowControl(action: 'minimize' | 'maximize' | 'unmaximize' | 'close' | 'isMaximized'): Promise<any> {
    if (this.bridge) {
      try {
        return await this.bridge.windowControl(action);
      } catch (err) {
        Logger.error('Electron Logs', 'Electron windowControl failed', err);
      }
    }
    return false;
  }

  public async createWindow(projectPath?: string): Promise<boolean> {
    if (this.bridge) {
      return await this.bridge.createWindow(projectPath);
    }
    return this.fallbackBrowser.createWindow(projectPath);
  }

  public async getNativeStorage(key: string): Promise<any> {
    if (this.bridge) {
      try {
        return await this.bridge.getNativeStorage(key);
      } catch (err) {
        Logger.warn('Electron Logs', 'Failed to get native storage', err);
      }
    }
    return this.fallbackBrowser.getNativeStorage(key);
  }

  public async setNativeStorage(key: string, value: any): Promise<boolean> {
    if (this.bridge) {
      try {
        await this.bridge.setNativeStorage(key, value);
      } catch (err) {
        Logger.warn('Electron Logs', 'Failed to set native storage', err);
      }
    }
    return this.fallbackBrowser.setNativeStorage(key, value);
  }

  public async checkForUpdates(): Promise<any> {
    if (this.bridge) {
      return await this.bridge.checkForUpdates();
    }
    return this.fallbackBrowser.checkForUpdates();
  }

  public onMenuCommand(callback: (command: string, data?: any) => void): () => void {
    if (this.bridge) {
      return this.bridge.onMenuCommand(callback);
    }
    return () => {};
  }
}

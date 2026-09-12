import { IPlatformServices, IPlatformInfo, OSName, FileFilterOption, ReadFileResult, DirectoryItem, RecentProject, SearchMatch } from '../types';
import { Logger } from '../shared/logger';

export class BrowserPlatform implements IPlatformServices {
  private isPWAInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  public detectOS(): OSName {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('linux')) return 'linux';
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    return 'unknown';
  }

  public getInfo(): IPlatformInfo {
    const isPwa = this.isPWAInstalled();
    return {
      name: isPwa ? 'PWA' : 'Web',
      version: '1.0.0',
      os: this.detectOS(),
      architecture: 'browser',
      isWeb: !isPwa,
      isPWA: isPwa,
      isElectron: false,
    };
  }

  public get isWeb(): boolean {
    return !this.isPWAInstalled();
  }

  public get isPWA(): boolean {
    return this.isPWAInstalled();
  }

  public get isElectron(): boolean {
    return false;
  }

  public getOS(): OSName {
    return this.detectOS();
  }

  public async openFolder(): Promise<string | null> {
    Logger.info('Browser Logs', 'openFolder called in Browser');
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        return handle.name || 'Selected Folder';
      } catch (err) {
        Logger.warn('Browser Logs', 'Directory picker cancelled or unsupported', err);
      }
    }
    return null;
  }

  public async saveFile(content: string, defaultName: string = 'LivePad-Document.md'): Promise<string | null> {
    Logger.info('Browser Logs', `saveFile called in Browser for: ${defaultName}`);
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return defaultName;
    } catch (e) {
      Logger.error('Browser Logs', 'Failed browser file save download', e);
      return null;
    }
  }

  public async readWorkspaceFile(_filePath: string): Promise<ReadFileResult | null> {
    return null;
  }

  public async readFile(): Promise<ReadFileResult | null> {
    Logger.info('Browser Logs', 'readFile called in Browser');
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.txt,.html,.json,.js,.ts,.py,*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            path: file.name,
            content: reader.result as string,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      input.click();
    });
  }

  // Browser filesystem capability boundary
  public async readDir(): Promise<DirectoryItem[]> {
    return [];
  }

  public async createItem(targetPath: string): Promise<string> {
    return targetPath;
  }

  public async writeFile(filePath: string): Promise<string> {
    return filePath;
  }

  public async renameItem(_oldPath: string, newPath: string): Promise<string> {
    return newPath;
  }

  public async deleteItem(): Promise<boolean> {
    return true;
  }

  public async duplicateItem(targetPath: string): Promise<string> {
    return `${targetPath}-copy`;
  }

  public async revealInExplorer(): Promise<boolean> {
    return false;
  }

  public async watchFolder(): Promise<boolean> {
    return false;
  }

  public async unwatchFolder(): Promise<boolean> {
    return false;
  }

  public onFolderChanged(): () => void {
    return () => {};
  }

  // Project Workspace Engine
  public async getRecentProjects(): Promise<RecentProject[]> {
    const data = localStorage.getItem('livepad_web_recent_projects');
    return data ? JSON.parse(data) : [];
  }

  public async addRecentProject(projectPath: string, name?: string): Promise<RecentProject[]> {
    let list = await this.getRecentProjects();
    const existing = list.find(p => p.path === projectPath);
    if (existing) {
      existing.lastOpened = Date.now();
    } else {
      list.unshift({
        id: `web-proj-${Date.now()}`,
        name: name || projectPath,
        path: projectPath,
        lastOpened: Date.now(),
      });
    }
    list = list.slice(0, 10);
    localStorage.setItem('livepad_web_recent_projects', JSON.stringify(list));
    return list;
  }

  public async togglePinProject(projectPath: string): Promise<RecentProject[]> {
    const list = await this.getRecentProjects();
    const item = list.find(p => p.path === projectPath);
    if (item) {
      item.isPinned = !item.isPinned;
      localStorage.setItem('livepad_web_recent_projects', JSON.stringify(list));
    }
    return list;
  }

  public async removeRecentProject(projectPath: string): Promise<RecentProject[]> {
    let list = await this.getRecentProjects();
    list = list.filter(p => p.path !== projectPath);
    localStorage.setItem('livepad_web_recent_projects', JSON.stringify(list));
    return list;
  }

  public async searchProject(): Promise<SearchMatch[]> {
    return [];
  }

  // Native Terminal & Execution
  public async getShells(): Promise<{ name: string; path: string; isDefault: boolean }[]> {
    return [];
  }

  public async executeCommand(_command: string): Promise<{ processId: string; status: string }> {
    throw new Error('Native terminal execution requires the LivePad Desktop Edition.');
  }

  public async killProcess(): Promise<boolean> {
    throw new Error('Native process control requires the LivePad Desktop Edition.');
  }

  public onTerminalOutput(): () => void {
    return () => {};
  }

  public onTerminalExit(): () => void {
    return () => {};
  }

  // Git Integration
  public async getGitStatus(): Promise<{ isGitRepo: boolean; branch: string; files: { file: string; status: string }[] }> {
    return { isGitRepo: false, branch: '', files: [] };
  }

  public async getGitBranches(): Promise<string[]> {
    return [];
  }

  public async getGitDiff(): Promise<string> {
    return '';
  }

  public async commitGit(): Promise<{ success: boolean; output?: string; error?: string }> {
    return { success: false, error: 'Git CLI is only supported in Desktop Edition.' };
  }

  public async initGit(): Promise<{ success: boolean; output?: string; error?: string }> {
    return { success: false, error: 'Git CLI is only supported in Desktop Edition.' };
  }

  public async cloneGit(): Promise<{ success: boolean; output?: string; error?: string }> {
    return { success: false, error: 'Git CLI is only supported in Desktop Edition.' };
  }

  public async stageGit(): Promise<{ success: boolean; output?: string; error?: string }> {
    return { success: false, error: 'Git CLI is only supported in Desktop Edition.' };
  }

  public async unstageGit(): Promise<{ success: boolean; output?: string; error?: string }> {
    return { success: false, error: 'Git CLI is only supported in Desktop Edition.' };
  }

  public async checkoutGit(): Promise<{ success: boolean; output?: string; error?: string }> {
    return { success: false, error: 'Git CLI is only supported in Desktop Edition.' };
  }

  public async syncGit(): Promise<{ success: boolean; output?: string; error?: string }> {
    return { success: false, error: 'Git CLI is only supported in Desktop Edition.' };
  }

  public async getGitLog(): Promise<Array<{ hash: string; author: string; date: string; message: string }>> {
    return [];
  }

  public async getGitBlame(): Promise<string> {
    return '';
  }

  // Debugger Services
  public async launchDebugger(): Promise<{ sessionId: string; port: number; status: string }> {
    throw new Error('Native debugging requires the LivePad Desktop Edition.');
  }

  public async controlDebugger(): Promise<boolean> {
    throw new Error('Native debugging requires the LivePad Desktop Edition.');
  }

  public async setDebuggerBreakpoint(): Promise<{ verified: boolean; id: string }> {
    throw new Error('Native debugging requires the LivePad Desktop Edition.');
  }

  public async removeDebuggerBreakpoint(_sessionId: string, _breakpointId: string): Promise<boolean> {
    return false;
  }

  public async evaluateDebugger(): Promise<any> {
    throw new Error('Native debugging requires the LivePad Desktop Edition.');
  }

  public onDebuggerOutput(): () => void {
    return () => {};
  }

  public onDebuggerEvent(): () => void {
    return () => {};
  }

  public async openURL(url: string): Promise<boolean> {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  public async openExternal(url: string): Promise<boolean> {
    return this.openURL(url);
  }

  public async copyClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      Logger.warn('Browser Logs', 'Clipboard API failed', e);
    }
    return false;
  }

  public async pasteClipboard(): Promise<string> {
    try {
      if (navigator.clipboard) {
        return await navigator.clipboard.readText();
      }
    } catch (e) {
      Logger.warn('Browser Logs', 'Clipboard readText failed', e);
    }
    return '';
  }

  public async showNotification(title: string, body: string): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body });
        return true;
      }
    }
    return false;
  }

  public async showError(title: string, message: string): Promise<void> {
    Logger.error('Browser Logs', `[${title}] ${message}`);
  }

  public async showSuccess(title: string, message: string): Promise<void> {
    Logger.info('Browser Logs', `[${title}] ${message}`);
  }

  public async showMessageBox(options: { type?: 'info' | 'error' | 'warning' | 'question'; title: string; message: string; buttons?: string[] }): Promise<number> {
    alert(`${options.title}\n\n${options.message}`);
    return 0;
  }

  public async openTerminal(): Promise<boolean> {
    Logger.warn('Browser Logs', 'Native Terminal is not available in Browser mode');
    return false;
  }

  public async windowControl(): Promise<any> {
    return false;
  }

  public async createWindow(projectPath?: string): Promise<boolean> {
    window.open(projectPath ? `?project=${encodeURIComponent(projectPath)}` : '/', '_blank');
    return true;
  }

  public async getNativeStorage(key: string): Promise<any> {
    try {
      const val = localStorage.getItem(`livepad_native_${key}`);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  public async setNativeStorage(key: string, value: any): Promise<boolean> {
    try {
      localStorage.setItem(`livepad_native_${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  public async checkForUpdates(): Promise<any> {
    return { updateAvailable: false, currentVersion: '1.0.0' };
  }

  public onMenuCommand(): () => void {
    return () => {};
  }
}

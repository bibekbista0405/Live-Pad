import { ipcMain, BrowserWindow } from 'electron';
import { spawn, execFile, ChildProcess } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { assertWorkspaceRoot, getAuthorizedRoots } from './workspaceAccess.js';

interface ManagedProcess {
  id: string;
  command: string;
  process: ChildProcess;
  startedAt: number;
  webContentsId: number;
  outputBytes: number;
}

const activeProcesses = new Map<string, ManagedProcess>();
const MAX_COMMAND_LENGTH = 20_000;
const MAX_CONCURRENT_PROCESSES_PER_RENDERER = 8;
const MAX_OUTPUT_BYTES_PER_PROCESS = 25 * 1024 * 1024;
const MAX_RUNTIME_MS = 30 * 60 * 1000;

function validateCommand(command: string): string {
  if (typeof command !== 'string' || !command.trim()) throw new Error('Command is required');
  if (command.length > MAX_COMMAND_LENGTH) throw new Error(`Command exceeds ${MAX_COMMAND_LENGTH} characters`);
  return command;
}

export function setupTerminalIPC() {
  ipcMain.handle('terminal:getShells', async () => {
    const platform = os.platform();
    const shells: { name: string; path: string; isDefault: boolean }[] = [];
    if (platform === 'win32') {
      const system32 = process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32') : 'C:\\Windows\\System32';
      const powershell = path.join(system32, 'WindowsPowerShell\\v1.0\\powershell.exe');
      const cmd = path.join(system32, 'cmd.exe');
      if (fs.existsSync(powershell)) shells.push({ name: 'PowerShell', path: powershell, isDefault: true });
      if (fs.existsSync(cmd)) shells.push({ name: 'Command Prompt', path: cmd, isDefault: shells.length === 0 });
      if (fs.existsSync('C:\\Program Files\\Git\\bin\\bash.exe')) shells.push({ name: 'Git Bash', path: 'C:\\Program Files\\Git\\bin\\bash.exe', isDefault: false });
    } else {
      const userShell = process.env.SHELL || '/bin/bash';
      shells.push({ name: path.basename(userShell), path: userShell, isDefault: true });
      if (fs.existsSync('/bin/zsh') && userShell !== '/bin/zsh') shells.push({ name: 'zsh', path: '/bin/zsh', isDefault: false });
      if (fs.existsSync('/bin/bash') && userShell !== '/bin/bash') shells.push({ name: 'bash', path: '/bin/bash', isDefault: false });
    }
    return shells;
  });

  ipcMain.handle('terminal:open', async (event, workingDir?: string) => {
    const cwd = workingDir ? assertWorkspaceRoot(event.sender.id, workingDir) : getAuthorizedRoots(event.sender.id)[0];
    if (!cwd) throw new Error('No authorized workspace. Open a project folder first.');
    if (process.platform === 'win32') {
      const systemRoot = process.env.SystemRoot || 'C:\\Windows';
      const cmd = path.join(systemRoot, 'System32', 'cmd.exe');
      execFile(cmd, ['/d', '/c', 'start', '', cmd], { cwd, windowsHide: true });
    } else if (process.platform === 'darwin') {
      execFile('/usr/bin/open', ['-a', 'Terminal'], { cwd });
    } else {
      const terminal = process.env.TERMINAL || (fs.existsSync('/usr/bin/x-terminal-emulator') ? '/usr/bin/x-terminal-emulator' : fs.existsSync('/usr/bin/gnome-terminal') ? '/usr/bin/gnome-terminal' : '/usr/bin/xterm');
      execFile(terminal, [], { cwd });
    }
    return true;
  });

  ipcMain.handle('terminal:execute', async (event, payload: { command: string; cwd?: string; processId?: string }) => {
    const command = validateCommand(payload?.command);
    const workingDir = payload?.cwd ? assertWorkspaceRoot(event.sender.id, payload.cwd) : getAuthorizedRoots(event.sender.id)[0];
    if (!workingDir) throw new Error('No authorized workspace. Open a project folder first.');
    const rendererCount = [...activeProcesses.values()].filter((item) => item.webContentsId === event.sender.id).length;
    if (rendererCount >= MAX_CONCURRENT_PROCESSES_PER_RENDERER) throw new Error('Too many active terminal processes');

    const procId = payload?.processId || `proc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (activeProcesses.has(procId)) throw new Error('Process ID is already in use');
    const win = BrowserWindow.fromWebContents(event.sender);
    const isWindows = process.platform === 'win32';
    const shellCmd = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellArgs = isWindows ? ['/d', '/s', '/c', command] : ['-c', command];

    return new Promise((resolve) => {
      try {
        const child = spawn(shellCmd, shellArgs, {
          cwd: workingDir,
          env: { ...process.env, FORCE_COLOR: 'true' },
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        const managed: ManagedProcess = {
          id: procId,
          command,
          process: child,
          startedAt: Date.now(),
          webContentsId: event.sender.id,
          outputBytes: 0,
        };
        activeProcesses.set(procId, managed);

        const timeout = setTimeout(() => {
          if (activeProcesses.has(procId)) child.kill();
        }, MAX_RUNTIME_MS);

        const emitOutput = (type: 'stdout' | 'stderr', data: Buffer | string) => {
          const text = data.toString();
          managed.outputBytes += Buffer.byteLength(text);
          if (managed.outputBytes > MAX_OUTPUT_BYTES_PER_PROCESS) {
            child.kill();
            return;
          }
          if (win && !win.isDestroyed()) win.webContents.send('terminal:output', { processId: procId, type, data: text });
        };

        child.stdout?.on('data', (data) => emitOutput('stdout', data));
        child.stderr?.on('data', (data) => emitOutput('stderr', data));
        child.on('close', (code) => {
          clearTimeout(timeout);
          activeProcesses.delete(procId);
          if (win && !win.isDestroyed()) win.webContents.send('terminal:exit', { processId: procId, code: code ?? 1 });
        });
        child.on('error', (err) => {
          clearTimeout(timeout);
          activeProcesses.delete(procId);
          if (win && !win.isDestroyed()) {
            win.webContents.send('terminal:output', { processId: procId, type: 'stderr', data: `Process error: ${err.message}\n` });
            win.webContents.send('terminal:exit', { processId: procId, code: 1 });
          }
        });

        resolve({ processId: procId, status: 'started' });
      } catch (err: any) {
        resolve({ processId: procId, status: 'failed', error: err.message });
      }
    });
  });

  ipcMain.handle('terminal:kill', async (event, processId: string) => {
    const procItem = activeProcesses.get(processId);
    if (!procItem || procItem.webContentsId !== event.sender.id) return false;
    try {
      procItem.process.kill();
      activeProcesses.delete(processId);
      return true;
    } catch (e) {
      console.error('Failed to kill process:', e);
      return false;
    }
  });
}

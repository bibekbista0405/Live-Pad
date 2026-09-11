import { ipcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { assertWorkspacePath, assertWorkspaceRoot } from './workspaceAccess.js';

interface DebugSession {
  id: string;
  process: ChildProcess;
  ws?: WebSocket;
  port: number;
  breakpoints: Array<{ id: string; file: string; line: number; verified: boolean }>;
  paused: boolean;
  webContentsId: number;
}

const activeSessions = new Map<string, DebugSession>();
const MAX_SESSIONS_PER_RENDERER = 4;
const MAX_ARGS = 32;
const MAX_EXPRESSION_LENGTH = 10_000;

function validateArgs(args: unknown): string[] {
  if (!Array.isArray(args) || args.length > MAX_ARGS) throw new Error('Invalid debugger arguments');
  return args.map((arg) => {
    if (typeof arg !== 'string' || arg.length > 4096) throw new Error('Invalid debugger argument');
    return arg;
  });
}

function validateLine(line: number): number {
  if (!Number.isInteger(line) || line < 1 || line > 1_000_000) throw new Error('Invalid breakpoint line');
  return line;
}

export function setupDebuggerIPC() {
  ipcMain.handle('debugger:launch', async (event, payload: { scriptPath: string; cwd?: string; args?: string[] }) => {
    const activeCount = [...activeSessions.values()].filter((s) => s.webContentsId === event.sender.id).length;
    if (activeCount >= MAX_SESSIONS_PER_RENDERER) throw new Error('Too many active debugger sessions');

    const scriptPath = assertWorkspacePath(event.sender.id, payload?.scriptPath);
    if (!fs.statSync(scriptPath).isFile()) throw new Error('Debugger script must be a file');
    const cwd = payload?.cwd ? assertWorkspaceRoot(event.sender.id, payload.cwd) : path.dirname(scriptPath);
    const args = validateArgs(payload?.args || []);
    const sessionId = `debug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const debugPort = 9229 + Math.floor(Math.random() * 500);
    const win = BrowserWindow.fromWebContents(event.sender);

    return new Promise((resolve, reject) => {
      try {
        const child = spawn(process.execPath, [`--inspect-brk=127.0.0.1:${debugPort}`, scriptPath, ...args], {
          cwd,
          env: { ...process.env, FORCE_COLOR: 'true' },
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        const session: DebugSession = { id: sessionId, process: child, port: debugPort, breakpoints: [], paused: true, webContentsId: event.sender.id };
        activeSessions.set(sessionId, session);

        child.stdout?.on('data', (data) => {
          if (win && !win.isDestroyed()) win.webContents.send('debugger:output', { sessionId, type: 'stdout', data: data.toString() });
        });
        child.stderr?.on('data', (data) => {
          const text = data.toString();
          if (win && !win.isDestroyed()) win.webContents.send('debugger:output', { sessionId, type: 'stderr', data: text });
          if (text.includes('Debugger listening on ws://') && !session.ws) {
            const match = text.match(/ws:\/\/(127\.0\.0\.1|localhost):(\d+)\/([a-f0-9-]+)/i);
            if (!match) return;
            setTimeout(() => {
              try {
                const ws = new WebSocket(match[0]);
                session.ws = ws;
                ws.on('open', () => {
                  ws.send(JSON.stringify({ id: 1, method: 'Debugger.enable' }));
                  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
                  if (win && !win.isDestroyed()) win.webContents.send('debugger:event', { sessionId, event: 'connected', port: debugPort });
                });
                ws.on('message', (msg) => {
                  try {
                    const parsed = JSON.parse(msg.toString());
                    if (parsed.method === 'Debugger.paused') {
                      session.paused = true;
                      if (win && !win.isDestroyed()) win.webContents.send('debugger:event', { sessionId, event: 'paused', details: parsed.params });
                    } else if (parsed.method === 'Debugger.resumed') {
                      session.paused = false;
                      if (win && !win.isDestroyed()) win.webContents.send('debugger:event', { sessionId, event: 'resumed' });
                    }
                  } catch { /* ignore malformed inspector messages */ }
                });
                ws.on('error', (error) => console.error('Debugger WebSocket error:', error));
              } catch (error) {
                console.error('Debugger WS connection failed:', error);
              }
            }, 300);
          }
        });
        child.on('close', (code) => {
          session.ws?.close();
          activeSessions.delete(sessionId);
          if (win && !win.isDestroyed()) win.webContents.send('debugger:event', { sessionId, event: 'terminated', exitCode: code });
        });
        child.on('error', (error) => {
          activeSessions.delete(sessionId);
          reject(error);
        });
        resolve({ sessionId, port: debugPort, status: 'launched' });
      } catch (error) {
        reject(error);
      }
    });
  });

  ipcMain.handle('debugger:control', async (event, sessionId: string, action: 'resume' | 'stepOver' | 'stepInto' | 'stepOut' | 'pause' | 'stop') => {
    const session = activeSessions.get(sessionId);
    if (!session || session.webContentsId !== event.sender.id) return false;
    if (action === 'stop') {
      session.ws?.close();
      session.process.kill();
      activeSessions.delete(sessionId);
      return true;
    }
    if (!session.ws || session.ws.readyState !== WebSocket.OPEN) return false;
    const methodMap: Record<string, string> = { resume: 'Debugger.resume', stepOver: 'Debugger.stepOver', stepInto: 'Debugger.stepInto', stepOut: 'Debugger.stepOut', pause: 'Debugger.pause' };
    const method = methodMap[action];
    if (!method) return false;
    session.ws.send(JSON.stringify({ id: Date.now(), method }));
    return true;
  });

  ipcMain.handle('debugger:setBreakpoint', async (event, sessionId: string, file: string, line: number) => {
    const session = activeSessions.get(sessionId);
    if (!session || session.webContentsId !== event.sender.id || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      return { verified: false, id: `bp-${Date.now()}` };
    }
    const safeFile = assertWorkspacePath(event.sender.id, file);
    const safeLine = validateLine(line);
    const reqId = Date.now();
    session.ws.send(JSON.stringify({ id: reqId, method: 'Debugger.setBreakpointByUrl', params: { lineNumber: safeLine - 1, urlRegex: safeFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } }));
    const id = `bp-${safeFile}-${safeLine}`;
    session.breakpoints.push({ id, file: safeFile, line: safeLine, verified: true });
    return { verified: true, id };
  });

  ipcMain.handle('debugger:evaluate', async (event, sessionId: string, expression: string) => {
    const session = activeSessions.get(sessionId);
    if (!session || session.webContentsId !== event.sender.id || !session.ws || session.ws.readyState !== WebSocket.OPEN) return { result: 'Debugger not attached' };
    if (typeof expression !== 'string' || !expression.trim() || expression.length > MAX_EXPRESSION_LENGTH) throw new Error('Invalid debugger expression');
    return new Promise((resolve) => {
      const reqId = Date.now();
      const handler = (msg: WebSocket.RawData) => {
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.id === reqId) {
            session.ws?.off('message', handler);
            resolve(parsed.result?.result?.value ?? parsed.result?.result?.description ?? 'undefined');
          }
        } catch { /* ignore */ }
      };
      session.ws?.on('message', handler);
      session.ws?.send(JSON.stringify({ id: reqId, method: 'Runtime.evaluate', params: { expression } }));
    });
  });
}

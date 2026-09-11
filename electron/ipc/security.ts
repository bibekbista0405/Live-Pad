import { ipcMain, IpcMain, IpcMainInvokeEvent } from 'electron';

const TRUSTED_DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url || '';
  if (url.startsWith('file://')) return true;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && TRUSTED_DEV_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * One central authorization boundary for every ipcMain.handle registration.
 * Individual handlers still validate their own arguments; this prevents an
 * unexpected renderer from invoking privileged main-process APIs at all.
 */
export function installIPCSecurityBoundary() {
  const ipc = ipcMain as IpcMain & { __livepadSecured?: boolean; __livepadOriginalHandle?: IpcMain['handle'] };
  if (ipc.__livepadSecured) return;

  const originalHandle = ipc.handle.bind(ipc);
  ipc.__livepadOriginalHandle = originalHandle;
  ipc.handle = ((channel: string, listener: any) => {
    return originalHandle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      if (!isTrustedSender(event)) {
        throw new Error('IPC request rejected: untrusted renderer');
      }
      return listener(event, ...args);
    });
  }) as IpcMain['handle'];

  ipc.__livepadSecured = true;
}

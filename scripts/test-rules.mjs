import net from 'node:net';
import { spawn } from 'node:child_process';
import process from 'node:process';

const HOST = '127.0.0.1';
const PORT = 8080;
const PROJECT_ID = 'livepad-rules-test';
const firebaseCommand = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';

function waitForPort(host, port, timeoutMs = 30_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const socket = net.createConnection({ host, port });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started >= timeoutMs) {
          reject(new Error(`Firestore emulator did not become ready on ${host}:${port} within ${timeoutMs}ms.`));
          return;
        }
        setTimeout(probe, 250);
      });
    };
    probe();
  });
}

function terminate(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    child.kill('SIGTERM');
  }
}

const emulator = spawn(firebaseCommand, [
  'emulators:start',
  '--only', 'firestore',
  '--project', PROJECT_ID,
], {
  stdio: 'inherit',
  windowsHide: true,
});

let shuttingDown = false;
const cleanup = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  terminate(emulator);
};
process.once('SIGINT', cleanup);
process.once('SIGTERM', cleanup);

try {
  await waitForPort(HOST, PORT);
  const test = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vitest', 'run', 'src/__tests__/firestore.rules.test.ts'],
    {
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: `${HOST}:${PORT}`,
        FIREBASE_PROJECT_ID: PROJECT_ID,
      },
    },
  );

  const exitCode = await new Promise((resolve, reject) => {
    test.once('error', reject);
    test.once('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
  cleanup();
  process.exitCode = exitCode;
} catch (error) {
  cleanup();
  console.error(`[LivePad] Firestore rules test runner failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

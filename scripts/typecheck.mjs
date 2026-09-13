import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

// LivePad contains a large JSX/application graph. Give TypeScript a larger V8
// stack so a finite compiler traversal cannot crash the lint command before
// reporting real type errors. This does not disable type checking or exclusions.
const result = spawnSync(process.execPath, ['--stack-size=16384', tsc, '--noEmit'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(`[typecheck] Failed to start TypeScript: ${result.error.message}`);
  process.exit(1);
}

if (result.signal) {
  console.error(`[typecheck] TypeScript terminated by signal ${result.signal}.`);
  process.exit(1);
}

process.exit(result.status ?? 1);

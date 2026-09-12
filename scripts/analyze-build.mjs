import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

try {
  const paths = await walk(assetsDir);
  const files = await Promise.all(paths.map(async (file) => ({ file, size: (await stat(file)).size })));
  files.sort((a, b) => b.size - a.size);
  const total = files.reduce((sum, item) => sum + item.size, 0);
  console.log(`\nLivePad production asset report`);
  console.log(`Assets: ${files.length}`);
  console.log(`Total raw assets: ${(total / 1024 / 1024).toFixed(2)} MiB\n`);
  for (const item of files.slice(0, 20)) {
    console.log(`${(item.size / 1024).toFixed(1).padStart(9)} KiB  ${path.relative(process.cwd(), item.file)}`);
  }
  const oversized = files.filter((item) => item.size > 1024 * 1024);
  const installTimeHeavy = files.filter((item) => item.size > 2 * 1024 * 1024 && !/(worker-|monaco-vendor-)/.test(path.basename(item.file)));
  if (oversized.length) {
    console.log(`\nWarning: ${oversized.length} asset(s) exceed 1 MiB raw.`);
  }
  if (installTimeHeavy.length) {
    console.log(`Warning: ${installTimeHeavy.length} non-Monaco/non-worker asset(s) exceed 2 MiB raw.`);
  } else {
    console.log('Install-time heavy asset check: PASS (large Monaco/worker assets are intentionally runtime-loaded).');
  }
} catch (error) {
  console.error('Build analysis failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

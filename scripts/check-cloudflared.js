import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const local = path.join(root, 'bin', process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
const candidates = fs.existsSync(local) ? [local] : [];
candidates.push(process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');

for (const candidate of candidates) {
  const result = spawnSync(candidate, ['--version'], { encoding: 'utf8', windowsHide: true });
  if (result.status === 0) {
    console.log(`[Cloudflare] OK: ${String(result.stdout || result.stderr || '').trim()}`);
    process.exit(0);
  }
}

console.error('[Cloudflare] cloudflared no está instalado. Ejecuta npm run cloudflare:install.');
process.exit(1);

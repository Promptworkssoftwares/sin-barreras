import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const releaseName = `sin-barreras-v${pkg.version}`;
const tempRoot = path.join(root, '.release-tmp');
const stage = path.join(tempRoot, releaseName);
const dist = path.join(root, 'dist');
const zipPath = path.join(dist, `${releaseName}-release.zip`);

const forbiddenNames = new Set([
  '.env', '.git', 'node_modules', 'dist', '.release-tmp',
  'keystore.properties', 'google-services.json'
]);
const forbiddenPatterns = [
  /^\.env\./i,
  /\.(?:jks|keystore|p12|pfx|pem|key)$/i,
  /^service-account.*\.json$/i,
  /^credentials.*\.json$/i,
  /^secrets.*\.json$/i
];

function excluded(source) {
  const name = path.basename(source);
  if (name === '.env.example') return false;
  if (forbiddenNames.has(name)) return true;
  return forbiddenPatterns.some((pattern) => pattern.test(name));
}

function auditStage(dir) {
  const bad = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (excluded(full)) bad.push(path.relative(dir, full));
    }
  }
  if (bad.length) throw new Error(`Release bloqueado: archivos sensibles encontrados: ${bad.join(', ')}`);
}

fs.rmSync(tempRoot, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
fs.mkdirSync(dist, { recursive: true });
fs.rmSync(zipPath, { force: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  const source = path.join(root, entry.name);
  if (excluded(source)) continue;
  fs.cpSync(source, path.join(stage, entry.name), {
    recursive: true,
    filter: (item) => !excluded(item)
  });
}

auditStage(stage);

if (process.platform === 'win32') {
  const psPath = zipPath.replace(/'/g, "''");
  const sourcePath = stage.replace(/'/g, "''");
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path '${sourcePath}' -DestinationPath '${psPath}' -Force`], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
} else {
  const result = spawnSync('zip', ['-qr', zipPath, releaseName], { cwd: tempRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

fs.rmSync(tempRoot, { recursive: true, force: true });
console.log(`[RELEASE] OK: ${path.relative(root, zipPath)}`);
console.log('[RELEASE] Verified exclusions: .env, .git, node_modules, keystores, private keys, service-account files.');

import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const binDir = path.join(root, 'bin');

function targetInfo() {
  if (process.platform === 'win32') {
    return {
      filename: 'cloudflared.exe',
      asset: process.arch === 'arm64' ? 'cloudflared-windows-arm64.exe' : 'cloudflared-windows-amd64.exe'
    };
  }
  if (process.platform === 'linux') {
    return {
      filename: 'cloudflared',
      asset: process.arch === 'arm64' ? 'cloudflared-linux-arm64' : 'cloudflared-linux-amd64'
    };
  }
  throw new Error('Instalación automática de cloudflared disponible para Windows y Linux. Instálalo manualmente en este sistema.');
}

function download(url, destination, redirects = 0) {
  if (redirects > 6) return Promise.reject(new Error('Demasiadas redirecciones al descargar cloudflared.'));
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'Sin-Barreras-Installer/1.6.2' } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        const next = new URL(response.headers.location, url).toString();
        resolve(download(next, destination, redirects + 1));
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Cloudflare respondió HTTP ${response.statusCode}.`));
        return;
      }
      const file = fs.createWriteStream(destination);
      response.pipe(file);
      file.once('finish', () => file.close(resolve));
      file.once('error', reject);
    });
    request.setTimeout(60_000, () => request.destroy(new Error('Timeout descargando cloudflared.')));
    request.once('error', reject);
  });
}

try {
  const { filename, asset } = targetInfo();
  fs.mkdirSync(binDir, { recursive: true });
  const target = path.join(binDir, filename);
  const temp = `${target}.download`;
  fs.rmSync(temp, { force: true });

  if (fs.existsSync(target)) {
    const probe = spawnSync(target, ['--version'], { encoding: 'utf8', windowsHide: true });
    if (probe.status === 0) {
      console.log(`[Cloudflare] OK: ${String(probe.stdout || probe.stderr || '').trim()}`);
      process.exit(0);
    }
    fs.rmSync(target, { force: true });
  }

  const url = `https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`;
  console.log(`[Cloudflare] Descargando binario oficial: ${asset}`);
  await download(url, temp);
  fs.renameSync(temp, target);
  if (process.platform !== 'win32') fs.chmodSync(target, 0o755);

  const probe = spawnSync(target, ['--version'], { encoding: 'utf8', windowsHide: true });
  if (probe.status !== 0) throw new Error(String(probe.stderr || 'cloudflared no pudo ejecutarse después de instalarse.'));
  console.log(`[Cloudflare] Instalado correctamente en ${path.relative(root, target)}`);
  console.log(`[Cloudflare] ${String(probe.stdout || probe.stderr || '').trim()}`);
} catch (error) {
  console.error(`[Cloudflare] ERROR: ${error.message}`);
  process.exit(1);
}

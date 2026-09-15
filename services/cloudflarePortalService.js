import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const DEFAULT_TIMEOUT_MS = 25_000;
let tunnelProcess = null;
let tunnelUrl = '';
let tunnelPromise = null;
let hooksInstalled = false;

function trimUrl(value = '') {
  return String(value || '').trim().replace(/\/$/, '');
}

function parsedUrl(value = '') {
  try { return new URL(value); }
  catch { return null; }
}

export function isPublicPortalUrl(value = '') {
  const parsed = parsedUrl(value);
  const host = parsed?.hostname?.toLowerCase() || '';
  if (!host || parsed.protocol !== 'https:') return false;
  if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host === '[::1]') return false;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false;
  const match172 = host.match(/^172\.(\d{1,3})\./);
  if (match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31) return false;
  if (host.endsWith('.local')) return false;
  return true;
}

function requestOrigin(request) {
  return trimUrl(`${request.protocol}://${request.get('host')}`);
}

function resolveCloudflaredBinary() {
  const configured = String(process.env.CLOUDFLARED_PATH || '').trim();
  const candidates = [
    configured,
    process.platform === 'win32' ? path.join(projectRoot, 'bin', 'cloudflared.exe') : path.join(projectRoot, 'bin', 'cloudflared')
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  const command = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  const probe = spawnSync(command, ['--version'], { stdio: 'ignore', windowsHide: true });
  if (probe.status === 0) return command;
  return '';
}

function installExitHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  const stop = () => {
    try { tunnelProcess?.kill(); } catch { /* noop */ }
    tunnelProcess = null;
    tunnelUrl = '';
    tunnelPromise = null;
  };
  process.once('exit', stop);
  process.once('SIGINT', () => { stop(); process.exit(130); });
  process.once('SIGTERM', () => { stop(); process.exit(143); });
}

export async function ensureCloudflareQuickTunnel({ port = Number(process.env.PORT || 3000) } = {}) {
  if (tunnelUrl && tunnelProcess && !tunnelProcess.killed) return tunnelUrl;
  if (tunnelPromise) return tunnelPromise;

  const executable = resolveCloudflaredBinary();
  if (!executable) {
    const error = new Error('El portal QR público necesita cloudflared. Ejecuta install.bat o npm run cloudflare:install y vuelve a intentar.');
    error.statusCode = 503;
    throw error;
  }

  tunnelPromise = new Promise((resolve, reject) => {
    const localUrl = `http://127.0.0.1:${port}`;
    const child = spawn(executable, ['tunnel', '--url', localUrl], {
      cwd: projectRoot,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    tunnelProcess = child;
    installExitHooks();

    let settled = false;
    let output = '';
    const timer = setTimeout(() => {
      fail('Cloudflare tardó demasiado en crear el portal QR público. Revisa tu conexión e intenta de nuevo.');
    }, DEFAULT_TIMEOUT_MS);
    timer.unref?.();

    function fail(message) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      tunnelPromise = null;
      try { child.kill(); } catch { /* noop */ }
      tunnelProcess = null;
      const error = new Error(message);
      error.statusCode = 503;
      reject(error);
    }

    function inspect(chunk) {
      const text = String(chunk || '');
      output = `${output}${text}`.slice(-16_000);
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (!match || settled) return;
      settled = true;
      clearTimeout(timer);
      tunnelUrl = trimUrl(match[0]);
      console.log(`[Cloudflare] Portal QR público listo: ${tunnelUrl}`);
      resolve(tunnelUrl);
    }

    child.stdout?.on('data', inspect);
    child.stderr?.on('data', inspect);
    child.once('error', (error) => fail(`No se pudo iniciar cloudflared: ${error.message}`));
    child.once('exit', (code) => {
      clearTimeout(timer);
      const hadUrl = Boolean(tunnelUrl);
      tunnelProcess = null;
      tunnelPromise = null;
      tunnelUrl = '';
      if (!settled) fail(`cloudflared se cerró antes de crear el portal público (código ${code ?? 'desconocido'}).`);
      else if (hadUrl) console.warn('[Cloudflare] El portal QR público se desconectó. Se creará uno nuevo al iniciar otra sala.');
    });
  });

  return tunnelPromise;
}

export async function resolveQrPortalBaseUrl(request) {
  const explicit = trimUrl(process.env.QR_PUBLIC_URL || '');
  if (explicit) {
    if (!isPublicPortalUrl(explicit)) {
      const error = new Error('QR_PUBLIC_URL debe ser una URL pública HTTPS accesible desde otro teléfono.');
      error.statusCode = 500;
      throw error;
    }
    return explicit;
  }

  const incoming = requestOrigin(request);
  if (isPublicPortalUrl(incoming)) return incoming;

  const appUrl = trimUrl(process.env.APP_URL || '');
  if (isPublicPortalUrl(appUrl)) return appUrl;

  if (String(process.env.CLOUDFLARE_TUNNEL_ENABLED || 'true').toLowerCase() === 'false') {
    const error = new Error('El portal QR público está desactivado. Activa CLOUDFLARE_TUNNEL_ENABLED o configura QR_PUBLIC_URL.');
    error.statusCode = 503;
    throw error;
  }

  return ensureCloudflareQuickTunnel({ port: Number(process.env.PORT || 3000) });
}

export function currentCloudflarePortalUrl() {
  return tunnelUrl;
}

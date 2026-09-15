import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const portal = read('services/cloudflarePortalService.js');
const installer = read('scripts/install-cloudflared.js');
const checker = read('scripts/check-cloudflared.js');
const routes = read('routes/conversationRoutes.js');
const server = read('server/server.js');
const roomService = read('services/conversationRoomService.js');
const host = read('public/qr-conversation.js');
const guest = read('public/js/join-conversation.js');
const envExample = read('.env.example');
const packageJson = JSON.parse(read('package.json'));
const installBat = read('install.bat');
const startBat = read('start.bat');
const packager = read('scripts/package-release.js');

test('v1.5.3 starts an HTTPS Cloudflare Quick Tunnel automatically for local QR rooms', () => {
  assert.match(portal, /cloudflared/);
  assert.ok(portal.includes("['tunnel', '--url', localUrl]"));
  assert.ok(portal.includes('trycloudflare\\.com'));
  assert.match(portal, /resolveQrPortalBaseUrl/);
  assert.ok(routes.includes('await resolveQrPortalBaseUrl(request)'));
  assert.ok(routes.includes('baseUrl });'));
  assert.match(envExample, /CLOUDFLARE_TUNNEL_ENABLED=true/);
  assert.match(envExample, /QR_PUBLIC_URL=/);
});

test('cloudflared can be installed from npm or BAT without shipping the executable in releases', () => {
  assert.equal(packageJson.scripts['cloudflare:install'], 'node scripts/install-cloudflared.js');
  assert.equal(packageJson.scripts['cloudflare:check'], 'node scripts/check-cloudflared.js');
  assert.ok(installer.includes('github.com/cloudflare/cloudflared/releases/latest/download'));
  assert.match(checker, /cloudflared/);
  assert.match(installBat, /npm run cloudflare:install/);
  assert.match(startBat, /npm run cloudflare:check/);
  assert.match(packager, /cloudflared/);
});

test('QR synchronization is compatible with Quick Tunnels and no longer depends on SSE', () => {
  assert.ok(server.includes("/api/public/conversations/:code/sync"));
  assert.ok(server.includes('getRoomEvents(room.code, request.query.after)'));
  assert.match(roomService, /eventLogs = new Map\(\)/);
  assert.match(roomService, /MAX_EVENT_LOG = 80/);
  assert.ok(host.includes('setInterval(syncRoom, 1200)'));
  assert.ok(guest.includes('setInterval(syncRoom, 1200)'));
  assert.doesNotMatch(host, /EventSource/);
  assert.doesNotMatch(guest, /EventSource/);
  assert.doesNotMatch(server, /text\/event-stream/);
  assert.ok(roomService.includes('/join/${code}#token='));
  assert.ok(host.includes("'X-SB-Conversation-Token': room.hostToken"));
  assert.ok(guest.includes("location.hash.replace(/^#/, '')"));
  assert.ok(guest.includes("'X-SB-Conversation-Token': token"));
});

test('same-origin requests coming through the Cloudflare hostname remain allowed without wildcard CORS', () => {
  assert.ok(server.includes('origin === sameOrigin'));
  assert.ok(server.includes('configuredOrigins.includes(origin)'));
  assert.doesNotMatch(envExample, /ALLOWED_ORIGINS=\*/);
  assert.ok(server.includes("hostname.endsWith('.trycloudflare.com')"));
  assert.ok(server.includes("pathname.startsWith('/join/')"));
  assert.ok(server.includes("pathname.startsWith('/api/public/conversations/')"));
});

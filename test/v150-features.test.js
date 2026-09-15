import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const appHtml = read('private/app.html');
const appJs = read('public/app.js');
const styles = read('public/styles.css');
const phrasebook = read('public/phrasebook.js');
const offlineHtml = read('public/offline-phrases.html');
const offlineJs = read('public/js/offline-phrases.js');
const cloud = read('public/cloud.js');
const stateModel = read('models/UserState.js');
const accountRoutes = read('routes/accountRoutes.js');
const roomModel = read('models/ConversationRoom.js');
const roomService = read('services/conversationRoomService.js');
const roomRoutes = read('routes/conversationRoutes.js');
const roomHostJs = read('public/qr-conversation.js');
const roomGuestHtml = read('public/join-conversation.html');
const roomGuestJs = read('public/js/join-conversation.js');
const server = read('server/server.js');
const sw = read('public/sw.js');

test('v1.5 Face-to-Face is a real two-person conversation surface', () => {
  assert.match(appHtml, /id="open-face-to-face"/);
  assert.match(appHtml, /id="face-to-face-view"/);
  assert.match(appHtml, /id="face-partner-text"/);
  assert.match(appHtml, /id="face-user-text"/);
  assert.match(appHtml, /id="face-toggle-listening"/);
  assert.match(appJs, /function openFaceToFace\(\)/);
  assert.match(appJs, /function renderFaceToFace\(result\)/);
  assert.match(appJs, /state\.faceToFace/);
  assert.match(appJs, /Pausa la conversación antes de repetir el audio/);
  assert.match(styles, /\.face-to-face-view/);
});

test('v1.5 can learn and practice English from real conversation history', () => {
  assert.match(appHtml, /data-learn-path="conversations"/);
  assert.match(appHtml, /id="learn-conversations-branch"/);
  assert.match(appHtml, /id="conversation-learning-list"/);
  assert.match(appJs, /function conversationLearningCandidates\(\)/);
  assert.match(appJs, /function renderConversationLearning\(\)/);
  assert.match(appJs, /function preparePhraseForPractice\(item\)/);
  assert.match(appJs, /count: \(previous\?\.count \|\| 0\) \+ 1/);
  assert.match(appJs, /openLearnPath\(path\)/);
});

test('v1.5 phrasebook syncs metadata while audio stays device-local for offline playback', () => {
  assert.match(appHtml, /id="open-phrasebook"/);
  assert.match(appHtml, /id="phrasebook-view"/);
  assert.match(appHtml, /id="save-current-translation"/);
  assert.match(stateModel, /phrasebook:/);
  assert.match(accountRoutes, /sanitizePhrasebook/);
  assert.match(cloud, /sinBarreras\.phrasebook\.v1/);
  assert.match(phrasebook, /sin-barreras-phrase-audio-v1/);
  assert.match(phrasebook, /caches\.open\(AUDIO_CACHE\)/);
  assert.match(phrasebook, /navigator\.onLine/);
  assert.doesNotMatch(cloud, /audioBase64\s*:/);
  assert.match(offlineHtml, /Frases offline|Mis frases/i);
  assert.match(offlineJs, /sinBarreras\.phrasebook\.v1/);
  assert.match(sw, /offline-phrases\.html/);
  assert.match(sw, /url\.pathname === '\/app'/);
});

test('v1.5 QR conversation uses expiring hashed invitation tokens and a public guest page', () => {
  assert.match(appHtml, /id="open-qr-conversation"/);
  assert.match(appHtml, /id="qr-conversation-dialog"/);
  assert.match(appHtml, /qrcodejs@1\.0\.0\/qrcode\.min\.js/);
  assert.match(roomModel, /hostTokenHash/);
  assert.match(roomModel, /guestTokenHash/);
  assert.match(roomModel, /expireAfterSeconds: 0/);
  assert.match(roomService, /crypto\.randomBytes\(24\)/);
  assert.match(roomService, /crypto\.createHash\('sha256'\)/);
  assert.match(roomService, /crypto\.timingSafeEqual/);
  assert.match(roomRoutes, /router\.post\('\/conversations', requireAccess/);
  assert.match(roomRoutes, /joinUrl/);
  assert.match(server, /app\.get\('\/join\/:code'/);
  assert.match(roomGuestHtml, /id="room-talk"/);
  assert.match(roomGuestJs, /EventSource/);
  assert.match(roomGuestJs, /createAutoVoiceTurn/);
  assert.match(roomHostJs, /new EventSource/);
  assert.match(roomHostJs, /new window\.QRCode/);
});

test('QR audio access is constrained by room token and the host subscriber entitlement', () => {
  assert.match(server, /QR_CONVERSATION_RATE_LIMIT \|\| 90/);
  assert.match(server, /authorizeConversationRoom\(\{ code: request\.params\.code, role, token: request\.body\?\.token \}\)/);
  assert.match(server, /User\.findById\(room\.hostUser\)/);
  assert.match(server, /!host\.hasAppAccess\(\)/);
  assert.match(server, /runWithAiUsage\(host\._id, 'qr_conversation'/);
  assert.match(server, /emitRoomEvent\(room\.code, 'turn', result\)/);
  assert.match(server, /Content-Type': 'text\/event-stream'/);
  assert.match(sw, /'\/join\/'/);
});

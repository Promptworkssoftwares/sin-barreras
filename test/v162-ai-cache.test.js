import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('v1.6.2 uses a private per-account AI cache with TTL', () => {
  const model = read('models/AiCacheEntry.js');
  const service = read('services/aiCacheService.js');
  assert.match(model, /user:\s*\{[^}]*required:\s*true/);
  assert.match(model, /kind:[\s\S]*translation[\s\S]*tts[\s\S]*phrase_lesson[\s\S]*practice_evaluation/);
  assert.match(model, /\{ expiresAt: 1 \}, \{ expireAfterSeconds: 0 \}/);
  assert.match(model, /\{ user: 1, kind: 1, keyHash: 1 \}, \{ unique: true \}/);
  assert.match(service, /createHash\('sha256'\)/);
  assert.match(service, /AI_CACHE_TRANSLATION_DAYS/);
  assert.match(service, /AI_CACHE_TTS_DAYS/);
  assert.match(service, /AI_CACHE_ENABLED/);
});

test('translation, study generation, lessons and TTS reuse cache before OpenAI', () => {
  const server = read('server/server.js');
  assert.match(server, /getAiCache\(\{ userId, kind: 'translation'/);
  assert.match(server, /setAiCache\(\{ userId, kind: 'translation'/);
  assert.match(server, /kind: 'practice_generation'/);
  assert.match(server, /kind: 'phrase_lesson'/);
  assert.match(server, /kind: 'tts'/);
  assert.match(server, /AI_CACHE_TTS_MAX_CHARS/);
});

test('pronunciation scoring bypasses chat only for high-confidence repeats and caches AI evaluations', () => {
  const server = read('server/server.js');
  assert.match(server, /fallbackScore >= 96/);
  assert.match(server, /local_high_confidence/);
  assert.match(server, /kind: 'practice_evaluation'/);
  assert.match(server, /evaluationMode: 'ai'/);
  assert.match(server, /evaluationMode: 'cache'/);
});

test('browser TTS cache avoids repeat network generation and survives PWA shell updates', () => {
  const tts = read('public/tts-cache.js');
  const app = read('public/app.js');
  const sw = read('public/sw.js');
  assert.match(tts, /sin-barreras-tts-v1/);
  assert.match(tts, /getOrCreateTts/);
  assert.match(app, /getOrCreateTts/);
  assert.match(sw, /key\.startsWith\('sin-barreras-v'\)/);
  assert.doesNotMatch(sw, /keys\.filter\(\(key\) => key !== CACHE\)/);
});

test('account deletion removes AI cache and privacy policy discloses temporary cache', () => {
  const account = read('services/accountService.js');
  const privacy = read('public/privacy.html');
  assert.match(account, /AiCacheEntry\.deleteMany\(\{ user: user\._id \}\)/);
  assert.match(privacy, /Cache privado para reducir uso de IA/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('v1.7.6 Coach exposes native and target language using the full app language catalog', () => {
  const html = text('private/app.html');
  const app = text('public/app.js');
  assert.match(html, /id="coach-language"/);
  assert.match(html, /id="coach-target-language"/);
  assert.match(app, /ui\.coachLanguage, ui\.coachTargetLanguage/);
  assert.match(app, /LANGUAGE_CATALOG/);
  assert.match(app, /targetLanguage: currentCoachTargetLanguage\(\)/);
  assert.match(app, /speakText\(firstReply, currentCoachTargetLanguage\(\)/);
});

test('v1.7.6 Coach backend never hardcodes English as the learning language', () => {
  const server = text('server/server.js');
  assert.match(server, /coachStart = async \(\{ scenario, nativeLanguage, targetLanguage = 'en'/);
  assert.match(server, /learner is a \$\{nativeName\} speaker learning \$\{targetName\}/);
  assert.match(server, /EVERY line the learner practices/);
  assert.match(server, /"replyTarget"/);
  assert.match(server, /"correctedTarget"/);
  assert.match(server, /nativeLanguage === targetLanguage/);
});

test('v1.7.6 practice and Coach use compact mobile feedback and live audio visual states', () => {
  const html = text('private/app.html');
  const css = text('public/styles.css');
  const app = text('public/app.js');
  assert.match(html, /id="practice-voice-signal"/);
  assert.match(html, /id="practice-conversation-voice-signal"/);
  assert.match(html, /id="coach-voice-signal"/);
  assert.match(html, /id="phrase-practice-voice-signal"/);
  assert.match(css, /\.voice-input-signal\[data-state="listening"\]/);
  assert.match(css, /data-reactive=\"true\"/);
  assert.match(css, /@keyframes sbVoiceBar/);
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(app, /setVoiceSignal\(ui\.practiceVoiceSignal, 'listening', '', detail\)/);
  assert.match(app, /rawVolume \* 12/);
  assert.match(app, /setVoiceSignal\(ui\.coachVoiceSignal, 'processing'\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const text = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('v1.6.2 exposes a public privacy policy and terms page', () => {
  assert.ok(existsSync(new URL('../public/privacy.html', import.meta.url)));
  assert.ok(existsSync(new URL('../public/terms.html', import.meta.url)));
});

test('local registration requires adult confirmation and legal acceptance', () => {
  assert.match(text('public/index.html'), /register-terms/);
  assert.match(text('routes/authRoutes.js'), /ageConfirmed/);
  assert.match(text('routes/authRoutes.js'), /termsAccepted/);
});

test('account deletion remains public and available inside the app', () => {
  assert.ok(existsSync(new URL('../public/account-deletion.html', import.meta.url)));
  assert.match(text('private/app.html'), /account-delete/);
});

test('AI content can be reported in-app and reviewed by owner', () => {
  assert.match(text('routes/accountRoutes.js'), /reports\/ai/);
  assert.match(text('private/admin.html'), /reports-section/);
  assert.match(text('routes/adminRoutes.js'), /reports\/ai/);
});

test('QR conversations require host and guest terms acceptance', () => {
  assert.match(text('private/app.html'), /qr-host-terms/);
  assert.match(text('public/join-conversation.html'), /room-terms/);
  assert.match(text('routes/conversationRoutes.js'), /\/accept/);
});

test('QR conversations provide reporting and blocking controls', () => {
  assert.match(text('public/join-conversation.html'), /room-report-user/);
  assert.match(text('public/join-conversation.html'), /room-block-user/);
  assert.match(text('routes/conversationRoutes.js'), /\/block/);
});

test('QR safety reports are reviewable by owner', () => {
  assert.match(text('private/admin.html'), /conversation-reports-section/);
  assert.match(text('routes/adminRoutes.js'), /reports\/conversations/);
});

test('microphone and camera use has an in-app prominent disclosure', () => {
  assert.match(text('private/app.html'), /data-use-dialog/);
  assert.match(text('public/compliance-ui.js'), /Micrófono|data-use/);
});

test('Android does not force portrait orientation and cleartext remains disabled', () => {
  const manifest = text('android/app/src/main/AndroidManifest.xml');
  assert.doesNotMatch(manifest, /screenOrientation="portrait"/);
  assert.match(manifest, /usesCleartextTraffic="false"/);
});

test('Android only declares microphone and camera media permissions that are needed', () => {
  const manifest = text('android/app/src/main/AndroidManifest.xml');
  assert.match(manifest, /RECORD_AUDIO/);
  assert.match(manifest, /CAMERA/);
  assert.match(manifest, /MODIFY_AUDIO_SETTINGS/);
});

test('reviewer account can be seeded without hardcoded credentials', () => {
  assert.match(text('package.json'), /seed:reviewer/);
  assert.match(text('scripts/seed-reviewer.js'), /REVIEWER_EMAIL/);
  assert.match(text('.env.example'), /REVIEWER_PASSWORD=/);
});

test('Play Console submission and Data Safety guides ship with the release', () => {
  assert.ok(existsSync(new URL('../PLAY_CONSOLE_SUBMISSION.md', import.meta.url)));
  assert.ok(existsSync(new URL('../GOOGLE_PLAY_DATA_SAFETY.md', import.meta.url)));
});

test('v1.6.6 release metadata is aligned across Node, PWA and Android', () => {
  assert.match(text('package.json'), /"version": "1\.6\.6"/);
  assert.match(text('public/sw.js'), /sin-barreras-v1\.6\.6/);
  assert.match(text('android/app/build.gradle'), /versionCode = 1606/);
  assert.match(text('android/app/build.gradle'), /versionName = '1\.6\.6'/);
});

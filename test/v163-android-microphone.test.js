import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('Android WebView microphone has Chromium audio-routing permission and web retry fallback', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  const activity = read('android/app/src/main/java/com/promptworks/sinbarreras/MainActivity.java');
  const microphone = read('public/microphone.js');
  const app = read('public/app.js');
  const voiceTurn = read('public/voice-turn.js');

  assert.match(manifest, /android\.permission\.RECORD_AUDIO/);
  assert.match(manifest, /android\.permission\.MODIFY_AUDIO_SETTINGS/);
  assert.match(activity, /RESOURCE_AUDIO_CAPTURE/);
  assert.match(activity, /requestPermissions/);
  assert.match(microphone, /NotReadableError/);
  assert.match(microphone, /getUserMedia\(\{ audio: true, video: false \}\)/);
  assert.match(app, /getMicrophoneStream/);
  assert.match(voiceTurn, /getMicrophoneStream/);
});

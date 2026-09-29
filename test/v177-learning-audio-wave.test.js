import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const wave = read('public/learning-audio-wave.js');
const css = read('public/styles.css');
const app = read('public/app.js');
const learn = read('public/learn.js');
const sounds = read('public/sounds.js');
const phrases = read('public/phrase-practice.js');
const phrasebook = read('public/phrasebook.js');
const sw = read('public/sw.js');

test('v1.7.8 ships a dedicated dual-voice learning waveform', () => {
  assert.match(wave, /BAR_COUNT = 15/);
  assert.match(wave, /VOZ AI/);
  assert.match(wave, /TU VOZ/);
  assert.match(wave, /detail\.volume|numericLevel/);
  assert.match(css, /Futuristic dual-voice waveform for Aprender/);
  assert.match(css, /learning-wave-track\[data-wave-role="user"\]/);
});

test('AI audio in Learn words, lessons, quick phrases and saved phrases uses the waveform', () => {
  assert.match(learn, /visualTarget: button/);
  assert.match(learn, /visualTarget: ui\.listen/);
  assert.match(app, /visualTarget:ui\.listenPractice/);
  assert.match(app, /data-learning-action/);
  assert.match(phrasebook, /withLearningAudioWave/);
  assert.match(phrases, /visualTarget, visualLabel:'VOZ AI'/);
});

test('user pronunciation practice feeds real microphone level into the waveform', () => {
  assert.match(learn, /level:detail\.volume/);
  assert.match(sounds, /level:detail\.volume/);
  assert.match(phrases, /level:detail\.volume/);
  assert.match(app, /setLearningAudioWave\(element/);
});

test('sound lab distinguishes AI model audio from the learner recording', () => {
  assert.match(sounds, /visualLabel:'VOZ MODELO'/);
  assert.match(sounds, /playMyRecording\(button\)/);
  assert.match(sounds, /role:'user', state:'playing'/);
});

test('PWA release caches the learning waveform module for installed app use', () => {
  assert.match(sw, /learning-audio-wave\.js\?v=1\.7\.10/);
});

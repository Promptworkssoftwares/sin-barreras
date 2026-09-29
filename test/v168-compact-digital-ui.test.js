import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('private/app.html');
const css = read('public/styles.css');
const js = read('public/app.js');
const sounds = read('public/sounds.js');
const phrase = read('public/phrase-practice.js');

test('v1.7.2 Hablar is compact and keeps quick actions horizontal', () => {
  assert.match(app, /<h1>Habla\. Entiende\. <em>Sigue adelante\.<\/em><\/h1>/);
  assert.doesNotMatch(app, /Habla\. Entiende\.<br/);
  for (const id of ['open-face-to-face','open-phrasebook','open-qr-conversation']) assert.match(app, new RegExp(`id="${id}"`));
  assert.match(css, /conversation-tools\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:560px\)[\s\S]*conversation-tools\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
});

test('v1.7.2 learning surfaces use graphical pronunciation meters without changing scoring endpoints', () => {
  assert.match(app, /id="practice-score-meter" class="pronunciation-gauge"/);
  assert.match(app, /id="phrase-practice-score-meter" class="pronunciation-gauge compact"/);
  assert.match(css, /\.pronunciation-gauge\{/);
  assert.match(css, /conic-gradient/);
  assert.match(js, /practiceScoreMeter\.style\.setProperty\('--score'/);
  assert.match(phrase, /scoreMeter\.style\.setProperty\('--score'/);
  assert.match(sounds, /pronunciation-gauge compact/);
  assert.match(sounds, /friendlyRecognition\(result\)/);
});

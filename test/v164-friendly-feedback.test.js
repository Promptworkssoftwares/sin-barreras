import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { friendlyRecognition, friendlyDifference, hasNonLatinLetters } from '../public/learner-feedback.js';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('non-Latin Whisper transcripts are not exposed as the primary learner explanation', () => {
  const raw = '你好，我迷路了';
  assert.equal(hasNonLatinLetters(raw), true);
  const friendly = friendlyRecognition({
    heardText: raw,
    heardMeaning: 'Hola, estoy perdido.',
    heardPronunciation: 'ni hao, wo mi lu le'
  });
  assert.match(friendly, /Hola, estoy perdido/);
  assert.match(friendly, /ni hao/);
  assert.doesNotMatch(friendly, /你好/);

  const fallback = friendlyRecognition({ heardText: raw });
  assert.doesNotMatch(fallback, /你好/);
});

test('practice evaluator returns meaning, readable pronunciation and concrete difference in support language', () => {
  const server = read('server/server.js');
  assert.match(server, /"heardMeaning"/);
  assert.match(server, /"heardPronunciation"/);
  assert.match(server, /"difference"/);
  assert.match(server, /NO IPA and NO characters from a non-Latin target script/);
  assert.match(server, /learner-feedback-v2/);
});

test('all pronunciation practice surfaces use the learner-friendly feedback layer', () => {
  const app = read('public/app.js');
  const phrase = read('public/phrase-practice.js');
  const html = read('private/app.html');
  const sw = read('public/sw.js');

  assert.match(app, /friendlyRecognition\(result\)/);
  assert.match(app, /friendlyDifference\(result\)/);
  assert.match(phrase, /friendlyRecognition\(result\)/);
  assert.match(phrase, /friendlyFocus\(result\)/);
  assert.match(html, /LO QUE LA APP ENTENDIÓ · EN TU IDIOMA/);
  assert.match(html, /FRASE MODELO CORRECTA/);
  assert.match(sw, /learner-feedback\.js/);
});

test('difference combines useful correction without losing encouraging feedback', () => {
  const text = friendlyDifference({ feedback: 'Buen intento.', difference: 'Faltó una palabra importante.' });
  assert.match(text, /Buen intento/);
  assert.match(text, /Faltó una palabra/);
});

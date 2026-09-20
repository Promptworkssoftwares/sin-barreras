import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const appHtml = read('private/app.html');
const appJs = read('public/app.js');
const server = read('server/server.js');
const styles = read('public/styles.css');

test('Practice is multilingual from UI through generation, TTS, and scoring', () => {
  assert.match(appHtml, /PRÁCTICA MULTILENGUAJE/);
  assert.match(appHtml, /id="practice-target-language"/);
  assert.match(appHtml, /Idioma que quiero practicar/);
  assert.match(appJs, /populatePracticeLanguageSelects/);
  assert.match(appJs, /LANGUAGE_CATALOG[\s\S]{0,500}practiceTargetLanguage/);
  assert.match(appJs, /targetLanguage[\s\S]{0,500}\/api\/practice/);
  assert.match(appJs, /form\.append\('targetLanguage'/);
  assert.match(appJs, /speakText\(state\.practice\.targetText \|\| state\.practice\.english, state\.practice\.targetLanguage \|\| 'en'\)/);
  assert.match(server, /practicePhrase = async \(phrase, nativeLanguage, targetLanguage = 'en'/);
  assert.match(server, /targetText and alternative MUST be in \$\{targetName\}/);
  assert.match(server, /evaluatePractice = async \(\{ targetText, heardText, originalIntent, nativeLanguage, targetLanguage = 'en', userId = null \}\)/);
  assert.match(server, /You evaluate a learner speaking \$\{targetName\}/);
  assert.match(styles, /\.practice-form-row\.four/);
});

test('Practice similarity normalization supports non-Latin scripts', () => {
  assert.match(server, /normalize\('NFKC'\)/);
  assert.match(server, /\\p\{L\}/);
  assert.match(server, /\\p\{M\}/);
  assert.match(server, /\\p\{N\}/);
});

test('Beginner Coach is an absolute beginner experience instead of shortened intermediate English', () => {
  assert.match(appHtml, /Principiante · empezando desde cero/);
  assert.match(appHtml, /frases muy cortas, traducción visible y ayuda para responder/);
  assert.match(server, /ABSOLUTE BEGINNER MODE \(pre-A1\/A1\)/);
  assert.match(server, /replyEnglish must be ONE very short line of 2-6 words/);
  assert.match(server, /ABSOLUTE BEGINNER MODE OVERRIDES ALL OTHER COMPLEXITY SETTINGS/);
  assert.match(server, /replyEnglish must be 2-7 words/);
  assert.match(server, /Accept one-word or very short learner answers as valid/);
  assert.match(server, /beginnerHelp/);
  assert.match(appJs, /coach-beginner-meaning/);
  assert.match(appJs, /result\.beginnerHelp/);
  assert.match(appJs, /\? 0\.84 : 1/);
  assert.match(appJs, /correctionThreshold = beginnerMode \? 72 : 88/);
});

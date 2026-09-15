import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const appHtml = read('private/app.html');
const appJs = read('public/app.js');
const learnJs = read('public/learn.js');
const styles = read('public/styles.css');

test('saved vocabulary has an obvious destination from the translation card', () => {
  assert.match(appHtml, /id="learn-from-translation"[^>]*>＋ Guardar en Mis palabras</);
  assert.match(appJs, /showView\('learn'\);[\s\S]{0,120}openLearnPath\('words'\)/);
  assert.match(appJs, /palabra guardada[\s\S]{0,120}Mis palabras/);
});

test('Learn home exposes Mis palabras as a first-class path', () => {
  assert.match(appHtml, /data-learn-path="words"/);
  assert.match(appHtml, /id="learn-home-custom-count"/);
  assert.match(appHtml, /id="learn-words-branch"/);
  assert.match(appHtml, /id="learn-custom-practice-all"/);
  assert.match(appHtml, /id="learn-custom-list"/);
  assert.match(appJs, /learnWordsBranch/);
  assert.match(appJs, /path !== 'words'/);
});

test('Mis palabras can be heard, practiced, and removed without hunting through routes', () => {
  assert.match(learnJs, /function renderCustomWords\(\)/);
  assert.match(learnJs, /data-custom-action=\\?"listen\\?"/);
  assert.match(learnJs, /data-custom-action=\\?"practice\\?"/);
  assert.match(learnJs, /data-custom-action=\\?"delete\\?"/);
  assert.match(learnJs, /startLesson\('custom'/);
  assert.match(learnJs, /state\.customWords = state\.customWords\.filter/);
  assert.match(learnJs, /situation:String\(situation \|\| 'everyday'\)/);
  assert.match(styles, /\.saved-words-list/);
  assert.match(styles, /\.saved-word-card/);
});

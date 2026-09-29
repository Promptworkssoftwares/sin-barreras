import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const html = read('private/app.html');
const css = read('public/styles.css');
const js = read('public/app.js');

test('v1.7.5 gives Learn ownership of quick phrases and saved phrases', () => {
  assert.match(html, /data-learn-path="quick-phrases"/);
  assert.match(html, /<strong>Frases rápidas<\/strong>/);
  assert.match(html, /data-learn-path="saved-phrases"/);
  assert.match(html, /<strong>Frases Guardadas<\/strong>/);
  assert.match(html, /id="learn-quick-phrases-branch"/);
  assert.match(html, /id="practice-form"/);
  assert.match(js, /path === 'saved-phrases'/);
  assert.match(js, /path !== 'quick-phrases'/);
});

test('v1.7.5 Practice no longer creates a new quick phrase', () => {
  const practiceStart = html.indexOf('<section id="practice-view"');
  const coachStart = html.indexOf('<section id="coach-view"');
  const practiceMarkup = html.slice(practiceStart, coachStart);
  assert.doesNotMatch(practiceMarkup, /id="practice-form"/);
  assert.match(practiceMarkup, /PRÁCTICA · ENTRENA LO QUE YA APRENDISTE/);
  assert.match(practiceMarkup, /data-practice-destination="sounds"/);
  assert.match(practiceMarkup, /data-practice-destination="words"/);
  assert.match(practiceMarkup, /data-practice-destination="saved-phrases"/);
  assert.match(practiceMarkup, /data-practice-destination="coach"/);
  assert.match(practiceMarkup, /data-practice-destination="quick-phrases"/);
});

test('v1.7.5 keeps complete conversation scenarios in Coach', () => {
  for (const scenario of ['traffic','fastfood','pharmacy','medical','work','landlord','bank','school','shopping','transport','dmv','emergency']) {
    assert.match(html, new RegExp(`data-coach-scenario="${scenario}"`));
  }
  assert.match(html, /class="coach-scenario-grid"/);
  assert.match(html, /Elige una misión para conversar de principio a fin/);
});

test('v1.7.5 saved phrase library is presented as part of learning navigation', () => {
  assert.match(html, /id="phrasebook-title">Frases Guardadas/);
  assert.match(html, /id="phrasebook-back-to-learn"/);
  assert.match(js, /view === 'phrasebook' \? 'learn' : view/);
  assert.match(css, /v1\.7\.5 · Learn owns quick phrases \+ saved phrases/);
});

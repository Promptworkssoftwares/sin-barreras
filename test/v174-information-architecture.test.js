import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const html = read('private/app.html');
const css = read('public/styles.css');
const js = read('public/app.js');

test('v1.7.8 unifies Learn and Practice into one main-menu destination', () => {
  const nav = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  for (const view of ['conversation','learn','coach','camera']) assert.match(nav, new RegExp(`data-view="${view}"`));
  assert.doesNotMatch(nav, /data-view="practice"/);
  assert.doesNotMatch(nav, /Abrir Práctica/);
  assert.match(css, /v1\.7\.8 · unified Learn \+ Practice navigation/);
  assert.match(css, /bottom-nav\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(js, /if \(view === 'practice'\) view = 'learn'/);
});

test('v1.7.8 gives unified Learn ownership of learning and active practice tools', () => {
  for (const path of ['routes','sounds','quick-phrases','saved-phrases','conversations','words']) {
    assert.match(html, new RegExp(`data-learn-path="${path}"`));
  }
  assert.match(html, /SIN BARRERAS · APRENDER Y PRACTICAR/);
  assert.match(html, /id="learn-quick-phrases-branch"/);
  assert.match(html, /id="practice-form"/);
  assert.match(html, /<strong>Frases Guardadas<\/strong>/);
});

test('v1.7.8 old Practice view cannot become a second visible product area', () => {
  assert.match(html, /id="practice-view"[^>]*legacy-practice-view[^>]*hidden[^>]*inert/);
  assert.match(css, /\.legacy-practice-view\{display:none!important;\}/);
  assert.match(js, /showView\('learn'\);\s*openLearnPath\('quick-phrases'\)/);
});

test('v1.7.8 keeps complete conversation scenarios in Coach', () => {
  for (const scenario of ['traffic','fastfood','pharmacy','medical','work','landlord','bank','school','shopping','transport','dmv','emergency']) {
    assert.match(html, new RegExp(`data-coach-scenario="${scenario}"`));
  }
  assert.match(html, /class="coach-scenario-grid"/);
  assert.match(html, /Elige una misión para conversar de principio a fin/);
});

test('v1.7.8 saved phrase library stays under the Learn navigation identity', () => {
  assert.match(html, /id="phrasebook-title">Frases Guardadas/);
  assert.match(html, /id="phrasebook-back-to-learn"/);
  assert.match(js, /view === 'phrasebook' \? 'learn' : view/);
});

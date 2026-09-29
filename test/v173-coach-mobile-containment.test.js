import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');

test('v1.7.6 Coach stays inside phone margins without horizontal hidden layouts', () => {
  assert.match(css, /v1\.7\.6 · Coach true-mobile containment/);
  assert.match(css, /\.coach-view \{ width:100%; min-width:0; max-width:100%; overflow-x:hidden; \}/);
  assert.match(css, /\.coach-language-pair\{[\s\S]*grid-template-columns:1fr;/);
  assert.match(css, /\.coach-success-criteria\{[\s\S]*flex-wrap:wrap;[\s\S]*overflow:visible;/);
  assert.match(css, /\.coach-toolbar-actions>span\{[\s\S]*white-space:normal;[\s\S]*text-overflow:clip;/);
  assert.match(css, /\.coach-turn-feedback\{ width:100%; max-width:100%; justify-self:stretch; \}/);
  assert.match(css, /\.coach-text-fallback\{[\s\S]*grid-template-columns:1fr;/);
});

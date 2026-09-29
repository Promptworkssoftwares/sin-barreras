import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
const appHtml = fs.readFileSync(new URL('../private/app.html', import.meta.url), 'utf8');

test('v1.7.8 prevents mobile form-focus auto zoom without disabling accessibility zoom', () => {
  assert.match(css, /v1\.7\.8 · Mobile no-auto-zoom interaction guard/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*input,[\s\S]*select,[\s\S]*textarea,[\s\S]*font-size: 16px !important/);
  assert.match(css, /touch-action: manipulation/);
  assert.doesNotMatch(appHtml, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(appHtml, /maximum-scale\s*=\s*1/i);
});

test('v1.7.8 removes tap scale/translate effects on mobile interaction surfaces', () => {
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.conversation-button:active[\s\S]*transform: none !important/);
  assert.match(css, /\.learn-path-card:active/);
  assert.match(css, /\.coach-scenario-shortcuts button:active/);
});

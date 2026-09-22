import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const appHtml = read('private/app.html');
const accountUi = read('public/account-ui.js');
const styles = read('public/styles.css');

test('v1.6.6 settings shows real voice-minute usage with remaining time and reset date', () => {
  for (const id of [
    'settings-ai-usage',
    'settings-ai-usage-title',
    'settings-ai-usage-percent',
    'settings-ai-usage-bar',
    'settings-ai-remaining',
    'settings-ai-reset',
    'settings-ai-usage-note'
  ]) assert.match(appHtml, new RegExp(`id="${id}"`));

  assert.match(accountUi, /settingsButton\?\.addEventListener\('click'/);
  assert.match(accountUi, /voicePercent/);
  assert.match(accountUi, /Te quedan \$\{remaining\.toFixed\(1\)\} minutos/);
  assert.match(accountUi, /settingsUsageReset\.textContent = `Renueva:/);
  assert.match(accountUi, /aria-valuenow/);
});

test('v1.6.6 settings keeps all existing working preference controls', () => {
  for (const id of ['translator-voice-select','preview-voice','font-size-select','settings-open-phrasebook','open-history']) {
    assert.match(appHtml, new RegExp(`id="${id}"`));
  }
  assert.match(appHtml, /class="theme-option" data-theme="light"/);
  assert.match(appHtml, /class="theme-option" data-theme="dark"/);
});

test('v1.6.6 settings is responsive and avoids horizontal overflow', () => {
  assert.match(styles, /v1\.6\.6 · Modern user settings/);
  assert.match(styles, /overflow-x:hidden/);
  assert.match(styles, /@media\(max-width:640px\)/);
  assert.match(styles, /settings-shortcuts\{[^}]*grid-template-columns:1fr 1fr/);
  assert.match(styles, /settings-shortcuts\{[^}]*grid-template-columns:1fr\}/);
});

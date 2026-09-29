import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const appHtml = read('private/app.html');
const appJs = read('public/app.js');
const server = read('server/server.js');
const styles = read('public/styles.css');

test('Quick phrase learning lives in Learn while conversation role-play remains in Coach', () => {
  assert.match(appHtml, /data-learn-path="quick-phrases"/);
  assert.match(appHtml, /id="learn-quick-phrases-branch"/);
  assert.match(appHtml, /PRÁCTICA · ENTRENA LO QUE YA APRENDISTE/);
  assert.match(appHtml, /id="practice-conversation-mode"[^>]*hidden inert/);
  assert.match(appHtml, /class="coach-scenario-grid"/);
  assert.match(appJs, /destination === 'coach'/);
  assert.match(server, /practiceConversationStart = async/);
});

test('Coach exposes essential newcomer scenarios including traffic stop and fast food', () => {
  for (const value of ['traffic','fastfood','pharmacy','work','landlord','bank','school','transport','dmv','emergency']) {
    assert.match(appHtml, new RegExp(`value="${value}"|data-coach-scenario="${value}"`));
  }
  assert.match(server, /traffic: 'a routine US traffic stop with a police officer/);
  assert.match(server, /fastfood: 'ordering food at a US fast-food counter or drive-through/);
  assert.match(server, /pharmacy: 'a conversation at a pharmacy/);
  assert.match(server, /dmv: 'a DMV or government-service counter conversation/);
});

test('sensitive real-life scenarios stay language-practice only', () => {
  assert.match(server, /do not provide legal advice, rights analysis, evasion tactics/);
  assert.match(server, /Do not diagnose or provide medical advice/);
  assert.match(server, /language practice only/);
  assert.match(server, /do not instruct evasion, resistance, diagnosis, or unsafe behavior/);
});

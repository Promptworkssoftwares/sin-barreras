import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const appHtml = read('private/app.html');
const appJs = read('public/app.js');
const server = read('server/server.js');
const styles = read('public/styles.css');

test('Practice keeps quick phrases and adds multilingual guided real-life conversations', () => {
  assert.match(appHtml, /id="practice-mode-phrase"/);
  assert.match(appHtml, /id="practice-mode-conversation"/);
  assert.match(appHtml, /data-practice-scenario="traffic"/);
  assert.match(appHtml, /data-practice-scenario="fastfood"/);
  assert.match(appHtml, /data-practice-scenario="pharmacy"/);
  assert.match(appHtml, /data-practice-scenario="dmv"/);
  assert.match(appHtml, /id="practice-conversation-native"/);
  assert.match(appHtml, /id="practice-conversation-target"/);
  assert.match(appJs, /\/api\/practice\/conversation\/start/);
  assert.match(appJs, /\/api\/practice\/conversation\/turn/);
  assert.match(appJs, /speakText\(result\.partnerLine, targetLanguage/);
  assert.match(server, /practiceConversationStart = async \(\{ scenario, nativeLanguage, targetLanguage/);
  assert.match(server, /practiceConversationTurn = async \(\{ heardText, scenario, nativeLanguage, targetLanguage/);
  assert.match(styles, /\.practice-scenario-grid/);
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

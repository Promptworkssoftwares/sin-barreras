import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const appHtml = read('private/app.html');
const appJs = read('public/app.js');
const phrasebook = read('public/phrasebook.js');
const phrasePractice = read('public/phrase-practice.js');
const server = read('server/server.js');
const accountRoutes = read('routes/accountRoutes.js');
const cloud = read('public/cloud.js');
const styles = read('public/styles.css');

test('saved phrases practice their actual target language instead of forcing English', () => {
  assert.match(appJs, /initPhrasePractice/);
  assert.match(appJs, /onPractice: \(item\) => phrasePractice\?\.start\(item\)/);
  assert.doesNotMatch(appJs, /onPractice: \(item\) => preparePhraseForPractice\(\{[\s\S]{0,300}targetLanguage === 'en'/);
  assert.match(phrasePractice, /nativeLanguage: state\.item\.sourceLanguage/);
  assert.match(phrasePractice, /targetLanguage: state\.item\.targetLanguage/);
  assert.match(phrasePractice, /form\.append\('targetLanguage', state\.lesson\.targetLanguage\)/);
  assert.match(phrasePractice, /speakText\(step\.targetText, state\.lesson\.targetLanguage/);
});

test('saved phrase practice is divided into ordered teachable parts and ends with the complete phrase', () => {
  assert.match(server, /app\.post\('\/api\/practice\/phrase-lesson'/);
  assert.match(server, /phrasePracticeLesson = async/);
  assert.match(server, /Use 1 to 6 segments total/);
  assert.match(server, /Every segment MUST copy an exact consecutive span from targetText/);
  assert.match(server, /validSequentialPhraseSegments/);
  assert.match(server, /fallbackPhraseSegments/);
  assert.match(phrasePractice, /kind: 'segment'/);
  assert.match(phrasePractice, /kind: 'full'/);
  assert.match(appHtml, /id="phrase-practice-step-badge"/);
  assert.match(appHtml, /id="phrase-practice-target"/);
  assert.match(appHtml, /id="phrase-practice-pronunciation"/);
  assert.match(appHtml, /id="phrase-practice-next"/);
  assert.match(phrasePractice, /'FRASE COMPLETA'/);
});

test('every phrase segment can be listened to slowly and scored by voice', () => {
  assert.match(appHtml, /id="phrase-practice-listen"/);
  assert.match(appHtml, /id="phrase-practice-slow"/);
  assert.match(appHtml, /id="phrase-practice-record"/);
  assert.match(phrasePractice, /listen\(0\.72\)/);
  assert.match(phrasePractice, /createAutoVoiceTurn/);
  assert.match(phrasePractice, /\/api\/practice\/score/);
  assert.match(phrasePractice, /targetText', step\.targetText/);
  assert.match(phrasePractice, /originalIntent', step\.meaning/);
  assert.match(styles, /\.phrase-practice-player/);
  assert.match(styles, /\.phrase-practice-card/);
});

test('phrase lesson progress is visible and synced with the user account', () => {
  assert.match(phrasebook, /practiceCount/);
  assert.match(phrasebook, /bestScore/);
  assert.match(phrasebook, /lastPracticedAt/);
  assert.match(phrasebook, /recordPractice/);
  assert.match(phrasebook, /Practicar por partes/);
  assert.match(accountRoutes, /practiceCount/);
  assert.match(accountRoutes, /bestScore/);
  assert.match(accountRoutes, /lastPracticedAt/);
  assert.match(cloud, /practiceCount/);
  assert.match(cloud, /bestScore/);
  assert.match(cloud, /lastPracticedAt/);
});

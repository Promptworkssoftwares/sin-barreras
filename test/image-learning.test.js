import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IMAGE_LESSONS, PRONOUN_LESSONS, PRONOUN_CATEGORIES, FAMILY_LESSONS, FAMILY_CATEGORIES, IMAGE_TOPICS, imageLessonGroup, IMAGE_AUDIO_LANGUAGES, imageNeedsLatinReading } from '../public/image-learning-data.js';
import { normalizeImageLesson } from '../server/image-lesson.js';
import { LANGUAGE_CATALOG } from '../public/languages.js';

const records = IMAGE_LESSONS.map(({ id }) => ({ id, nativeWord: `nombre ${id}`, targetWord: `word ${id}`, nativePhrase: `Necesito ${id}`, targetPhrase: `I need ${id}` }));
test('visual lessons bind translations to exact image IDs and preserve English source', () => {
  const result = normalizeImageLesson([...records].reverse(), 'es', 'en');
  assert.deepEqual(result.map(({ id }) => id), IMAGE_LESSONS.map(({ id }) => id));
  assert.equal(result[0].targetWord, IMAGE_LESSONS[0].word);
  assert.equal(result[0].targetPhrase, IMAGE_LESSONS[0].phrase);
  assert.equal(result[0].nativeWord, records[0].nativeWord);
  for (const item of result) assert.ok(fs.existsSync(new URL(`../public${item.image}`, import.meta.url)));
});

test('incomplete, duplicated and oversized model outputs cannot become visual lessons', () => {
  assert.throws(() => normalizeImageLesson(records.slice(1), 'es', 'fr'));
  assert.throws(() => normalizeImageLesson([records[0], ...records.slice(0, -1)], 'es', 'fr'));
  assert.throws(() => normalizeImageLesson(records.map((row, i) => i ? row : { ...row, targetWord: 'x'.repeat(181) }), 'es', 'fr'));
});

test('Mandarin and Russian lessons require readable Latin text while retaining original speech text', () => {
  const concepts = imageLessonGroup('pronouns', '1', 'object').filter(({ id }) => id === 'him');
  const row = { id: 'him', nativeWord: 'a él', targetWord: '他', nativePhrase: 'Lo veo.', targetPhrase: '我看见他。', targetWordLatin: 'tā', targetPhraseLatin: 'Wǒ kànjiàn tā.' };
  const chinese = normalizeImageLesson([row], 'es', 'zh', concepts)[0];
  assert.equal(chinese.targetWord, '他');
  assert.equal(chinese.targetPhrase, '我看见他。');
  assert.equal(chinese.targetWordLatin, 'tā');
  assert.equal(chinese.targetPhraseLatin, 'Wǒ kànjiàn tā.');
  assert.equal(chinese.nativeWord, 'a él');
  assert.throws(() => normalizeImageLesson([{ ...row, targetWordLatin: '他' }], 'es', 'zh', concepts), /lectura clara/);
  assert.throws(() => normalizeImageLesson([{ ...row, targetPhraseLatin: '' }], 'es', 'zh', concepts), /lectura clara/);
  assert.throws(() => normalizeImageLesson([{ ...row, targetWordLatin: 'ˈta' }], 'es', 'zh', concepts), /lectura clara/);
  assert.equal(imageNeedsLatinReading('ru'), true);
  const russian = normalizeImageLesson([{ ...row, targetWord: 'его', targetPhrase: 'Я вижу его.', targetWordLatin: 'yevo', targetPhraseLatin: 'Ya vizhu yevo.' }], 'es', 'ru', concepts)[0];
  assert.equal(russian.targetWordLatin, 'yevo');
  assert.equal(normalizeImageLesson([{ ...row, targetWord: 'him', targetPhrase: 'I see him.' }], 'es', 'en', concepts)[0].targetWordLatin, '');
});

test('the supplied pronoun images form the first level with six requested groups and demonstratives', () => {
  assert.deepEqual(PRONOUN_CATEGORIES.map(({ id }) => id), ['personal', 'object', 'possessive', 'reflexive', 'indefinite', 'reciprocal', 'demonstrative']);
  assert.equal(PRONOUN_LESSONS.length, 33);
  const images = PRONOUN_LESSONS.flatMap((item) => [item.image, ...(item.imageVariants || [])]);
  assert.equal(images.length, 34);
  assert.equal(new Set(images).size, 34);
  for (const image of images) assert.ok(fs.existsSync(new URL(`../public${image}`, import.meta.url)), image);
  assert.equal(imageLessonGroup('pronouns', '1', 'personal').length, 6);
  assert.equal(imageLessonGroup('pronouns', '1', 'reciprocal').length, 1);
  assert.equal(imageLessonGroup('situations', '1', 'all').length, 8);
  assert.equal(imageLessonGroup('pronouns', '1', 'invalid'), null);
  assert.match(PRONOUN_LESSONS.find(({ id }) => id === 'her').grammar, /object pronoun/);
  assert.match(PRONOUN_LESSONS.find(({ id }) => id === 'my').grammar, /determiner/);
  const objects = imageLessonGroup('pronouns', '1', 'object');
  const translated = objects.map(({ id }) => ({ id, nativeWord: id, targetWord: id, nativePhrase: 'Frase', targetPhrase: 'Phrase' }));
  assert.equal(normalizeImageLesson(translated, 'es', 'fr', objects).length, objects.length);
  assert.throws(() => normalizeImageLesson(translated.slice(1), 'es', 'fr', objects));
});

test('topics have independent levels and family level one covers all supplied real images', () => {
  assert.deepEqual(IMAGE_TOPICS.map(({ id }) => id), ['pronouns', 'family', 'situations']);
  assert.ok(IMAGE_TOPICS.every(({ levels }) => levels[0].id === '1'));
  assert.deepEqual(FAMILY_CATEGORIES.map(({ id }) => id), ['immediate', 'everyday', 'relatives', 'couple']);
  assert.equal(FAMILY_LESSONS.length, 19);
  assert.equal(new Set(FAMILY_LESSONS.map(({ id }) => id)).size, 19);
  assert.equal(new Set(FAMILY_LESSONS.map(({ image }) => image)).size, 19);
  for (const item of FAMILY_LESSONS) {
    assert.ok(item.id.startsWith('family-'));
    assert.ok(fs.existsSync(new URL(`../public${item.image}`, import.meta.url)), item.image);
  }
  assert.equal(FAMILY_CATEGORIES.reduce((sum, { id }) => sum + imageLessonGroup('family', '1', id).length, 0), 19);
  assert.equal(imageLessonGroup('family', '2', 'immediate'), null);
  assert.equal(imageLessonGroup('unknown', '1', 'all'), null);
  const group = imageLessonGroup('family', '1', 'relatives');
  const translated = group.map(({ id }) => ({ id, nativeWord: id, targetWord: id, nativePhrase: 'Frase', targetPhrase: 'Phrase' }));
  assert.equal(normalizeImageLesson(translated, 'es', 'fr', group).length, group.length);
});

test('image learning uses the shared language catalog and authenticated server endpoint', () => {
  assert.ok(LANGUAGE_CATALOG.length > 50);
  assert.ok(IMAGE_AUDIO_LANGUAGES.has('es'));
  assert.ok(IMAGE_AUDIO_LANGUAGES.has('ja'));
  assert.ok(!IMAGE_AUDIO_LANGUAGES.has('la'));
  const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const module = fs.readFileSync(new URL('../public/image-learning.js', import.meta.url), 'utf8');
  const server = fs.readFileSync(new URL('../server/server.js', import.meta.url), 'utf8');
  assert.match(app, /path === 'images'\) imageLearning\?\.open\(\)/);
  assert.match(module, /LANGUAGE_CATALOG\.map/);
  assert.match(module, /request\('\/api\/learn\/images'/);
  assert.match(module, /onPractice\?\.\(/);
  assert.match(server, /app\.post\('\/api\/learn\/images', aiLimiter/);
});

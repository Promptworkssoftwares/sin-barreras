import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sanitizeConversationSeed } from '../server/conversation-seed.js';

const spanishToEnglish = { originalText: 'Necesito una cita médica.', translatedText: 'I need a medical appointment.', sourceLanguage: 'es', targetLanguage: 'en' };
const englishToSpanish = { originalText: 'When are you available?', translatedText: '¿Cuándo estás disponible?', sourceLanguage: 'en', targetLanguage: 'es' };

test('conversation practice keeps the real exchange and speaker direction', () => {
  assert.deepEqual(sanitizeConversationSeed(spanishToEnglish, 'es', 'en'), { ...spanishToEnglish, speaker: 'learner' });
  assert.deepEqual(sanitizeConversationSeed(englishToSpanish, 'es', 'en'), { ...englishToSpanish, speaker: 'conversation partner' });
});

test('conversation context rejects mismatched languages and bounds untrusted text', () => {
  assert.equal(sanitizeConversationSeed({ ...spanishToEnglish, sourceLanguage: 'fr' }, 'es', 'en'), null);
  assert.equal(sanitizeConversationSeed({ ...spanishToEnglish, translatedText: '' }, 'es', 'en'), null);
  const seed = sanitizeConversationSeed({ ...spanishToEnglish, originalText: 'x'.repeat(1000) }, 'es', 'en');
  assert.equal(seed.originalText.length, 400);
});

test('Learn practice action starts a grounded Coach session, not the phrase form', () => {
  const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const server = fs.readFileSync(new URL('../server/server.js', import.meta.url), 'utf8');
  assert.match(app, /if \(action === 'practice'\) await practiceConversationFromHistory\(item\)/);
  assert.match(app, /await startCoachSession\(\{ sourceConversation: \{/);
  assert.match(server, /session\.sourceConversation = conversationSeed/);
  assert.match(server, /session: sanitizeCoachSession\(session, nativeLanguage, targetLanguage\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { learningPair, learningConversations, dailyLearningAction } from '../public/learning-profile.js';
import { sanitizeConversationSeed } from '../server/conversation-seed.js';

test('learning languages are separate from the interface and stay distinct', () => {
  assert.deepEqual(learningPair({ uiLocale: 'en', detectedUserLanguage: 'es', learningNativeLanguage: 'es', learningTargetLanguage: 'zh' }),
    { nativeLanguage: 'es', targetLanguage: 'zh' });
  assert.deepEqual(learningPair({ learningNativeLanguage: 'en', learningTargetLanguage: 'en' }),
    { nativeLanguage: 'en', targetLanguage: 'es' });
  assert.deepEqual(learningPair({ detectedUserLanguage: 'ru' }),
    { nativeLanguage: 'ru', targetLanguage: 'en' });
});

test('conversations in either direction seed Coach with the original language pair', () => {
  const history = [
    { id: 'a', sourceLanguage: 'es', targetLanguage: 'zh', originalText: 'Necesito ayuda.', translatedText: '我需要帮助。', createdAt: '2026-10-01T12:00:00Z' },
    { id: 'b', sourceLanguage: 'zh', targetLanguage: 'es', originalText: '你好', translatedText: 'Hola', createdAt: '2026-09-30T12:00:00Z' },
    { id: 'c', sourceLanguage: 'es', targetLanguage: 'en', originalText: 'Quiero agua', translatedText: 'I want water' },
    { id: 'd', sourceLanguage: 'es', targetLanguage: 'zh', originalText: 'Necesito ayuda.', translatedText: '我需要帮助。', createdAt: '2026-09-29T12:00:00Z' }
  ];
  const candidates = learningConversations(history, 'es', 'zh');
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].count, 2);
  assert.equal(candidates[0].targetText, '我需要帮助。');
  assert.equal(candidates[0].meaning, 'Necesito ayuda.');
  assert.equal(candidates[1].targetText, '你好');
  assert.equal(candidates[1].meaning, 'Hola');
  for (const item of candidates) {
    assert.ok(sanitizeConversationSeed({
      originalText: item.originalText, translatedText: item.translatedText,
      sourceLanguage: item.sourceLanguage, targetLanguage: item.translatedLanguage
    }, item.nativeLanguage, item.targetLanguage));
  }
  assert.deepEqual(learningConversations(history, 'fr', 'zh'), []);
});

test('daily action prioritizes due English reviews and useful conversations for other languages', () => {
  assert.equal(dailyLearningAction({ targetLanguage: 'en', dueCount: 3, coachActive: true }), 'resume');
  assert.equal(dailyLearningAction({ targetLanguage: 'en', dueCount: 3, conversationCount: 2 }), 'review');
  assert.equal(dailyLearningAction({ targetLanguage: 'en', conversationCount: 2 }), 'course');
  assert.equal(dailyLearningAction({ targetLanguage: 'zh', conversationCount: 2 }), 'conversation');
  assert.equal(dailyLearningAction({ targetLanguage: 'zh' }), 'phrase');
  assert.equal(dailyLearningAction({ nativeLanguage: 'pt', targetLanguage: 'en', dueCount: 4, conversationCount: 1 }), 'conversation');
});

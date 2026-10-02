import { LANGUAGES } from './languages.js?v=1.7.25';

const validLanguage = (code) => Boolean(code && Object.hasOwn(LANGUAGES, code));

export function learningPair(settings = {}, fallbackNative = 'es') {
  const nativeLanguage = [settings.learningNativeLanguage, settings.detectedUserLanguage, fallbackNative, 'es']
    .find(validLanguage);
  const preferredTarget = settings.learningTargetLanguage;
  const targetLanguage = validLanguage(preferredTarget) && preferredTarget !== nativeLanguage
    ? preferredTarget : nativeLanguage === 'en' ? 'es' : 'en';
  return { nativeLanguage, targetLanguage };
}

export function learningConversations(history = [], nativeLanguage, targetLanguage) {
  if (!validLanguage(nativeLanguage) || !validLanguage(targetLanguage) || nativeLanguage === targetLanguage) return [];
  const grouped = new Map();
  for (const item of Array.isArray(history) ? history : []) {
    if (!item || !((item.sourceLanguage === nativeLanguage && item.targetLanguage === targetLanguage)
      || (item.sourceLanguage === targetLanguage && item.targetLanguage === nativeLanguage))) continue;
    const targetText = String(item.sourceLanguage === targetLanguage ? item.originalText : item.translatedText || '').trim();
    const meaning = String(item.sourceLanguage === nativeLanguage ? item.originalText : item.translatedText || '').trim();
    if (!targetText || !meaning) continue;
    const key = targetText.toLocaleLowerCase().replace(/\s+/g, ' ');
    const previous = grouped.get(key);
    const createdAt = item.createdAt || new Date(0).toISOString();
    grouped.set(key, {
      id: item.id, targetText, meaning, nativeLanguage, targetLanguage,
      situation: item.situation || 'everyday',
      originalText: item.originalText, translatedText: item.translatedText,
      sourceLanguage: item.sourceLanguage, translatedLanguage: item.targetLanguage,
      count: (previous?.count || 0) + 1,
      createdAt: previous && previous.createdAt > createdAt ? previous.createdAt : createdAt
    });
  }
  return [...grouped.values()]
    .sort((a, b) => (b.count - a.count) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 16);
}

export function dailyLearningAction({ nativeLanguage = 'es', targetLanguage, dueCount = 0, conversationCount = 0, coachActive = false } = {}) {
  if (coachActive) return 'resume';
  if (nativeLanguage === 'es' && targetLanguage === 'en' && dueCount > 0) return 'review';
  if (nativeLanguage === 'es' && targetLanguage === 'en') return 'course';
  return conversationCount > 0 ? 'conversation' : 'phrase';
}

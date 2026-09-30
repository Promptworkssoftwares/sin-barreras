export function sanitizeConversationSeed(raw, nativeLanguage, targetLanguage) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const sourceLanguage = String(raw.sourceLanguage || '');
  const translatedLanguage = String(raw.targetLanguage || '');
  if (!((sourceLanguage === nativeLanguage && translatedLanguage === targetLanguage)
    || (sourceLanguage === targetLanguage && translatedLanguage === nativeLanguage))) return null;
  const clean = (value) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 400) : '';
  const originalText = clean(raw.originalText);
  const translatedText = clean(raw.translatedText);
  if (!originalText || !translatedText) return null;
  return { originalText, translatedText, sourceLanguage, targetLanguage: translatedLanguage,
    speaker: sourceLanguage === targetLanguage ? 'conversation partner' : 'learner' };
}

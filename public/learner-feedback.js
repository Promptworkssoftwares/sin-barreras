const NON_LATIN_LETTER = /[^\p{Script=Latin}\p{Number}\p{Punctuation}\p{Separator}\p{Mark}]/u;

function clean(value) {
  return String(value || '').trim();
}

export function hasNonLatinLetters(value) {
  const text = clean(value);
  if (!text) return false;
  for (const char of text) {
    if (/\p{L}/u.test(char) && NON_LATIN_LETTER.test(char)) return true;
  }
  return false;
}

export function friendlyRecognition(result = {}, { empty = 'No logramos reconocer suficientes palabras para explicarlo con claridad.' } = {}) {
  const meaning = clean(result.heardMeaning);
  const pronunciation = clean(result.heardPronunciation);
  const raw = clean(result.heardText);

  if (meaning && pronunciation) return `${meaning} · Sonó parecido a: ${pronunciation}`;
  if (meaning) return meaning;
  if (pronunciation) return `Sonó parecido a: ${pronunciation}`;
  if (raw && !hasNonLatinLetters(raw)) return raw;
  return empty;
}

export function friendlyDifference(result = {}) {
  const difference = clean(result.difference);
  const feedback = clean(result.feedback);
  if (difference && feedback && difference.toLocaleLowerCase() !== feedback.toLocaleLowerCase()) {
    return `${feedback} ${difference}`;
  }
  return difference || feedback || 'Compara con el ejemplo y vuelve a intentarlo con calma.';
}

export function friendlyFocus(result = {}) {
  return clean(result.focus) || 'Repite la frase por partes y luego vuelve a decirla completa.';
}

export function rawRecognitionForReference(result = {}) {
  const raw = clean(result.heardText);
  return raw && !hasNonLatinLetters(raw) ? raw : '';
}

import { IMAGE_LESSONS, imageNeedsLatinReading, isLatinImageReading } from '../public/image-learning-data.js';

export function normalizeImageLesson(raw, nativeLanguage, targetLanguage, concepts = IMAGE_LESSONS) {
  if (!Array.isArray(raw) || raw.length !== concepts.length) throw new Error('No pudimos preparar todas las imágenes. Inténtalo otra vez.');
  const byId = new Map();
  for (const row of raw) {
    if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || byId.has(row.id)) {
      throw new Error('La lección por imágenes está incompleta.');
    }
    const fields = ['nativeWord', 'targetWord', 'nativePhrase', 'targetPhrase'];
    if (fields.some((key) => typeof row[key] !== 'string' || !row[key].trim() || row[key].length > 180)) {
      throw new Error('La lección por imágenes está incompleta.');
    }
    byId.set(row.id, row);
  }
  return concepts.map((concept) => {
    const row = byId.get(concept.id);
    if (!row) throw new Error('La lección por imágenes está incompleta.');
    return {
      id: concept.id, image: concept.image, imageVariants: concept.imageVariants || [],
      nativeWord: nativeLanguage === 'en' ? concept.word : row.nativeWord.trim(),
      targetWord: targetLanguage === 'en' ? concept.word : row.targetWord.trim(),
      nativePhrase: nativeLanguage === 'en' ? concept.phrase : row.nativePhrase.trim(),
      targetPhrase: targetLanguage === 'en' ? concept.phrase : row.targetPhrase.trim(),
      targetWordLatin: imageNeedsLatinReading(targetLanguage) && isLatinImageReading(row.targetWordLatin) ? row.targetWordLatin.trim() : '',
      targetPhraseLatin: imageNeedsLatinReading(targetLanguage) && isLatinImageReading(row.targetPhraseLatin) ? row.targetPhraseLatin.trim() : ''
    };
  });
}

// A malformed reading must never discard an otherwise valid translated lesson.
// Repair only the missing readings; IDs and translated words remain untouched.
export async function completeImageReadings(items, targetLanguage, generate) {
  if (!imageNeedsLatinReading(targetLanguage)) return items;
  let completed = items;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const missing = completed.filter((item) => !isLatinImageReading(item.targetWordLatin) || !isLatinImageReading(item.targetPhraseLatin));
    if (!missing.length) break;
    let repairs;
    try { repairs = await generate(missing, attempt); }
    catch { break; }
    if (!Array.isArray(repairs)) continue;
    const expected = new Set(missing.map(({ id }) => id));
    const byId = new Map();
    for (const row of repairs) {
      if (!row || !expected.has(row.id) || byId.has(row.id)) continue;
      byId.set(row.id, row);
    }
    completed = completed.map((item) => {
      const repair = byId.get(item.id);
      if (!repair) return item;
      return {
        ...item,
        targetWordLatin: isLatinImageReading(item.targetWordLatin) ? item.targetWordLatin : isLatinImageReading(repair.targetWordLatin) ? repair.targetWordLatin.trim() : '',
        targetPhraseLatin: isLatinImageReading(item.targetPhraseLatin) ? item.targetPhraseLatin : isLatinImageReading(repair.targetPhraseLatin) ? repair.targetPhraseLatin.trim() : ''
      };
    });
  }
  return completed;
}

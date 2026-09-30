import { IMAGE_LESSONS } from '../public/image-learning-data.js';

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
      targetPhrase: targetLanguage === 'en' ? concept.phrase : row.targetPhrase.trim()
    };
  });
}

import { playBase64Audio, unlockAudioPlayback } from './audio-playback.js?v=1.6.6';
import { getOrCreateTts } from './tts-cache.js?v=1.6.6';

const KEY = 'sinBarreras.phrasebook.v1';
const AUDIO_CACHE = 'sin-barreras-phrase-audio-v1';
const MAX_PHRASES = 150;

export const PHRASE_CATEGORIES = Object.freeze({
  all: 'Todas', general: 'General', work: 'Trabajo', medical: 'Doctor / salud', school: 'Escuela',
  emergency: 'Emergencia', restaurant: 'Restaurante', bank: 'Banco', travel: 'Viaje', personal: 'Personal'
});

const categoryForSituation = (situation = '') => ({
  work: 'work', construction: 'work', interview: 'work', medical: 'medical', school: 'school',
  emergency: 'emergency', restaurant: 'restaurant', bank: 'bank', hotel: 'travel'
}[situation] || 'general');

const safePhrase = (item = {}) => ({
  id: String(item.id || crypto.randomUUID()).slice(0, 120),
  sourceText: String(item.sourceText || '').trim().slice(0, 1200),
  translatedText: String(item.translatedText || '').trim().slice(0, 1200),
  sourceLanguage: item.sourceLanguage || null,
  targetLanguage: item.targetLanguage || null,
  category: PHRASE_CATEGORIES[item.category] ? item.category : categoryForSituation(item.situation),
  situation: item.situation || 'everyday',
  createdAt: item.createdAt || new Date().toISOString(),
  practiceCount: Math.max(0, Number(item.practiceCount) || 0),
  bestScore: Math.max(0, Math.min(100, Number(item.bestScore) || 0)),
  lastPracticedAt: item.lastPracticedAt ? String(item.lastPracticedAt).slice(0, 40) : null
});

function read() {
  try { return (JSON.parse(localStorage.getItem(KEY) || '[]') || []).map(safePhrase).filter((item) => item.sourceText && item.translatedText).slice(0, MAX_PHRASES); }
  catch { return []; }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items.map(safePhrase).slice(0, MAX_PHRASES)));
  window.SinBarrerasCloud?.queueSync?.();
}

const audioRequest = (id) => new Request(`${location.origin}/__phrase_audio__/${encodeURIComponent(id)}`);

async function cacheAudio(id, audioBase64, language) {
  if (!('caches' in window) || !audioBase64) return;
  const cache = await caches.open(AUDIO_CACHE);
  await cache.put(audioRequest(id), new Response(JSON.stringify({ audioBase64, language, savedAt: Date.now() }), { headers: { 'Content-Type': 'application/json' } }));
}

async function cachedAudio(id) {
  if (!('caches' in window)) return null;
  const response = await caches.match(audioRequest(id));
  if (!response) return null;
  try { return await response.json(); } catch { return null; }
}

async function removeCachedAudio(id) {
  if (!('caches' in window)) return;
  const cache = await caches.open(AUDIO_CACHE);
  await cache.delete(audioRequest(id));
}

export function initPhrasebook({ notify, request, onPractice } = {}) {
  const view = document.querySelector('#phrasebook-view');
  const list = document.querySelector('#phrasebook-list');
  const empty = document.querySelector('#phrasebook-empty');
  const search = document.querySelector('#phrasebook-search');
  const filters = document.querySelector('#phrasebook-filters');
  const count = document.querySelector('#phrasebook-count');
  const saveCurrent = document.querySelector('#save-current-phrase');
  let activeCategory = 'all';

  function filteredItems() {
    const query = String(search?.value || '').trim().toLowerCase();
    return read().filter((item) => {
      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      const textMatch = !query || `${item.sourceText} ${item.translatedText}`.toLowerCase().includes(query);
      return categoryMatch && textMatch;
    });
  }

  function render() {
    const all = read();
    const items = filteredItems();
    if (count) count.textContent = `${all.length} ${all.length === 1 ? 'frase' : 'frases'}`;
    if (empty) empty.hidden = items.length > 0;
    if (!list) return;
    list.innerHTML = items.map((item) => `
      <article class="phrase-card" data-phrase-id="${item.id}">
        <div class="phrase-card-top"><span>${PHRASE_CATEGORIES[item.category] || 'General'}</span><small>${item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-US', { month: 'short', day: 'numeric' }) : ''}</small></div>
        <p class="phrase-source">${escapeHtml(item.sourceText)}</p>
        <p class="phrase-translation">${escapeHtml(item.translatedText)}</p>
        ${item.practiceCount ? `<span class="phrase-card-progress">✓ ${item.practiceCount} ${item.practiceCount === 1 ? 'práctica' : 'prácticas'}${item.bestScore ? ` · mejor ${item.bestScore}%` : ''}</span>` : ''}
        <div class="phrase-actions">
          <button type="button" data-action="listen">▶ Escuchar</button>
          <button type="button" data-action="practice">✦ Practicar por partes</button>
          <button type="button" data-action="copy">Copiar</button>
          <button type="button" data-action="share">Compartir</button>
          <button type="button" data-action="delete" class="danger">Eliminar</button>
        </div>
      </article>`).join('');
  }

  async function savePhrase(input, { audioBase64 = null, category = null } = {}) {
    const phrase = safePhrase({ ...input, category: category || input.category || categoryForSituation(input.situation) });
    if (!phrase.sourceText || !phrase.translatedText) throw new Error('No hay una traducción válida para guardar.');
    const items = read();
    const duplicate = items.find((item) => item.sourceText.toLowerCase() === phrase.sourceText.toLowerCase() && item.translatedText.toLowerCase() === phrase.translatedText.toLowerCase());
    const id = duplicate?.id || phrase.id;
    const stored = {
      ...phrase,
      id,
      createdAt: duplicate?.createdAt || phrase.createdAt,
      practiceCount: duplicate?.practiceCount || phrase.practiceCount || 0,
      bestScore: Math.max(duplicate?.bestScore || 0, phrase.bestScore || 0),
      lastPracticedAt: duplicate?.lastPracticedAt || phrase.lastPracticedAt || null
    };
    write([stored, ...items.filter((item) => item.id !== id)]);
    if (audioBase64) await cacheAudio(id, audioBase64, stored.targetLanguage);
    render();
    notify?.(duplicate ? 'La frase ya estaba guardada.' : 'Frase guardada para acceso rápido y offline.');
    return stored;
  }

  function recordPractice(id, { averageScore = 0 } = {}) {
    const items = read();
    const now = new Date().toISOString();
    const updated = items.map((item) => item.id === id ? {
      ...item,
      practiceCount: (Number(item.practiceCount) || 0) + 1,
      bestScore: Math.max(Number(item.bestScore) || 0, Math.max(0, Math.min(100, Number(averageScore) || 0))),
      lastPracticedAt: now
    } : item);
    write(updated);
    render();
  }

  async function saveInterpretation(result, category = null) {
    if (!result) throw new Error('Todavía no hay una traducción para guardar.');
    return savePhrase({
      sourceText: result.originalText,
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      situation: result.situation || 'everyday',
      category: category || categoryForSituation(result.situation),
      createdAt: result.createdAt || new Date().toISOString()
    }, { audioBase64: result.audioBase64, category });
  }

  async function playPhrase(item) {
    await unlockAudioPlayback();
    let audio = await cachedAudio(item.id);
    if (!audio?.audioBase64) {
      if (!navigator.onLine) throw new Error('Esta frase todavía no tiene audio guardado en este dispositivo. Conéctate una vez y toca Escuchar.');
      const result = await getOrCreateTts({
        text: item.translatedText,
        language: item.targetLanguage,
        voice: 'coral',
        speed: 1,
        create: () => request('/api/speak', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: item.translatedText, language: item.targetLanguage, voice: 'coral', speed: 1 })
        })
      });
      audio = { audioBase64: result.audioBase64, language: item.targetLanguage };
      await cacheAudio(item.id, audio.audioBase64, audio.language);
    }
    await playBase64Audio(audio.audioBase64);
  }

  async function handleAction(event) {
    const action = event.target?.dataset?.action;
    if (!action) return;
    const id = event.target.closest('[data-phrase-id]')?.dataset?.phraseId;
    const item = read().find((entry) => entry.id === id);
    if (!item) return;
    try {
      if (action === 'listen') await playPhrase(item);
      if (action === 'practice') onPractice?.(item);
      if (action === 'copy') { await navigator.clipboard.writeText(`${item.sourceText}\n${item.translatedText}`); notify?.('Frase copiada.'); }
      if (action === 'share') {
        const text = `${item.sourceText}\n\n${item.translatedText}`;
        if (navigator.share) await navigator.share({ title: 'Sin Barreras', text });
        else { await navigator.clipboard.writeText(text); notify?.('Frase copiada para compartir.'); }
      }
      if (action === 'delete') {
        write(read().filter((entry) => entry.id !== item.id));
        await removeCachedAudio(item.id);
        render();
        notify?.('Frase eliminada.');
      }
    } catch (error) { if (error?.name !== 'AbortError') notify?.(error.message || 'No pudimos completar la acción.'); }
  }

  filters?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-phrase-category]');
    if (!button) return;
    activeCategory = button.dataset.phraseCategory;
    filters.querySelectorAll('[data-phrase-category]').forEach((item) => item.classList.toggle('is-active', item === button));
    render();
  });
  search?.addEventListener('input', render);
  list?.addEventListener('click', handleAction);
  saveCurrent?.addEventListener('click', () => notify?.('Guarda una traducción desde Hablar usando “Guardar frase”.'));

  render();
  return { render, read, savePhrase, saveInterpretation, cacheAudio, recordPractice };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

import { friendlyRecognition, friendlyDifference, friendlyFocus } from './learner-feedback.js?v=1.6.6';
const LESSON_CACHE_KEY = 'sinBarreras.phraseLessons.v1';
const MAX_CACHED_LESSONS = 40;

const $ = (selector) => document.querySelector(selector);

function safeCacheRead() {
  try {
    const value = JSON.parse(localStorage.getItem(LESSON_CACHE_KEY) || '[]');
    return Array.isArray(value) ? value.slice(0, MAX_CACHED_LESSONS) : [];
  } catch { return []; }
}

function safeCacheWrite(items) {
  try { localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(items.slice(0, MAX_CACHED_LESSONS))); }
  catch { /* localStorage may be unavailable or full; lesson still works online */ }
}

function lessonKey(item = {}) {
  return [item.id, item.sourceLanguage, item.targetLanguage, item.sourceText, item.translatedText].join('|');
}

function cachedLesson(item) {
  const key = lessonKey(item);
  return safeCacheRead().find((entry) => entry.key === key)?.lesson || null;
}

function rememberLesson(item, lesson) {
  const key = lessonKey(item);
  const existing = safeCacheRead().filter((entry) => entry.key !== key);
  safeCacheWrite([{ key, lesson, savedAt: new Date().toISOString() }, ...existing]);
}

export function initPhrasePractice({ request, notify, createAutoVoiceTurn, speakText, languageName, onPoints, onComplete } = {}) {
  const ui = {
    player: $('#phrase-practice-player'), close: $('#phrase-practice-close'), progressBar: $('#phrase-practice-progress-bar'), progressCopy: $('#phrase-practice-progress-copy'), language: $('#phrase-practice-language'),
    loading: $('#phrase-practice-loading'), content: $('#phrase-practice-content'), error: $('#phrase-practice-error'), retry: $('#phrase-practice-retry'),
    sourceFull: $('#phrase-practice-source-full'), targetFull: $('#phrase-practice-target-full'), stepBadge: $('#phrase-practice-step-badge'), meaning: $('#phrase-practice-meaning'), target: $('#phrase-practice-target'), pronunciation: $('#phrase-practice-pronunciation'), tip: $('#phrase-practice-tip'),
    listen: $('#phrase-practice-listen'), slow: $('#phrase-practice-slow'), record: $('#phrase-practice-record'), score: $('#phrase-practice-score'), scoreNumber: $('#phrase-practice-score-number'), scoreFeedback: $('#phrase-practice-score-feedback'), heard: $('#phrase-practice-heard'), focus: $('#phrase-practice-focus'),
    previous: $('#phrase-practice-previous'), next: $('#phrase-practice-next'), complete: $('#phrase-practice-complete'), completeAverage: $('#phrase-practice-complete-average'), completeParts: $('#phrase-practice-complete-parts'), done: $('#phrase-practice-done')
  };

  let state = { item: null, lesson: null, steps: [], index: 0, scores: new Map(), voiceCapture: null, voiceBusy: false, completed: false };

  function showPlayer() {
    ui.player?.classList.remove('is-hidden');
    document.body.classList.add('phrase-practice-open');
  }

  function hidePlayer() {
    state.voiceCapture?.cancel?.();
    state.voiceCapture = null;
    state.voiceBusy = false;
    ui.player?.classList.add('is-hidden');
    document.body.classList.remove('phrase-practice-open');
  }

  function setLoading(message = 'Preparando la frase por partes…') {
    if (ui.loading) { ui.loading.hidden = false; ui.loading.querySelector('p').textContent = message; }
    if (ui.content) ui.content.hidden = true;
    if (ui.complete) ui.complete.hidden = true;
    if (ui.error) ui.error.hidden = true;
  }

  function setError(message) {
    if (ui.loading) ui.loading.hidden = true;
    if (ui.content) ui.content.hidden = true;
    if (ui.complete) ui.complete.hidden = true;
    if (ui.error) { ui.error.hidden = false; ui.error.querySelector('p').textContent = message; }
  }

  function buildSteps(lesson) {
    const segments = Array.isArray(lesson?.segments) ? lesson.segments : [];
    return [
      ...segments.map((segment, index) => ({ ...segment, kind: 'segment', part: index + 1, totalParts: segments.length })),
      { ...(lesson?.fullPractice || {}), kind: 'full', part: segments.length + 1, totalParts: segments.length }
    ].filter((step) => step.targetText);
  }

  function renderStep() {
    const step = state.steps[state.index];
    if (!step) return;
    if (ui.loading) ui.loading.hidden = true;
    if (ui.error) ui.error.hidden = true;
    if (ui.complete) ui.complete.hidden = true;
    if (ui.content) ui.content.hidden = false;
    const total = state.steps.length;
    const current = state.index + 1;
    const percent = Math.max(5, Math.round((current / total) * 100));
    if (ui.progressBar) ui.progressBar.style.width = `${percent}%`;
    if (ui.progressCopy) ui.progressCopy.textContent = `${current} / ${total}`;
    if (ui.language) ui.language.textContent = languageName?.(state.lesson?.targetLanguage) || state.lesson?.targetLanguage || 'IDIOMA';
    if (ui.sourceFull) ui.sourceFull.textContent = state.lesson?.sourceText || '';
    if (ui.targetFull) ui.targetFull.textContent = state.lesson?.targetText || '';
    if (ui.stepBadge) ui.stepBadge.textContent = step.kind === 'full' ? 'FRASE COMPLETA' : `PARTE ${step.part} DE ${step.totalParts}`;
    if (ui.meaning) ui.meaning.textContent = step.meaning || '';
    if (ui.target) ui.target.textContent = step.targetText || '';
    if (ui.pronunciation) ui.pronunciation.textContent = step.pronunciation || '';
    if (ui.tip) ui.tip.textContent = step.tip || '';
    if (ui.previous) ui.previous.disabled = state.index === 0;
    if (ui.next) ui.next.textContent = state.index === total - 1 ? 'TERMINAR PRÁCTICA →' : 'SIGUIENTE PARTE →';

    const result = state.scores.get(state.index);
    if (result) {
      if (ui.score) ui.score.hidden = false;
      if (ui.scoreNumber) ui.scoreNumber.textContent = `${result.score}%`;
      if (ui.scoreFeedback) ui.scoreFeedback.textContent = friendlyDifference(result);
      if (ui.heard) ui.heard.textContent = friendlyRecognition(result);
      if (ui.focus) ui.focus.textContent = friendlyFocus(result);
    } else if (ui.score) ui.score.hidden = true;

    if (ui.record) {
      ui.record.disabled = false;
      ui.record.classList.remove('recording');
      ui.record.textContent = '● Practicar mi voz';
    }
    ui.content?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  async function loadLesson(force = false) {
    if (!state.item) return;
    setLoading();
    try {
      let lesson = !force ? cachedLesson(state.item) : null;
      if (!lesson) {
        if (!navigator.onLine) throw new Error('Conéctate una vez para preparar esta frase por partes. Después la estructura de la lección quedará guardada en este dispositivo.');
        lesson = await request('/api/practice/phrase-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceText: state.item.sourceText,
            targetText: state.item.translatedText,
            nativeLanguage: state.item.sourceLanguage,
            targetLanguage: state.item.targetLanguage
          })
        });
        rememberLesson(state.item, lesson);
      }
      const steps = buildSteps(lesson);
      if (!steps.length) throw new Error('No pudimos preparar esta frase por partes.');
      state.lesson = lesson;
      state.steps = steps;
      state.index = 0;
      state.scores = new Map();
      state.completed = false;
      renderStep();
    } catch (error) {
      setError(error.message || 'No pudimos preparar esta práctica.');
    }
  }

  async function start(item) {
    if (!item?.sourceText || !item?.translatedText || !item?.sourceLanguage || !item?.targetLanguage) {
      notify?.('Esta frase no tiene suficiente información de idioma para practicarla.');
      return;
    }
    if (item.sourceLanguage === item.targetLanguage) {
      notify?.('Esta frase necesita dos idiomas diferentes para crear una práctica.');
      return;
    }
    state = { item, lesson: null, steps: [], index: 0, scores: new Map(), voiceCapture: null, voiceBusy: false, completed: false };
    showPlayer();
    await loadLesson(false);
  }

  async function listen(speed = 1) {
    const step = state.steps[state.index];
    if (!step?.targetText || !state.lesson?.targetLanguage) return;
    try {
      await speakText(step.targetText, state.lesson.targetLanguage, { speed });
    } catch (error) { notify?.(error.message || 'No pudimos reproducir esta parte.'); }
  }

  async function practiceVoice() {
    const step = state.steps[state.index];
    if (!step || state.voiceBusy) return;
    try {
      state.voiceBusy = true;
      if (ui.record) { ui.record.classList.add('recording'); ui.record.textContent = '● Escuchando…'; }
      const capture = await createAutoVoiceTurn({
        onState: (mode) => {
          if (!ui.record) return;
          if (mode === 'waiting') ui.record.textContent = '● Habla cuando estés listo';
          if (mode === 'listening') ui.record.textContent = '● Te escucho…';
          if (mode === 'thinking') ui.record.textContent = '◌ Puedes continuar…';
          if (mode === 'processing') ui.record.textContent = '✓ Revisando…';
        }
      });
      state.voiceCapture = capture;
      const audio = await capture.promise;
      state.voiceCapture = null;
      const form = new FormData();
      form.append('audio', audio, 'saved-phrase-practice.webm');
      form.append('targetText', step.targetText);
      form.append('originalIntent', step.meaning || state.lesson.sourceText || '');
      form.append('nativeLanguage', state.lesson.nativeLanguage);
      form.append('targetLanguage', state.lesson.targetLanguage);
      form.append('practiceMode', 'phrase');
      const result = await request('/api/practice/score', { method: 'POST', body: form });
      const previous = state.scores.get(state.index);
      if (!previous || Number(result.score) >= Number(previous.score)) state.scores.set(state.index, result);
      if (result.points) onPoints?.(result.points);
      renderStep();
    } catch (error) {
      if (error?.name !== 'AbortError') notify?.(error.message || 'No pudimos revisar tu pronunciación.');
    } finally {
      state.voiceCapture = null;
      state.voiceBusy = false;
      if (ui.record) { ui.record.disabled = false; ui.record.classList.remove('recording'); ui.record.textContent = '● Practicar mi voz'; }
    }
  }

  function finish() {
    if (state.completed) return;
    state.completed = true;
    if (ui.content) ui.content.hidden = true;
    if (ui.complete) ui.complete.hidden = false;
    const results = [...state.scores.values()];
    const average = results.length ? Math.round(results.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / results.length) : 0;
    if (ui.completeAverage) ui.completeAverage.textContent = results.length ? `${average}%` : '—';
    if (ui.completeParts) ui.completeParts.textContent = `${results.length} de ${state.steps.length}`;
    if (ui.progressBar) ui.progressBar.style.width = '100%';
    if (ui.progressCopy) ui.progressCopy.textContent = `${state.steps.length} / ${state.steps.length}`;
    onComplete?.(state.item, { averageScore: average, practicedSteps: results.length, totalSteps: state.steps.length });
  }

  ui.close?.addEventListener('click', hidePlayer);
  ui.retry?.addEventListener('click', () => loadLesson(true));
  ui.listen?.addEventListener('click', () => listen(1));
  ui.slow?.addEventListener('click', () => listen(0.72));
  ui.record?.addEventListener('click', practiceVoice);
  ui.previous?.addEventListener('click', () => { if (state.index > 0) { state.index -= 1; renderStep(); } });
  ui.next?.addEventListener('click', () => {
    if (state.index < state.steps.length - 1) { state.index += 1; renderStep(); }
    else finish();
  });
  ui.done?.addEventListener('click', hidePlayer);

  return { start, close: hidePlayer };
}

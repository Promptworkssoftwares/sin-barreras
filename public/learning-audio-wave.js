const BAR_COUNT = 15;
const AUDIO_SURFACE_SELECTOR = [
  '.learn-word-row',
  '.saved-word-card',
  '.phrase-card',
  '.sound-card',
  '.sound-detail',
  '.practice-result',
  '.phrase-practice-card',
  '.lesson-question-shell'
].join(',');

let activeWave = null;
let activeWaveToken = 0;
let idleTimer = null;
let observer = null;

function isElement(value) {
  return value && value.nodeType === 1;
}

function barsMarkup() {
  return Array.from({ length: BAR_COUNT }, () => '<i></i>').join('');
}

function waveMarkup() {
  return `
    <span class="learning-wave-track" data-wave-role="ai">
      <b>VOZ AI</b>
      <span class="learning-wave-bars">${barsMarkup()}</span>
      <small>LISTO</small>
    </span>
    <span class="learning-wave-track" data-wave-role="user">
      <b>TU VOZ</b>
      <span class="learning-wave-bars">${barsMarkup()}</span>
      <small>LISTO</small>
    </span>`;
}

function directWave(surface) {
  return [...surface.children].find((child) => child.classList?.contains('learning-audio-wave')) || null;
}

function ensurePermanentWave(surface) {
  if (!isElement(surface)) return null;
  const existing = directWave(surface);
  if (existing) return existing;

  const wave = document.createElement('span');
  wave.className = 'learning-audio-wave';
  wave.dataset.state = 'idle';
  wave.dataset.activeRole = 'none';
  wave.setAttribute('aria-hidden', 'true');
  wave.innerHTML = waveMarkup();
  const anchor = surface.matches('.phrase-card') ? surface.querySelector('.phrase-translation')
    : surface.matches('.saved-word-card') ? surface.querySelector('.saved-word-copy')
    : surface.matches('.phrase-practice-card') ? surface.querySelector('#phrase-practice-target')
    : surface.matches('.lesson-question-shell') ? surface.querySelector('#lesson-prompt')
    : null;
  if (anchor) anchor.after(wave);
  else surface.appendChild(wave);
  surface.classList.add('has-learning-wave');
  return wave;
}

export function installPermanentLearningWaves(root = document) {
  const surfaces = [];
  if (isElement(root) && root.matches?.(AUDIO_SURFACE_SELECTOR)) surfaces.push(root);
  if (root?.querySelectorAll) surfaces.push(...root.querySelectorAll(AUDIO_SURFACE_SELECTOR));
  surfaces.forEach(ensurePermanentWave);
  return surfaces.length;
}

function startObserver() {
  if (observer || !document?.documentElement) return;
  const boot = () => {
    installPermanentLearningWaves(document);
    if (!document.body || observer) return;
    observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!isElement(node) || node.classList?.contains('learning-audio-wave')) continue;
          installPermanentLearningWaves(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else queueMicrotask(boot);
}

function normalizeTarget(target) {
  if (typeof target === 'string') return document.querySelector(target);
  return isElement(target) ? target : null;
}

function findSurface(anchor) {
  if (!anchor) return null;
  if (anchor.matches?.(AUDIO_SURFACE_SELECTOR)) return anchor;
  return anchor.closest?.(AUDIO_SURFACE_SELECTOR) || null;
}

function fallbackSurface(anchor) {
  if (!anchor) return null;
  const host = anchor.closest?.('.sound-actions,.phrase-actions,.phrase-practice-actions,.practice-actions,.saved-word-tools,.lesson-voice-wrap') || anchor.parentElement;
  if (!host) return null;
  host.classList.add('learning-wave-fallback-host');
  return host;
}

function placeWave(target) {
  const anchor = normalizeTarget(target);
  if (!anchor) return null;
  const surface = findSurface(anchor) || fallbackSurface(anchor);
  return ensurePermanentWave(surface);
}

function clearTrackBars(track) {
  if (!track) return;
  track.querySelectorAll('.learning-wave-bars i').forEach((bar) => {
    bar.style.height = '';
    bar.style.opacity = '';
  });
}

function resetTrack(track) {
  if (!track) return;
  track.querySelector('small').textContent = 'LISTO';
  clearTrackBars(track);
}

function resetWave(wave) {
  if (!wave) return;
  wave.dataset.state = 'idle';
  wave.dataset.activeRole = 'none';
  wave.dataset.reactive = 'false';
  wave.querySelectorAll('.learning-wave-track').forEach(resetTrack);
}

function statusCopy(role, state, label) {
  if (label) return label;
  if (role === 'user') {
    if (state === 'waiting') return 'PREPARADO';
    if (state === 'listening') return 'ESCUCHANDO';
    if (state === 'processing') return 'ANALIZANDO';
    if (state === 'playing') return 'TU GRABACIÓN';
    return 'ACTIVO';
  }
  if (state === 'waiting') return 'PREPARANDO';
  if (state === 'processing') return 'PROCESANDO';
  return 'REPRODUCIENDO';
}

function updateReactiveBars(track, level, levels = null) {
  if (!track) return false;
  const bars = [...track.querySelectorAll('.learning-wave-bars i')];
  if (!Array.isArray(levels) && (level === null || !Number.isFinite(Number(level)))) return false;
  const tallTrack = Boolean(track.closest('.phrase-card,.saved-word-card,.phrase-practice-card'));
  bars.forEach((bar, index) => {
    const energy = Array.isArray(levels) && levels.length
      ? Number(levels[Math.min(levels.length - 1, Math.floor(index * levels.length / bars.length))])
      : Number(level) * 5;
    const normalized = Math.max(0, Math.min(1, energy || 0));
    bar.style.height = `${Math.round((tallTrack ? 4 : 3) + normalized * (tallTrack ? 25 : 15))}px`;
    bar.style.opacity = String(.42 + normalized * .58);
  });
  return true;
}

export function setLearningAudioWave(target, { role = 'ai', state = 'playing', level = null, label = '' } = {}) {
  clearTimeout(idleTimer);
  const wave = placeWave(target);
  if (!wave) return;

  if (activeWave && activeWave !== wave) resetWave(activeWave);
  activeWave = wave;
  activeWaveToken += 1;

  const safeRole = role === 'user' ? 'user' : 'ai';
  wave.dataset.activeRole = safeRole;
  wave.dataset.state = state || 'playing';
  const activeTrack = wave.querySelector(`[data-wave-role="${safeRole}"]`);
  const inactiveTrack = wave.querySelector(`[data-wave-role="${safeRole === 'ai' ? 'user' : 'ai'}"]`);
  resetTrack(inactiveTrack);
  resetTrack(activeTrack);
  if (activeTrack) activeTrack.querySelector('small').textContent = statusCopy(safeRole, state, label);

  const reactive = safeRole === 'user' && state === 'listening' && updateReactiveBars(activeTrack, level);
  wave.dataset.reactive = reactive ? 'true' : 'false';
}

export function hideLearningAudioWave(delay = 220) {
  if (!activeWave) return;
  clearTimeout(idleTimer);
  const wave = activeWave;
  idleTimer = window.setTimeout(() => {
    resetWave(wave);
    if (activeWave === wave) activeWave = null;
  }, Math.max(0, Number(delay) || 0));
}

export async function withLearningAudioWave(target, options, task) {
  setLearningAudioWave(target, { role: 'ai', state: 'playing', ...options });
  const wave = activeWave;
  const token = activeWaveToken;
  try {
    return await task();
  } finally {
    if (activeWave === wave && activeWaveToken === token) hideLearningAudioWave(180);
  }
}

window.addEventListener('sinbarreras:playback-level', (event) => {
  const wave = activeWave;
  if (!wave || wave.dataset.activeRole !== 'ai') return;
  const { level, levels, playing } = event.detail || {};
  if (!playing) {
    wave.dataset.reactive = 'false';
    // A previous voice is stopped just before this voice starts. Keep the
    // current label until its own playback promise settles.
    clearTrackBars(wave.querySelector('[data-wave-role="ai"]'));
    return;
  }
  const track = wave.querySelector('[data-wave-role="ai"]');
  wave.dataset.reactive = updateReactiveBars(track, level, levels) ? 'true' : 'false';
});

startObserver();

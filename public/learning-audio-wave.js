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
  surface.appendChild(wave);
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

function resetTrack(track) {
  if (!track) return;
  track.querySelector('small').textContent = 'LISTO';
  track.querySelectorAll('.learning-wave-bars i').forEach((bar) => {
    bar.style.height = '';
    bar.style.opacity = '';
  });
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

function updateReactiveBars(track, level) {
  const bars = [...track.querySelectorAll('.learning-wave-bars i')];
  const numericLevel = Number(level);
  if (!Number.isFinite(numericLevel)) return false;
  const normalized = Math.max(.05, Math.min(1, numericLevel * 12));
  const center = (bars.length - 1) / 2;
  bars.forEach((bar, index) => {
    const distance = Math.abs(index - center) / Math.max(1, center);
    const shape = .42 + ((1 - distance) * .58);
    const pulse = .84 + ((index % 4) * .055);
    bar.style.height = `${Math.round(3 + normalized * (5 + 16 * shape * pulse))}px`;
    bar.style.opacity = String(Math.min(1, .32 + normalized * .68));
  });
  return true;
}

export function setLearningAudioWave(target, { role = 'ai', state = 'playing', level = null, label = '' } = {}) {
  clearTimeout(idleTimer);
  const wave = placeWave(target);
  if (!wave) return;

  if (activeWave && activeWave !== wave) resetWave(activeWave);
  activeWave = wave;

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
  try {
    return await task();
  } finally {
    hideLearningAudioWave(180);
  }
}

startObserver();

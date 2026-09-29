let wave = null;
let hideTimer = null;
let activeAnchor = null;

const BAR_COUNT = 15;

function isElement(value) {
  return value && value.nodeType === 1;
}

function ensureWave() {
  if (wave?.isConnected) return wave;
  wave = document.createElement('span');
  wave.className = 'learning-audio-wave is-hidden';
  wave.setAttribute('aria-hidden', 'true');
  wave.innerHTML = `
    <span class="learning-wave-orb"><i></i><b></b></span>
    <span class="learning-wave-body">
      <span class="learning-wave-meta"><strong>VOZ AI</strong><small>REPRODUCIENDO</small></span>
      <span class="learning-wave-bars">${Array.from({ length: BAR_COUNT }, () => '<i></i>').join('')}</span>
    </span>`;
  return wave;
}

function normalizeTarget(target) {
  if (typeof target === 'string') return document.querySelector(target);
  return isElement(target) ? target : null;
}

function placeWave(target) {
  const anchor = normalizeTarget(target);
  if (!anchor) return null;
  const node = ensureWave();
  if (activeAnchor === anchor && node.isConnected) return anchor;

  const actionRow = anchor.closest?.('.sound-actions,.phrase-actions,.phrase-practice-actions,.practice-actions,.saved-word-tools,.lesson-question-shell,.lesson-voice-wrap');
  if (actionRow && actionRow !== anchor) {
    actionRow.insertAdjacentElement('afterend', node);
  } else if (anchor.matches?.('button,a,input,select,textarea')) {
    anchor.insertAdjacentElement('afterend', node);
  } else {
    anchor.appendChild(node);
  }
  activeAnchor = anchor;
  return anchor;
}

function resetBars() {
  if (!wave) return;
  wave.querySelectorAll('.learning-wave-bars i').forEach((bar) => {
    bar.style.height = '';
    bar.style.opacity = '';
  });
}

function roleCopy(role, state, label) {
  const isUser = role === 'user';
  if (label) return { title: isUser ? 'TU VOZ' : 'VOZ AI', status: label };
  if (state === 'waiting') return { title: isUser ? 'TU VOZ' : 'VOZ AI', status: isUser ? 'LISTO' : 'PREPARANDO' };
  if (state === 'listening') return { title: isUser ? 'TU VOZ' : 'VOZ AI', status: isUser ? 'ESCUCHANDO' : 'REPRODUCIENDO' };
  if (state === 'processing') return { title: isUser ? 'TU VOZ' : 'VOZ AI', status: 'ANALIZANDO' };
  return { title: isUser ? 'TU VOZ' : 'VOZ AI', status: isUser ? 'ACTIVA' : 'REPRODUCIENDO' };
}

export function setLearningAudioWave(target, { role = 'ai', state = 'playing', level = null, label = '' } = {}) {
  clearTimeout(hideTimer);
  const anchor = placeWave(target);
  if (!anchor) return;
  const node = ensureWave();
  const copy = roleCopy(role, state, label);
  node.dataset.role = role;
  node.dataset.state = state;
  node.querySelector('.learning-wave-meta strong').textContent = copy.title;
  node.querySelector('.learning-wave-meta small').textContent = copy.status;
  node.classList.remove('is-hidden', 'is-leaving');
  requestAnimationFrame(() => node.classList.add('is-visible'));

  const bars = [...node.querySelectorAll('.learning-wave-bars i')];
  const numericLevel = Number(level);
  if (role === 'user' && state === 'listening' && Number.isFinite(numericLevel)) {
    node.dataset.reactive = 'true';
    const normalized = Math.max(.06, Math.min(1, numericLevel * 12));
    const center = (bars.length - 1) / 2;
    bars.forEach((bar, index) => {
      const distance = Math.abs(index - center) / Math.max(1, center);
      const shape = .46 + ((1 - distance) * .54);
      const jitter = .82 + ((index % 4) * .06);
      bar.style.height = `${Math.round(4 + normalized * (6 + 22 * shape * jitter))}px`;
      bar.style.opacity = String(Math.min(1, .38 + normalized * .62));
    });
  } else {
    node.dataset.reactive = 'false';
    resetBars();
  }
}

export function hideLearningAudioWave(delay = 260) {
  if (!wave) return;
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    wave?.classList.add('is-leaving');
    wave?.classList.remove('is-visible');
    window.setTimeout(() => {
      wave?.classList.add('is-hidden');
      wave?.classList.remove('is-leaving');
      resetBars();
      if (wave) wave.dataset.reactive = 'false';
      activeAnchor = null;
    }, 180);
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

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

let context = null;
let masterGain = null;
let currentSource = null;
let currentMedia = null;
let silentObjectUrl = null;
let unlockStarted = false;
let unlocked = false;
let destroyed = false;

const gestureEvents = ['pointerdown', 'touchstart', 'keydown'];

function makeSilentWavBlob() {
  const sampleRate = 22050;
  const frameCount = 220;
  const buffer = new ArrayBuffer(44 + frameCount * 2);
  const view = new DataView(buffer);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + frameCount * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, frameCount * 2, true);
  return new Blob([buffer], { type: 'audio/wav' });
}

function getContext() {
  if (!AudioContextClass) return null;
  if (!context || context.state === 'closed') {
    context = new AudioContextClass({ latencyHint: 'interactive' });
    masterGain = context.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(context.destination);
  }
  return context;
}

function getPersistentMediaElement() {
  if (currentMedia) return currentMedia;
  const audio = document.createElement('audio');
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');
  audio.style.position = 'fixed';
  audio.style.width = '1px';
  audio.style.height = '1px';
  audio.style.opacity = '0';
  audio.style.pointerEvents = 'none';
  audio.style.left = '-9999px';
  document.body?.appendChild(audio);
  currentMedia = audio;
  return audio;
}

function base64ToArrayBuffer(base64) {
  const binary = atob(String(base64 || ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64ToDataUrl(base64) {
  return `data:audio/mpeg;base64,${base64}`;
}

function createSilentPulse(audioContext) {
  const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate || 22050);
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  gain.gain.value = 0;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start(0);
}

async function primeMediaElement() {
  const media = getPersistentMediaElement();
  if (!silentObjectUrl) silentObjectUrl = URL.createObjectURL(makeSilentWavBlob());
  if (media.src !== silentObjectUrl) media.src = silentObjectUrl;
  media.currentTime = 0;
  try {
    await media.play();
    media.pause();
    media.currentTime = 0;
  } catch {
    // Web Audio is the primary path; this media element is only a compatibility fallback.
  }
}

export async function unlockAudioPlayback() {
  if (destroyed) return false;
  unlockStarted = true;
  const audioContext = getContext();
  if (!audioContext) {
    await primeMediaElement();
    unlocked = true;
    return true;
  }

  try {
    const resumePromise = audioContext.state === 'running' ? Promise.resolve() : audioContext.resume();
    createSilentPulse(audioContext);
    void primeMediaElement();
    await resumePromise;
    unlocked = audioContext.state === 'running';
    return unlocked;
  } catch {
    unlocked = false;
    return false;
  }
}

async function ensureAudioRunning() {
  if (!unlockStarted) await unlockAudioPlayback();
  const audioContext = getContext();
  if (!audioContext) return null;
  if (audioContext.state !== 'running') {
    try { await audioContext.resume(); } catch { /* handled below */ }
  }
  if (audioContext.state !== 'running') {
    const error = new Error('El audio necesita un toque para activarse. Toca cualquier parte de la app una vez.');
    error.name = 'AudioPlaybackBlockedError';
    throw error;
  }
  unlocked = true;
  return audioContext;
}

export function stopAudioPlayback() {
  if (currentSource) {
    try { currentSource.onended = null; } catch { /* no-op */ }
    try { currentSource.stop(0); } catch { /* no-op */ }
    try { currentSource.disconnect(); } catch { /* no-op */ }
    currentSource = null;
  }
  if (currentMedia) {
    try { currentMedia.pause(); } catch { /* no-op */ }
    try { currentMedia.removeAttribute('src'); currentMedia.load(); } catch { /* no-op */ }
  }
}

async function playWithWebAudio(base64) {
  const audioContext = await ensureAudioRunning();
  if (!audioContext) throw new Error('Web Audio no está disponible.');
  const raw = base64ToArrayBuffer(base64);
  const decoded = await audioContext.decodeAudioData(raw.slice(0));

  stopAudioPlayback();
  const source = audioContext.createBufferSource();
  source.buffer = decoded;
  source.connect(masterGain || audioContext.destination);
  currentSource = source;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      if (currentSource === source) currentSource = null;
      try { source.disconnect(); } catch { /* no-op */ }
      if (error) reject(error);
      else resolve();
    };
    source.onended = () => finish();
    try { source.start(0); }
    catch (error) { finish(error); }
  });
}

async function playWithMediaElement(base64) {
  const media = getPersistentMediaElement();
  stopAudioPlayback();
  media.src = base64ToDataUrl(base64);
  media.currentTime = 0;
  media.load();

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      media.removeEventListener('ended', ended);
      media.removeEventListener('error', failed);
    };
    const ended = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const failed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('No se pudo reproducir la voz.'));
    };
    media.addEventListener('ended', ended, { once: true });
    media.addEventListener('error', failed, { once: true });
    media.play().catch((error) => {
      cleanup();
      const blocked = new Error('El navegador pausó el audio. Toca la app una vez para reactivarlo.');
      blocked.name = error?.name === 'NotAllowedError' ? 'AudioPlaybackBlockedError' : (error?.name || 'AudioPlaybackError');
      reject(blocked);
    });
  });
}

export async function playBase64Audio(base64) {
  if (!base64) throw new Error('No recibimos audio para reproducir.');
  try {
    return await playWithWebAudio(base64);
  } catch (webAudioError) {
    try {
      return await playWithMediaElement(base64);
    } catch (mediaError) {
      if (webAudioError?.name === 'AudioPlaybackBlockedError') throw webAudioError;
      throw mediaError;
    }
  }
}

function gestureUnlockHandler() {
  void unlockAudioPlayback();
}

export function installAudioUnlock() {
  gestureEvents.forEach((eventName) => {
    window.addEventListener(eventName, gestureUnlockHandler, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && context?.state === 'suspended' && unlocked) {
      context.resume().catch(() => {});
    }
  });
}

export function destroyAudioPlayback() {
  destroyed = true;
  gestureEvents.forEach((eventName) => window.removeEventListener(eventName, gestureUnlockHandler, true));
  stopAudioPlayback();
  if (silentObjectUrl) URL.revokeObjectURL(silentObjectUrl);
  silentObjectUrl = null;
  if (currentMedia?.isConnected) currentMedia.remove();
  currentMedia = null;
  if (context && context.state !== 'closed') context.close().catch(() => {});
  context = null;
  masterGain = null;
}

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

let context = null;
let masterGain = null;
let currentSource = null;
let currentMedia = null;
let currentMediaObjectUrl = null;
let finishCurrentPlayback = null;
let currentMeterSource = null;
let currentMeterAnalyser = null;
let currentMeterFrame = 0;
let silentObjectUrl = null;
let unlockStarted = false;
let unlockPromise = null;
let unlocked = false;
let mediaPrimed = false;
let destroyed = false;

const gestureEvents = ['pointerdown', 'touchstart', 'keydown'];
const mobilePlayback = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
  || (/Macintosh/i.test(navigator.userAgent || '') && navigator.maxTouchPoints > 1);

function reportPlaybackLevel(level, playing, levels = []) {
  window.dispatchEvent(new CustomEvent('sinbarreras:playback-level', { detail: { level, levels, playing } }));
}

function stopPlaybackMeter(owner = null) {
  if (owner && currentMeterSource !== owner) return;
  if (currentMeterFrame) window.cancelAnimationFrame(currentMeterFrame);
  currentMeterFrame = 0;
  try { currentMeterAnalyser?.disconnect(); } catch { /* no-op */ }
  currentMeterAnalyser = null;
  currentMeterSource = null;
  reportPlaybackLevel(0, false);
}

function connectPlaybackMeter(source, audioContext, owner = source) {
  if (!audioContext.createAnalyser) {
    source.connect(masterGain || audioContext.destination);
    currentMeterSource = owner;
    reportPlaybackLevel(null, true);
    return;
  }
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = .55;
  source.connect(analyser);
  analyser.connect(masterGain || audioContext.destination);
  currentMeterSource = owner;
  currentMeterAnalyser = analyser;
  const samples = new Uint8Array(analyser.fftSize);
  const previous = new Float32Array(15);
  let recentPeak = .045;
  const tick = () => {
    if (currentMeterSource !== owner) return;
    analyser.getByteTimeDomainData(samples);
    const energyByBand = Array.from(previous, (_, index) => {
      let power = 0;
      const start = Math.floor(index * samples.length / previous.length);
      const end = Math.floor((index + 1) * samples.length / previous.length);
      for (let offset = start; offset < end; offset += 1) {
        const sample = (samples[offset] - 128) / 128;
        power += sample * sample;
      }
      return Math.sqrt(power / (end - start));
    });
    recentPeak = Math.max(.045, ...energyByBand, recentPeak * .96);
    const levels = energyByBand.map((rms, index) => {
      const energy = Math.min(1, Math.max(0, (rms - .008) / (recentPeak * .85)));
      previous[index] = previous[index] * .32 + energy * .68;
      return Number(previous[index].toFixed(3));
    });
    reportPlaybackLevel(Math.max(...levels), true, levels);
    currentMeterFrame = window.requestAnimationFrame(tick);
  };
  currentMeterFrame = window.requestAnimationFrame(tick);
}

// Decode the same audio only for its waveform. Never connect the media element
// to Web Audio: doing so reroutes the audible output through a context that can
// be suspended or inaudible in mobile browsers and Android WebView.
async function measureMediaPlayback(media, base64) {
  currentMeterSource = media;
  reportPlaybackLevel(null, true);
  try {
    const audioContext = getContext();
    if (!audioContext?.decodeAudioData) return;
    const decoded = await audioContext.decodeAudioData(base64ToArrayBuffer(base64));
    if (currentMeterSource !== media || !decoded?.getChannelData) return;
    const samples = decoded.getChannelData(0);
    const rate = decoded.sampleRate;
    if (!samples?.length || !rate) return;
    const previous = new Float32Array(15);
    let recentPeak = .045;
    const tick = () => {
      if (currentMeterSource !== media) return;
      const start = Math.min(samples.length - 1, Math.max(0, Math.floor((media.currentTime || 0) * rate)));
      const windowSize = Math.max(15, Math.floor(rate * .09));
      const levels = Array.from(previous, (_, index) => {
        const from = Math.min(samples.length - 1, start + Math.floor(index * windowSize / 15));
        const to = Math.min(samples.length, start + Math.floor((index + 1) * windowSize / 15));
        let power = 0;
        let count = 0;
        for (let sample = from; sample < to; sample += Math.max(1, Math.floor((to - from) / 24))) {
          power += samples[sample] * samples[sample];
          count += 1;
        }
        const rms = Math.sqrt(power / Math.max(1, count));
        recentPeak = Math.max(.045, rms, recentPeak * .96);
        const level = Math.min(1, Math.max(0, (rms - .008) / (recentPeak * .85)));
        previous[index] = previous[index] * .32 + level * .68;
        return Number(previous[index].toFixed(3));
      });
      reportPlaybackLevel(Math.max(...levels), true, levels);
      currentMeterFrame = window.requestAnimationFrame(tick);
    };
    currentMeterFrame = window.requestAnimationFrame(tick);
  } catch { /* Native audio remains audible even if waveform decoding fails. */ }
}

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
    mediaPrimed = true;
  } catch {
    mediaPrimed = false;
  }
}

export function unlockAudioPlayback() {
  if (destroyed) return Promise.resolve(false);
  if (unlockPromise) return unlockPromise;
  if (unlocked && (!context || context.state === 'running') && (!mobilePlayback || mediaPrimed)) return Promise.resolve(true);
  unlockStarted = true;
  unlockPromise = (async () => {
    const audioContext = getContext();
    if (!audioContext) {
      await primeMediaElement();
      unlocked = true;
      return true;
    }
    try {
      const resumePromise = audioContext.state === 'running' ? Promise.resolve() : audioContext.resume();
      createSilentPulse(audioContext);
      // Finish priming before a phrase can reuse this same media element.
      await Promise.all([resumePromise, finishCurrentPlayback ? Promise.resolve() : primeMediaElement()]);
      unlocked = audioContext.state === 'running' && (!mobilePlayback || mediaPrimed);
      return unlocked;
    } catch {
      unlocked = false;
      return false;
    }
  })().finally(() => { unlockPromise = null; });
  return unlockPromise;
}

async function ensureAudioRunning() {
  if (unlockPromise) await unlockPromise;
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
  stopPlaybackMeter();
  const finish = finishCurrentPlayback;
  finishCurrentPlayback = null;
  finish?.();
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
  if (currentMediaObjectUrl) URL.revokeObjectURL(currentMediaObjectUrl);
  currentMediaObjectUrl = null;
}

async function playWithWebAudio(base64) {
  const audioContext = await ensureAudioRunning();
  if (!audioContext) throw new Error('Web Audio no está disponible.');
  const raw = base64ToArrayBuffer(base64);
  const decoded = await audioContext.decodeAudioData(raw.slice(0));

  stopAudioPlayback();
  const source = audioContext.createBufferSource();
  source.buffer = decoded;
  connectPlaybackMeter(source, audioContext);
  currentSource = source;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      if (finishCurrentPlayback === finish) finishCurrentPlayback = null;
      if (currentSource === source) currentSource = null;
      stopPlaybackMeter(source);
      try { source.disconnect(); } catch { /* no-op */ }
      if (error) reject(error);
      else resolve();
    };
    source.onended = () => finish();
    finishCurrentPlayback = finish;
    try { source.start(0); }
    catch (error) { finish(error); }
  });
}

async function playWithMediaElement(base64) {
  const media = getPersistentMediaElement();
  stopAudioPlayback();
  currentMediaObjectUrl = URL.createObjectURL?.(new Blob([base64ToArrayBuffer(base64)], { type: 'audio/mpeg' })) || null;
  media.src = currentMediaObjectUrl || `data:audio/mpeg;base64,${base64}`;
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
      if (finishCurrentPlayback === ended) finishCurrentPlayback = null;
      stopPlaybackMeter(media);
      cleanup();
      resolve();
    };
    const failed = () => {
      if (settled) return;
      settled = true;
      if (finishCurrentPlayback === ended) finishCurrentPlayback = null;
      stopPlaybackMeter(media);
      cleanup();
      reject(new Error('No se pudo reproducir la voz.'));
    };
    media.addEventListener('ended', ended, { once: true });
    media.addEventListener('error', failed, { once: true });
    finishCurrentPlayback = ended;
    Promise.resolve(media.play()).then(() => {
      if (!settled) void measureMediaPlayback(media, base64);
    }).catch((error) => {
      if (settled) return;
      settled = true;
      if (finishCurrentPlayback === ended) finishCurrentPlayback = null;
      stopPlaybackMeter(media);
      cleanup();
      const blocked = new Error('El navegador pausó el audio. Toca la app una vez para reactivarlo.');
      blocked.name = error?.name === 'NotAllowedError' ? 'AudioPlaybackBlockedError' : (error?.name || 'AudioPlaybackError');
      reject(blocked);
    });
  });
}

export async function playBase64Audio(base64) {
  if (!base64) throw new Error('No recibimos audio para reproducir.');
  if (mobilePlayback) {
    try { return await playWithMediaElement(base64); }
    catch (mediaError) {
      if (mediaError?.name === 'AudioPlaybackBlockedError') throw mediaError;
      return playWithWebAudio(base64);
    }
  }
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
  if (unlocked && (!context || context.state === 'running') && (!mobilePlayback || mediaPrimed)) return;
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
  unlockPromise = null;
  unlocked = false;
  mediaPrimed = false;
}

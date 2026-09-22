import { getMicrophoneStream } from './microphone.js?v=1.6.5';

const DEFAULTS = Object.freeze({
  thinkingAfterMs: 420,
  shortSpeechSilenceMs: 1800,
  normalSpeechSilenceMs: 1450,
  longSpeechSilenceMs: 1200,
  noSpeechTimeoutMs: 45_000,
  maxTurnMs: 45_000,
  minVoiceFrames: 3,
  minThreshold: 0.018,
  noiseMultiplier: 2.35
});

const abortError = () => {
  const error = new Error('Grabación cancelada.');
  error.name = 'AbortError';
  return error;
};

export async function createAutoVoiceTurn(options = {}) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    throw new Error('Este navegador no permite grabar audio. Usa Chrome, Safari o Edge actualizado.');
  }

  const config = { ...DEFAULTS, ...options };
  const onState = typeof config.onState === 'function' ? config.onState : () => {};
  const stream = await getMicrophoneStream();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();
  await audioContext.resume();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);

  const chunks = [];
  const mimeOptions = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus' } : undefined;
  const recorder = new MediaRecorder(stream, mimeOptions);
  let frame = null;
  let done = false;
  let cancelled = false;
  let heardVoice = false;
  let voiceFrames = 0;
  let noiseFloor = 0.008;
  let silenceSince = null;
  let voiceStartedAt = null;
  let lastVoiceAt = null;
  const startedAt = performance.now();

  const averageVolume = () => {
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    return data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length / 128;
  };

  const silenceLimit = () => {
    const spokenFor = Math.max(0, (lastVoiceAt || performance.now()) - (voiceStartedAt || lastVoiceAt || performance.now()));
    if (spokenFor < 900) return config.shortSpeechSilenceMs;
    if (spokenFor < 3200) return config.normalSpeechSilenceMs;
    return config.longSpeechSilenceMs;
  };

  const cleanup = async () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    stream.getTracks().forEach((track) => track.stop());
    try { await audioContext.close(); } catch { /* noop */ }
  };

  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => { resolvePromise = resolve; rejectPromise = reject; });

  const stop = (reason = 'silence') => {
    if (done) return;
    done = true;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    onState('processing', { reason });
    if (recorder.state === 'recording') recorder.stop();
    else cleanup();
  };

  const cancel = () => {
    if (done) return;
    cancelled = true;
    stop('cancel');
  };

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size) chunks.push(event.data);
  });

  recorder.addEventListener('stop', async () => {
    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    await cleanup();
    if (cancelled) return rejectPromise(abortError());
    if (!heardVoice || blob.size < 800) return rejectPromise(new Error('No pude escuchar suficiente voz. Inténtalo otra vez.'));
    resolvePromise(blob);
  }, { once: true });

  const monitor = () => {
    if (done || recorder.state !== 'recording') return;
    const now = performance.now();
    const volume = averageVolume();

    if (!heardVoice) noiseFloor = Math.max(0.004, Math.min(0.03, (noiseFloor * .96) + (volume * .04)));
    const threshold = Math.max(config.minThreshold, noiseFloor * config.noiseMultiplier);
    const voiceNow = volume > threshold;

    if (voiceNow) {
      voiceFrames += 1;
      lastVoiceAt = now;
      silenceSince = null;
      if (!heardVoice && voiceFrames >= config.minVoiceFrames) {
        heardVoice = true;
        voiceStartedAt = now;
        onState('listening', { volume, threshold });
      } else if (heardVoice) {
        onState('listening', { volume, threshold });
      }
    } else {
      voiceFrames = Math.max(0, voiceFrames - 1);
      if (heardVoice) {
        if (!silenceSince) silenceSince = now;
        const silentFor = now - silenceSince;
        const limit = silenceLimit();
        if (silentFor >= config.thinkingAfterMs && silentFor < limit) onState('thinking', { silentFor, limit });
        if (silentFor >= limit) return stop('silence');
      } else if (now - startedAt >= config.noSpeechTimeoutMs) {
        return stop('no-speech');
      }
    }

    if (heardVoice && now - startedAt >= config.maxTurnMs) return stop('max-turn');
    frame = requestAnimationFrame(monitor);
  };

  recorder.start();
  onState('waiting', {});
  frame = requestAnimationFrame(monitor);
  return { promise, cancel, recorder };
}

import test from 'node:test';
import assert from 'node:assert/strict';

test('AI playback publishes measured bar levels and stops them when the voice ends', async () => {
  const events = [];
  const frames = [];
  const sources = [];
  let primePlayCount = 0;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousCustomEvent = globalThis.CustomEvent;

  class FakeAudioContext {
    state = 'running';
    destination = {};
    sampleRate = 22050;
    close() { this.state = 'closed'; return Promise.resolve(); }
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    createBuffer() { return {}; }
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start() {}, stop() {}, onended: null };
      sources.push(source);
      return source;
    }
    createAnalyser() {
      return {
        fftSize: 2048,
        connect() {}, disconnect() {},
        getByteTimeDomainData(samples) {
          samples.fill(128);
          for (let index = 0; index < 136; index += 1) samples[index] = index % 2 ? 192 : 64;
        }
      };
    }
    decodeAudioData() { return Promise.resolve({}); }
  }

  try {
    globalThis.window = {
      AudioContext: FakeAudioContext,
      dispatchEvent(event) { events.push(event.detail); },
      removeEventListener() {},
      requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
      cancelAnimationFrame() {}
    };
    globalThis.document = {
      body: { appendChild() {} },
      createElement() {
        return {
          style: {}, setAttribute() {}, play: async () => { primePlayCount += 1; }, pause() {},
          removeAttribute() {}, load() {}, currentTime: 0, src: ''
        };
      }
    };
    globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };

    const { playBase64Audio, unlockAudioPlayback, destroyAudioPlayback } = await import('../public/audio-playback.js?meter-test');
    const firstUnlock = unlockAudioPlayback();
    assert.equal(firstUnlock, unlockAudioPlayback(), 'simultaneous gesture and click must share one unlock');
    await firstUnlock;
    assert.equal(primePlayCount, 1);
    const done = playBase64Audio('AAAA');
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(frames.length > 0, 'the analyser must schedule a measured frame');
    frames.shift()();
    const active = events.find((event) => event.playing && event.levels?.length === 15);
    assert.ok(active, 'playback must publish fifteen measured bars');
    await unlockAudioPlayback();
    assert.equal(primePlayCount, 1, 'a new touch must not prime over active speech');
    assert.ok(active.levels[0] > 0, 'an audible segment must rise');
    assert.equal(active.levels[10], 0, 'a silent segment must stay at rest');
    sources.at(-1).onended();
    await done;
    assert.equal(events.at(-1).playing, false);
    assert.equal(events.at(-1).level, 0);
    destroyAudioPlayback();
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.CustomEvent = previousCustomEvent;
  }
});

test('mobile voice plays directly through native audio while measuring the real sound without rerouting it', async () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousCustomEvent = globalThis.CustomEvent;
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const events = [];
  const frames = [];
  const media = {
    src: '', currentTime: 0, playCount: 0, blockNext: false, style: {}, listeners: new Map(),
    setAttribute() {}, removeAttribute() { this.src = ''; }, load() {}, pause() {},
    play() {
      this.playCount += 1;
      if (this.blockNext) return Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
      return Promise.resolve();
    },
    addEventListener(type, callback) { this.listeners.set(type, callback); },
    removeEventListener(type) { this.listeners.delete(type); },
    emit(type) { this.listeners.get(type)?.(); }
  };
  let outputSources = 0;
  class FakeAudioContext {
    state = 'running'; destination = {}; sampleRate = 22050;
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    createBuffer() { return {}; }
    createBufferSource() { return { connect() {}, start() { outputSources += 1; } }; }
    decodeAudioData() {
      const samples = new Float32Array(22050);
      for (let i = 0; i < samples.length; i += 1) samples[i] = i % 2 ? .6 : -.6;
      return Promise.resolve({ getChannelData: () => samples, sampleRate: 22050 });
    }
    createMediaElementSource() { throw new Error('Native audio must never be rerouted'); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'Android Mobile', maxTouchPoints: 1 } });
    globalThis.window = {
      AudioContext: FakeAudioContext,
      dispatchEvent(event) { events.push(event.detail); },
      requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
      cancelAnimationFrame() {}, removeEventListener() {}
    };
    globalThis.document = { body: { appendChild() {} }, createElement: () => media };
    globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
    const { unlockAudioPlayback, playBase64Audio, destroyAudioPlayback } = await import('../public/audio-playback.js?mobile-audio-test');
    await unlockAudioPlayback();
    const playback = playBase64Audio('AAAA');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(media.playCount, 2, 'one gesture prime and one real voice play');
    assert.match(media.src, /^blob:/);
    assert.equal(outputSources, 1, 'Web Audio starts only the silent unlock pulse');
    media.currentTime = .2;
    frames.shift()?.();
    assert.ok(events.some((event) => event.playing && event.levels?.some((level) => level > 0)), 'waveform comes from decoded voice');
    media.emit('ended');
    await playback;
    assert.equal(events.at(-1).playing, false);
    media.blockNext = true;
    await assert.rejects(playBase64Audio('AAAA'), { name: 'AudioPlaybackBlockedError' });
    assert.equal(outputSources, 1, 'a blocked native play must not start sound outside the required tap');
    destroyAudioPlayback();
  } finally {
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator);
    else delete globalThis.navigator;
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.CustomEvent = previousCustomEvent;
  }
});

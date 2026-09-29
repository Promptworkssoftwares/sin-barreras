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

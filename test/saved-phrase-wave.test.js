import test from 'node:test';
import assert from 'node:assert/strict';

test('Escuchar keeps the saved phrase AI label and moves its bars with measured audio', async () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const listeners = new Map();
  const surface = {
    nodeType: 1, children: [],
    matches: (selector) => selector === '.phrase-card',
    querySelector: () => null,
    appendChild(node) { this.children.push(node); },
    classList: { add() {} }
  };
  const tracks = ['ai', 'user'].map((role) => {
    const label = { textContent: 'LISTO' };
    const bars = Array.from({ length: 15 }, () => ({ style: {} }));
    return {
      role, label, bars, closest: () => surface,
      querySelector: () => label,
      querySelectorAll: () => bars
    };
  });
  const wave = {
    nodeType: 1, dataset: {},
    classList: { contains: (name) => name === 'learning-audio-wave' },
    setAttribute() {},
    set innerHTML(_markup) {},
    querySelector(selector) { return tracks.find((track) => selector.includes(`"${track.role}"`)); },
    querySelectorAll() { return tracks; }
  };
  const button = { nodeType: 1, matches: () => false, closest: () => surface };

  try {
    globalThis.window = {
      addEventListener(name, callback) { listeners.set(name, callback); },
      setTimeout,
      dispatchEvent(event) { listeners.get(event.type)?.(event); }
    };
    globalThis.document = { documentElement: null, createElement: () => wave };
    const { withLearningAudioWave } = await import('../public/learning-audio-wave.js?saved-phrase-test');
    let finish;
    const playback = withLearningAudioWave(button, { role: 'ai', label: 'REPRODUCIENDO' }, () => new Promise((resolve) => { finish = resolve; }));
    window.dispatchEvent({ type: 'sinbarreras:playback-level', detail: { playing: false, level: 0 } });
    assert.equal(tracks[0].label.textContent, 'REPRODUCIENDO');
    window.dispatchEvent({ type: 'sinbarreras:playback-level', detail: { playing: true, level: .8, levels: [1, ...Array(14).fill(0)] } });
    assert.equal(wave.dataset.reactive, 'true');
    assert.equal(tracks[0].bars[0].style.height, '29px');
    assert.equal(tracks[0].bars[10].style.height, '4px');
    finish();
    await playback;
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

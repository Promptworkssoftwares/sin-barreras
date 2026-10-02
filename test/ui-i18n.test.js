import test from 'node:test';
import assert from 'node:assert/strict';
import { getUiLocale, initUiI18n, setUiLocale, tUi } from '../public/ui-i18n.js';

// A small DOM fixture tests the actual locale switch without a browser dependency.
test('switching app language translates interface copy and preserves conversation content', () => {
  const values = new Map([['sinBarreras.settings.v2', JSON.stringify({ uiLocale: 'en', translatorVoice: 'coral' })]]);
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value))
  };
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'es-US' }, configurable: true });
  globalThis.Node = { ELEMENT_NODE: 1, TEXT_NODE: 3 };
  globalThis.NodeFilter = { SHOW_ELEMENT: 1, SHOW_TEXT: 4 };
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  let onMutations;
  globalThis.MutationObserver = class {
    constructor(callback) { onMutations = callback; }
    observe() {}
  };
  const events = [];
  globalThis.window = { dispatchEvent: (event) => events.push(event), SinBarrerasCloud: { queueSync: () => {} } };

  class Element {
    nodeType = 1;
    children = [];
    attrs = new Map();
    constructor(tag, id = '') { this.tag = tag; this.id = id; }
    append(child) { child.parentElement = this; this.children.push(child); return child; }
    closest(selector) {
      const selectors = selector.split(',').map((part) => part.trim());
      for (let element = this; element; element = element.parentElement) {
        if (selectors.some((part) => part === `#${element.id}` || part === element.tag || (part === '[data-ui-locale]' && element.tag === 'select'))) return element;
      }
      return null;
    }
    matches(selector) { return Boolean(this.closest(selector) === this); }
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    setAttribute(name, value) { this.attrs.set(name, value); }
  }
  const node = (value) => ({ nodeType: 3, nodeValue: value });
  const root = new Element('html');
  const title = root.append(new Element('h1')).append(node('Aprender'));
  const translation = root.append(new Element('div', 'translation-text')).append(node('La traducción se reproducirá en voz alta.'));
  const select = root.append(new Element('select'));
  const walkerNodes = (element) => element.children.flatMap((child) => child.nodeType === 1 ? [child, ...walkerNodes(child)] : [child]);
  globalThis.document = {
    documentElement: root,
    querySelectorAll: (selector) => selector === '[data-ui-locale]' ? [select] : [],
    createTreeWalker: (element) => {
      const nodes = walkerNodes(element);
      let index = 0;
      return { nextNode: () => nodes[index++] ?? null };
    }
  };
  select.addEventListener = () => {};

  initUiI18n();
  assert.equal(getUiLocale(), 'en');
  assert.equal(title.nodeValue, 'Learn');
  assert.equal(translation.nodeValue, 'The translation will play aloud.');
  assert.equal(select.value, 'en');

  // This text happens to equal an interface key, yet it is translated content.
  translation.nodeValue = 'Trabajo';
  onMutations([{ type: 'characterData', target: translation, addedNodes: [] }]);
  assert.equal(translation.nodeValue, 'Trabajo');
  assert.equal(tUi('Practicar'), 'Practice');
  assert.equal(tUi('TU SIGUIENTE PASO'), 'YOUR NEXT STEP');
  assert.equal(tUi('Reintentar resumen'), 'Retry summary');

  setUiLocale('es');
  assert.equal(title.nodeValue, 'Aprender');
  assert.equal(translation.nodeValue, 'Trabajo');
  assert.equal(select.value, 'es');
  assert.equal(root.lang, 'es');
  assert.equal(tUi('Practicar'), 'Practicar');
  assert.equal(JSON.parse(values.get('sinBarreras.settings.v2')).uiLocale, 'es');
  assert.equal(JSON.parse(values.get('sinBarreras.settings.v2')).translatorVoice, 'coral');
  assert.equal(events.at(-1).detail.locale, 'es');
});

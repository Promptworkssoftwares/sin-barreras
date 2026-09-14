import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLoopbackDnsServer,
  parseDnsServers,
  shouldUseImmediateFallback
} from '../config/mongoDns.js';

test('detecta resolvers loopback usados por proxies DNS locales', () => {
  assert.equal(isLoopbackDnsServer('127.0.0.1'), true);
  assert.equal(isLoopbackDnsServer('127.0.0.53'), true);
  assert.equal(isLoopbackDnsServer('::1'), true);
  assert.equal(isLoopbackDnsServer('8.8.8.8'), false);
});

test('activa fallback inmediato si todos los DNS son loopback', () => {
  assert.equal(shouldUseImmediateFallback(['127.0.0.1']), true);
  assert.equal(shouldUseImmediateFallback(['127.0.0.1', '::1']), true);
  assert.equal(shouldUseImmediateFallback(['127.0.0.1', '8.8.8.8']), false);
});

test('normaliza DNS configurados y prioriza Google por defecto', () => {
  assert.deepEqual(parseDnsServers(' 8.8.8.8, 1.1.1.1,8.8.8.8 '), ['8.8.8.8', '1.1.1.1']);
  assert.deepEqual(parseDnsServers(''), ['8.8.8.8', '1.1.1.1']);
});

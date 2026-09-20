const CACHE_NAME = 'sin-barreras-tts-v1';
const CACHE_PREFIX = '/__tts_cache__/';
const MAX_LOCAL_TTS_ITEMS = 180;

async function digestKey(value) {
  const text = String(value || '');
  try {
    if (globalThis.crypto?.subtle && globalThis.TextEncoder) {
      const bytes = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* use deterministic fallback below */ }
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function cacheRequest({ text, language, voice, speed }) {
  const normalized = [
    String(text || '').normalize('NFKC').replace(/\s+/gu, ' ').trim(),
    String(language || '').trim(),
    String(voice || 'coral').trim(),
    Number(speed || 1).toFixed(2)
  ].join('|');
  const hash = await digestKey(normalized);
  return new Request(`${location.origin}${CACHE_PREFIX}${hash}`);
}

async function trimCache(cache) {
  try {
    const keys = await cache.keys();
    const extra = Math.max(0, keys.length - MAX_LOCAL_TTS_ITEMS);
    for (let index = 0; index < extra; index += 1) await cache.delete(keys[index]);
  } catch { /* cache cleanup is best effort */ }
}

export async function getLocalTts({ text, language, voice = 'coral', speed = 1 } = {}) {
  if (!('caches' in window) || !text || !language) return null;
  try {
    const response = await caches.match(await cacheRequest({ text, language, voice, speed }));
    if (!response) return null;
    const payload = await response.json();
    return typeof payload?.audioBase64 === 'string' && payload.audioBase64.length > 100 ? payload : null;
  } catch { return null; }
}

export async function setLocalTts({ text, language, voice = 'coral', speed = 1, audioBase64 } = {}) {
  if (!('caches' in window) || !text || !language || !audioBase64) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const request = await cacheRequest({ text, language, voice, speed });
    await cache.put(request, new Response(JSON.stringify({ audioBase64, language, voice, speed, savedAt: Date.now() }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=31536000' }
    }));
    void trimCache(cache);
  } catch { /* app still works through the server when storage is unavailable */ }
}

export async function getOrCreateTts({ text, language, voice = 'coral', speed = 1, create } = {}) {
  const cached = await getLocalTts({ text, language, voice, speed });
  if (cached?.audioBase64) return { ...cached, cache: 'device' };
  if (typeof create !== 'function') throw new Error('No hay una fuente de audio disponible.');
  const result = await create();
  if (result?.audioBase64) await setLocalTts({ text, language, voice, speed, audioBase64: result.audioBase64 });
  return { ...result, cache: result?.cache || 'server' };
}

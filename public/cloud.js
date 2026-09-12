const KEYS = {
  history: 'sinBarreras.history.v2',
  settings: 'sinBarreras.settings.v2',
  onboarding: 'sinBarreras.onboarded.v2',
  practicePoints: 'sinBarreras.practicePoints',
  learning: 'sinBarreras.learn.v1',
  sounds: 'sinBarreras.sounds.v1'
};
const USER_KEY = 'sinBarreras.currentUserId';
let syncing = false;
let syncTimer = null;
let lastSnapshot = '';

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return fallback; }
}

function clearAccountKeys() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

function sanitizedSettings(value) {
  const settings = value && typeof value === 'object' ? { ...value } : {};
  delete settings.partnerLanguage;
  return settings;
}

function sanitizeHistoryItem(item = {}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  return {
    id: String(item.id || ''),
    originalText: String(item.originalText || '').slice(0, 4000),
    translatedText: String(item.translatedText || '').slice(0, 4000),
    sourceLanguage: item.sourceLanguage || null,
    targetLanguage: item.targetLanguage || null,
    detectedUserLanguage: item.detectedUserLanguage || null,
    partnerLanguage: item.partnerLanguage || null,
    direction: item.direction || null,
    autoLanguage: Boolean(item.autoLanguage),
    situation: item.situation || 'everyday',
    voice: item.voice || null,
    createdAt: item.createdAt || null
  };
}

function sanitizedHistory(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 100)
    .map(sanitizeHistoryItem)
    .filter(Boolean);
}

function capture() {
  return {
    history: sanitizedHistory(readJson(KEYS.history, [])),
    settings: sanitizedSettings(readJson(KEYS.settings, {})),
    onboarding: localStorage.getItem(KEYS.onboarding) === '1',
    practicePoints: Math.max(0, Number(localStorage.getItem(KEYS.practicePoints) || 0)),
    learning: readJson(KEYS.learning, {}),
    sounds: readJson(KEYS.sounds, {})
  };
}

function apply(state = {}) {
  localStorage.setItem(KEYS.history, JSON.stringify(sanitizedHistory(state.history)));
  localStorage.setItem(KEYS.settings, JSON.stringify(sanitizedSettings(state.settings)));
  if (state.onboarding) localStorage.setItem(KEYS.onboarding, '1'); else localStorage.removeItem(KEYS.onboarding);
  localStorage.setItem(KEYS.practicePoints, String(Math.max(0, Number(state.practicePoints) || 0)));
  localStorage.setItem(KEYS.learning, JSON.stringify(state.learning && typeof state.learning === 'object' ? state.learning : {}));
  localStorage.setItem(KEYS.sounds, JSON.stringify(state.sounds && typeof state.sounds === 'object' ? state.sounds : {}));
}

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo sincronizar la cuenta.');
  return payload;
}

export async function bootstrapCloudState() {
  const payload = await request('/api/account/state');
  const user = payload.user;
  if (!user?.id) throw new Error('No se pudo identificar la cuenta.');
  const previousUser = localStorage.getItem(USER_KEY);
  if (previousUser && previousUser !== user.id) clearAccountKeys();
  apply(payload.state || {});
  localStorage.setItem(USER_KEY, user.id);
  lastSnapshot = JSON.stringify(capture());
  window.SinBarrerasUser = user;
  window.SinBarrerasCloud = { queueSync, syncNow };
  return user;
}

export function queueSync() {
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(syncNow, 600);
}

export async function syncNow() {
  if (syncing) return;
  const state = capture();
  const snapshot = JSON.stringify(state);
  if (snapshot === lastSnapshot) return;
  syncing = true;
  try {
    await request('/api/account/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: snapshot
    });
    lastSnapshot = snapshot;
  } catch (error) {
    console.warn('Cloud sync:', error.message);
  } finally {
    syncing = false;
  }
}

export function startCloudSync() {
  window.setInterval(() => {
    const snapshot = JSON.stringify(capture());
    if (snapshot !== lastSnapshot) queueSync();
  }, 2200);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') syncNow(); });
  window.addEventListener('pagehide', () => syncNow());
}

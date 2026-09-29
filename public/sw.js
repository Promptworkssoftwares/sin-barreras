const CACHE = 'sin-barreras-v1.7.11';
const ASSETS = [
  '/', '/manifest.webmanifest', '/css/landing.css?v=1.7.11', '/js/landing.js?v=1.7.11',
  '/styles.css?v=1.7.11', '/app-bootstrap.js?v=1.7.11', '/cloud.js?v=1.7.11', '/account-ui.js?v=1.7.11',
  '/app.js?v=1.7.11', '/learning-audio-wave.js?v=1.7.11', '/learner-feedback.js?v=1.7.11', '/phrasebook.js?v=1.7.11', '/phrase-practice.js?v=1.7.11', '/qr-conversation.js?v=1.7.11', '/ai-stage.js?v=1.7.11', '/audio-playback.js?v=1.7.11', '/tts-cache.js?v=1.7.11', '/navigation-flow.js?v=1.7.11', '/play-billing.js?v=1.7.11', '/languages.js?v=1.7.11', '/learn.js?v=1.7.11', '/sounds.js?v=1.7.11', '/voice-turn.js?v=1.7.11', '/icons/icon-192.png', '/icons/icon-512.png',
    '/assets/sin-barreras-logo-full.png', '/assets/sin-barreras-logo-dark.png',
  '/assets/learn/everyday.png', '/assets/learn/work.png', '/assets/learn/construction.png', '/assets/learn/medical.png',
  '/assets/learn/shopping.png', '/assets/learn/restaurant.png', '/assets/learn/interview.png', '/assets/learn/school.png',
  '/assets/footer-menu-v1413/hablar.png', '/assets/footer-menu-v1413/hablar-active.png', '/assets/footer-menu-v1413/aprender.png', '/assets/footer-menu-v1413/aprender-active.png',
  '/assets/footer-menu-v1413/coach.png', '/assets/footer-menu-v1413/coach-active.png',
  '/assets/footer-menu-v1413/camara.png', '/assets/footer-menu-v1413/camara-active.png',
  '/offline-phrases.html', '/css/offline-phrases.css?v=1.7.11', '/js/offline-phrases.js?v=1.7.11', '/css/room.css?v=1.7.11', '/js/join-conversation.js?v=1.7.11'
];
const PRIVATE_PREFIXES = ['/admin', '/api/', '/auth/', '/billing/', '/reset-password', '/account-deletion', '/change-password', '/join/'];

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));

self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    // Delete only obsolete application-shell caches. User study caches such as
    // phrase audio and TTS are intentionally persistent across app updates.
    .then((keys) => Promise.all(keys
      .filter((key) => key.startsWith('sin-barreras-v') && key !== CACHE)
      .map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then((clients) => clients.forEach((client) => client.postMessage({ type: 'SIN_BARRERAS_UPDATED' })))
));

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/app') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline-phrases.html')));
    return;
  }
  if (PRIVATE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix))) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || new Response('Sin conexión', { status: 503 })))
  );
});

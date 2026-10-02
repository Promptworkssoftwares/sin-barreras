const CACHE = 'sin-barreras-v1.7.25';
const ASSETS = [
  '/', '/manifest.webmanifest', '/css/landing.css?v=1.7.25', '/js/landing.js?v=1.7.25',
  '/styles.css?v=1.7.25', '/app-bootstrap.js?v=1.7.25', '/cloud.js?v=1.7.25', '/account-ui.js?v=1.7.25', '/ui-i18n.js?v=1.7.25',
  '/app.js?v=1.7.25', '/learning-profile.js?v=1.7.25', '/image-learning.js?v=1.7.25', '/image-learning-data.js?v=1.7.25', '/learning-audio-wave.js?v=1.7.25', '/learner-feedback.js?v=1.7.25', '/phrasebook.js?v=1.7.25', '/phrase-practice.js?v=1.7.25', '/qr-conversation.js?v=1.7.25', '/ai-stage.js?v=1.7.25', '/audio-playback.js?v=1.7.25', '/tts-cache.js?v=1.7.25', '/navigation-flow.js?v=1.7.25', '/play-billing.js?v=1.7.25', '/languages.js?v=1.7.25', '/learn.js?v=1.7.25', '/sounds.js?v=1.7.25', '/voice-turn.js?v=1.7.25', '/icons/icon-192.png', '/icons/icon-512.png',
    '/assets/sin-barreras-logo-full.png', '/assets/sin-barreras-logo-dark.png',
  '/assets/learn/everyday.png', '/assets/learn/work.png', '/assets/learn/construction.png', '/assets/learn/medical.png',
  '/assets/learn/shopping.png', '/assets/learn/restaurant.png', '/assets/learn/interview.png', '/assets/learn/school.png',
  '/assets/footer-menu-v1413/hablar.png', '/assets/footer-menu-v1413/hablar-active.png', '/assets/footer-menu-v1413/aprender.png', '/assets/footer-menu-v1413/aprender-active.png',
  '/assets/footer-menu-v1413/coach.png', '/assets/footer-menu-v1413/coach-active.png',
  '/assets/footer-menu-v1413/camara.png', '/assets/footer-menu-v1413/camara-active.png',
  '/offline-phrases.html', '/css/offline-phrases.css?v=1.7.25', '/js/offline-phrases.js?v=1.7.25', '/css/room.css?v=1.7.25', '/js/join-conversation.js?v=1.7.25'
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

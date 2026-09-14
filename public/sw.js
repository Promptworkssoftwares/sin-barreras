const CACHE = 'sin-barreras-v1.4.42';
const ASSETS = [
  '/', '/manifest.webmanifest', '/css/landing.css?v=1.4.42', '/js/landing.js?v=1.4.42',
  '/styles.css?v=1.4.42', '/app-bootstrap.js?v=1.4.42', '/cloud.js?v=1.4.42', '/account-ui.js?v=1.4.42',
  '/app.js?v=1.4.42', '/ai-stage.js?v=1.4.42', '/navigation-flow.js?v=1.4.42', '/play-billing.js?v=1.4.42', '/languages.js?v=1.4.42', '/learn.js?v=1.4.42', '/sounds.js?v=1.4.42', '/voice-turn.js?v=1.4.42', '/icons/icon-192.png', '/icons/icon-512.png',
    '/assets/sin-barreras-logo-full.png', '/assets/sin-barreras-logo-dark.png',
  '/assets/learn/everyday.png', '/assets/learn/work.png', '/assets/learn/construction.png', '/assets/learn/medical.png',
  '/assets/learn/shopping.png', '/assets/learn/restaurant.png', '/assets/learn/interview.png', '/assets/learn/school.png',
  '/assets/footer-menu-v1413/hablar.png', '/assets/footer-menu-v1413/hablar-active.png', '/assets/footer-menu-v1413/aprender.png', '/assets/footer-menu-v1413/aprender-active.png',
  '/assets/footer-menu-v1413/practica.png', '/assets/footer-menu-v1413/practica-active.png', '/assets/footer-menu-v1413/coach.png', '/assets/footer-menu-v1413/coach-active.png',
  '/assets/footer-menu-v1413/camara.png', '/assets/footer-menu-v1413/camara-active.png'
];
const PRIVATE_PREFIXES = ['/app', '/admin', '/api/', '/auth/', '/billing/'];

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));

self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then((clients) => clients.forEach((client) => client.postMessage({ type: 'SIN_BARRERAS_UPDATED' })))
));

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
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

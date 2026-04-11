// El Profesor — Service Worker
// Estrategia: cache-first para assets estáticos, network-first para navegación.
// Las llamadas a api.anthropic.com siempre van a la red (no se cachean).

const CACHE_NAME  = 'elprofesor-v1';
const SHELL_URLS  = ['/', '/index.html'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())        // activate immediately
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME)  // delete old cache versions
            .map(k  => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())      // take control of open tabs
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', evt => {
  const { request } = evt;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept external API calls — they must reach the network
  // (and will fail gracefully when offline — the app handles that)
  if (url.hostname !== self.location.hostname) return;

  // Navigation requests (HTML pages): network-first so deployments update fast.
  // If network fails, serve cached shell.
  if (request.mode === 'navigate') {
    evt.respondWith(
      fetch(request)
        .then(res => {
          // Cache a fresh copy of the shell on every successful navigation
          if (res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match('/index.html').then(cached => cached || Response.error())
        )
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first.
  // On first load they get cached; subsequent loads are instant.
  evt.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(res => {
        // Only cache successful same-origin responses
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
        }
        return res;
      });
    })
  );
});

// ─── Message: force update ────────────────────────────────────────────────────
// App can send { type: 'SKIP_WAITING' } to activate a waiting SW immediately.
self.addEventListener('message', evt => {
  if (evt.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ─────────────────────────────────────────────────────────────────────────────
// El Profesor | Código Hispano — Service Worker
// Estrategia:
//   • Shell (HTML)     → network-first, fallback a caché
//   • Assets estáticos → cache-first (nombres con hash, no cambian)
//   • APIs externas    → siempre red, nunca caché
//   • Push             → muestra notificación del servidor
//   • Periodic Sync    → recordatorio diario si la app está cerrada
// ─────────────────────────────────────────────────────────────────────────────

const VER           = 'v3';
const STATIC_CACHE  = `elprofesor-static-${VER}`;
const DYNAMIC_CACHE = `elprofesor-dynamic-${VER}`;
const SHELL         = '/';
const NOTIF_ICON    = '/icons/icon-192.svg';
const NOTIF_BADGE   = '/icons/icon-192.svg';

// Assets que se pre-cachean en install (mínimo shell)
const PRECACHE = [SHELL, '/manifest.json', '/icons/icon-192.svg', '/icons/icon-512.svg'];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', evt => {
  const VALID = new Set([STATIC_CACHE, DYNAMIC_CACHE]);
  evt.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => !VALID.has(k)).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', evt => {
  const { request } = evt;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ── Nunca interceptar llamadas a APIs externas ────────────────────────────
  if (url.hostname !== self.location.hostname) return;

  // ── Navegación (HTML): network-first → caché de shell ────────────────────
  if (request.mode === 'navigate') {
    evt.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(SHELL).then(cached => cached ?? Response.error())
        )
    );
    return;
  }

  // ── Assets estáticos con hash (JS, CSS, woff, imágenes): cache-first ─────
  const isHashed = /\.(js|css|woff2?|png|webp|jpg|jpeg|svg|ico)(\?|$)/.test(url.pathname);
  if (isHashed) {
    evt.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── Todo lo demás mismo origen: network-first, caché de respaldo ─────────
  evt.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

// ── Push ─────────────────────────────────────────────────────────────────────
// Recibe notificaciones push del servidor (si hay backend con VAPID).
// Formato del payload JSON: { title, body, url }
self.addEventListener('push', evt => {
  if (Notification.permission !== 'granted') return;

  let data = { title: '¿Listo para estudiar Python hoy? El Profesor te espera 🐍', body: '' };
  try { data = { ...data, ...evt.data?.json() }; } catch {}

  evt.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body || 'Tu racha de código te necesita. Unos minutos de Python al día cambian todo.',
      icon:    NOTIF_ICON,
      badge:   NOTIF_BADGE,
      tag:     'elprofesor-daily',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open',   title: '📚 Estudiar ahora' },
        { action: 'snooze', title: '⏰ Mañana'          },
      ],
      data: { url: data.url ?? '/' },
    })
  );
});

// ── Periodic Background Sync ──────────────────────────────────────────────────
// Se activa por el SO cada ~24 h cuando la app está instalada como PWA.
// Compatible con Chrome en Android. En otros navegadores es silencioso.
self.addEventListener('periodicsync', evt => {
  if (evt.tag === 'daily-reminder') {
    evt.waitUntil(showDailyReminder());
  }
});

async function showDailyReminder() {
  if (Notification.permission !== 'granted') return;

  // Si la app está abierta en alguna pestaña, no interrumpir
  const windows = await self.clients.matchAll({ type: 'window' });
  if (windows.length > 0) return;

  return self.registration.showNotification(
    '¿Listo para estudiar Python hoy? El Profesor te espera 🐍',
    {
      body:    'Tu racha de código te necesita. Unos minutos de Python al día cambian todo.',
      icon:    NOTIF_ICON,
      badge:   NOTIF_BADGE,
      tag:     'elprofesor-daily',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open',   title: '📚 Estudiar ahora' },
        { action: 'snooze', title: '⏰ Mañana'          },
      ],
      data: { url: '/' },
    }
  );
}

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', evt => {
  evt.notification.close();
  if (evt.action === 'snooze') return; // Ignorar hasta mañana

  const target = evt.notification.data?.url ?? '/';

  evt.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windows => {
        // Focalizar pestaña existente si hay una
        for (const win of windows) {
          if ('focus' in win) return win.focus();
        }
        // Abrir nueva pestaña
        return self.clients.openWindow(target);
      })
  );
});

// ── Message ───────────────────────────────────────────────────────────────────
// El app puede enviar { type: 'SKIP_WAITING' } para activar un SW nuevo.
self.addEventListener('message', evt => {
  if (evt.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

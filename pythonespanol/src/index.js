import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        // Activa automáticamente un SW en espera al terminar de instalarse
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Notificaciones: pedir permiso 3 s después de la carga (menos intrusivo)
        setTimeout(() => setupNotifications(registration), 3000);
      })
      .catch(() => { /* entorno sin soporte para SW (localhost file://, etc.) */ });
  });
}

// ── Notificaciones ────────────────────────────────────────────────────────────
const LS_LAST_VISIT = 'elprofesor_last_visit';
const MS_IN_DAY     = 24 * 60 * 60 * 1000;

async function setupNotifications(registration) {
  if (!('Notification' in window)) return;

  // Pedir permiso solo si aún no se ha decidido
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') return;

  // ── Registro de Periodic Background Sync ──────────────────────────────────
  // Funciona en Chrome/Android con la app instalada como PWA.
  // En otros navegadores simplemente no hace nada (catch silencioso).
  if ('periodicSync' in registration) {
    try {
      const perm = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (perm.state === 'granted') {
        await registration.periodicSync.register('daily-reminder', {
          minInterval: MS_IN_DAY,
        });
      }
    } catch { /* browser no soporta la API */ }
  }

  // ── Fallback on-open: notificación si no visitó en 24 h ───────────────────
  // Se ejecuta inmediatamente cuando el usuario abre la app.
  // Cubre navegadores sin Periodic Background Sync.
  const lastVisit = localStorage.getItem(LS_LAST_VISIT);
  const now       = Date.now();

  if (lastVisit && now - parseInt(lastVisit, 10) > MS_IN_DAY) {
    try {
      await registration.showNotification(
        '¿Listo para estudiar Python hoy? El Profesor te espera 🐍',
        {
          body:    'Tu racha de código te necesita. Unos minutos de Python al día cambian todo.',
          icon:    '/icons/icon-192.svg',
          badge:   '/icons/icon-192.svg',
          tag:     'elprofesor-daily',
          vibrate: [200, 100, 200],
          data:    { url: '/' },
        }
      );
    } catch { /* showNotification puede fallar si la ventana está en foco */ }
  }

  // Guardar timestamp de esta visita
  localStorage.setItem(LS_LAST_VISIT, now.toString());
}

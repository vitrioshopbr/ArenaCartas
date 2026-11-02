
'use strict';

const CACHE = 'arena-cartas-v3';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './online.js',
  './manifest.webmanifest',
  './icon.svg'
];

// Instala os arquivos da versão atual.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Remove versões antigas do cache.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('arena-cartas-') &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Usa a internet primeiro.
// Se estiver offline, utiliza o cache.
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Não intercepta Supabase nem outros serviços.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE)
              .then(cache => cache.put(request, copy))
          );
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === 'navigate') {
          const home = await caches.match('./index.html');
          if (home) return home;
        }

        return Response.error();
      })
  );
});

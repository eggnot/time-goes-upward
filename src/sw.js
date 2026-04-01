const CACHE_NAME = 'tgu-v33';

const ASSETS = [
  './',
  './favicon-512x512.svg',
  './favicon.ico',
  './index.html',
  './js/tgu-bootstrap.js',
  './js/tgu-data.js',
  './js/tgu-editor.js',
  './js/tgu-grid.js',
  './js/tgu-main.js',
  './js/tgu-state.js',
  './js/tgu-store.js',
  './js/tgu-ui.js',
  './js/tgu-utils.js',
  './js/tgu-zoom.js',
  './js/tgu_dom.js',
  './js/tgu_events.js',
  './main.css',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
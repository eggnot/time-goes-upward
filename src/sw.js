const CACHE_NAME = 'tgu-v34';

const ASSETS = [
  '/time-goes-upward/',
  '/time-goes-upward/favicon-512x512.svg',
  '/time-goes-upward/favicon.ico',
  '/time-goes-upward/index.html',
  '/time-goes-upward/js/tgu-bootstrap.js',
  '/time-goes-upward/js/tgu-data.js',
  '/time-goes-upward/js/tgu-editor.js',
  '/time-goes-upward/js/tgu-grid.js',
  '/time-goes-upward/js/tgu-main.js',
  '/time-goes-upward/js/tgu-state.js',
  '/time-goes-upward/js/tgu-store.js',
  '/time-goes-upward/js/tgu-ui.js',
  '/time-goes-upward/js/tgu-utils.js',
  '/time-goes-upward/js/tgu-zoom.js',
  '/time-goes-upward/js/tgu_dom.js',
  '/time-goes-upward/js/tgu_events.js',
  '/time-goes-upward/main.css',
  '/time-goes-upward/manifest.json',
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
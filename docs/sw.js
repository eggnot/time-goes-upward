const CACHE_NAME = 'tgu-v1';

const ASSETS = [
  'index.html',
  'main.css',
  'main.js',
  'grid.js',
  'state.js',
  'editor.js',
  'ui.js',
  'data.js'
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
  // Optional: Clean up old caches here
  event.waitUntil(self.clients.claim());
});
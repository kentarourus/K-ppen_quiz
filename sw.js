const CACHE_NAME = 'koppen-quiz-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './style.css',
  './climate_data.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event: cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell and core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache first, falling back to network
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS protocols
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic assets if they are successful, including Google Fonts, Material Icons, and Chart.js
        if (networkResponse && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[Service Worker] Fetch failed; returning offline cache if available.', err);
      });
    })
  );
});

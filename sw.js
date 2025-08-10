
const CACHE_NAME = 'palisades-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))))
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Network-first for the Henderson API; cache-first for local assets
  if (url.hostname.includes('cityofhenderson.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        // Optionally cache new GET requests for same-origin files
        try {
          const clone = resp.clone();
          if (e.request.method === 'GET' && url.origin === self.location.origin) {
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
        } catch (err) {}
        return resp;
      }).catch(() => cached);
    })
  );
});

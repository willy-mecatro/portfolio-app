const CACHE = 'portfolio-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// Installation — mise en cache des assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — réseau d'abord, cache ensuite
self.addEventListener('fetch', e => {
  // Ne pas mettre en cache les appels API
  if(e.request.url.includes('vercel.app') || e.request.url.includes('yahoo')) {
    return; // Laisse passer sans cache
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Mettre à jour le cache avec la nouvelle version
        if(res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Hors ligne → utiliser le cache
        return caches.match(e.request).then(cached => {
          return cached || caches.match('/index.html');
        });
      })
  );
});

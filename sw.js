// Service Worker — Portfolio PWA
const CACHE = 'portfolio-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Ne jamais mettre en cache les appels API (cours, supabase) : toujours réseau
  if(url.includes('supabase.co') || url.includes('vercel.app/api') || url.includes('yahoo') || url.includes('query1.finance')) {
    return; // laisse le navigateur gérer normalement
  }
  // Pour le reste : réseau d'abord, cache en secours (offline)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if(res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(()=>{});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
  );
});

// Réception d'un push (pour usage futur avec serveur)
self.addEventListener('push', e => {
  let data = { title: 'Portfolio', body: 'Notification' };
  try { data = e.data.json(); } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(data.title || '🔔 Alerte Portfolio', {
      body: data.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});

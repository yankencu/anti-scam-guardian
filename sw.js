/* 反诈守门人 Service Worker：离线可玩 */
const CACHE = 'fz2-v11';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS).catch(function(){}); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(function(c){
      return c.match(req, { ignoreSearch: true }).then(function(hit){
        const net = fetch(req).then(function(res){
          if (res && res.status === 200 && res.type === 'basic'){ try { c.put(req, res.clone()); } catch(err){} }
          return res;
        }).catch(function(){ return hit || new Response('', { status: 503 }); });
        return hit || net;
      });
    }).catch(function(){ return fetch(req); })
  );
});

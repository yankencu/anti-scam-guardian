/* 反诈守门人 Service Worker：离线可玩 */
const CACHE = 'fz2-v12';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

/* 逐个缓存：addAll 是原子的，任意一个资源失败（网络抖动 / 某个文件 404）
   就会整批不缓存，而且异常被吞掉 → 用户以为能离线，断网却白屏。
   这里改成单条失败不影响其余，核心的 index.html 优先写入。 */
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ASSETS.map(function(u){
      return c.add(new Request(u, { cache: 'reload' })).catch(function(){});
    }));
  }));
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
        }).catch(function(){
          if (hit) return hit;
          /* 断网兜底：导航请求回退到已缓存的首页，而不是 503 空白页 */
          if (req.mode === 'navigate'){
            return c.match('./index.html').then(function(h){ return h || new Response('', { status: 503 }); });
          }
          return new Response('', { status: 503 });
        });
        return hit || net;
      });
    }).catch(function(){ return fetch(req); })
  );
});

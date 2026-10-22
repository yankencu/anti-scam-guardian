/* 反诈守门人 Service Worker：离线可玩 */
const CACHE = 'fz2-v13';
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
  let sameOrigin = false;
  try { sameOrigin = new URL(req.url).origin === self.location.origin; } catch(err){}
  if (!sameOrigin) return;                       /* 第三方资源不接管 */

  /* 【页面本身】网络优先：联网时永远拿到最新版，断网才回退缓存。
     旧版是缓存优先，导致每次发版后第一次打开必定是旧页面，要刷两次才更新，
     表现为「刚改的东西又不见了」。 */
  const isDoc = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').indexOf('text/html') >= 0;
  if (isDoc){
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function(res){
        if (res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy).catch(function(){}); });
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(h){
          return h || caches.match('./') ||
            new Response('<!doctype html><meta charset="utf-8"><body style="background:#0b1018;color:#e8eef7;font:16px/1.7 system-ui;padding:40px"><h2>当前离线</h2><p>这台设备还没缓存过本页。联网打开一次即可离线使用。</p></body>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        });
      })
    );
    return;
  }

  /* 【静态资源】缓存优先，命中即返回，同时后台静默更新 */
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

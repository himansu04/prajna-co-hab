/* Prajna Co-hab — service worker (v13)
   Goal: instant repeat loads, offline-friendly, and NEVER a stale copy of a new deploy.
   Strategy: network-first for pages and config, cache-first only for static assets
   once they have been seen. Old caches are dropped on every activation. */
var V = "prajna-v17";
var STATIC = /\/assets\/.*\.(css|js|png|jpg|svg|webp|woff2)$/;

self.addEventListener("install", function(e){
  self.skipWaiting();                          // take over as soon as it is downloaded
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k === V ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("message", function(e){
  if(e.data && e.data.type === "skip") self.skipWaiting();
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;              // WhatsApp, maps, Apps Script untouched
  if (url.pathname.endsWith("config.js")) return;          // live facts, never cached
  if (url.pathname.endsWith("sw.js")) return;              // never cache the worker itself

  /* pages and everything else: try the network first, fall back to cache */
  if (req.mode === "navigate" || req.destination === "document" || !STATIC.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(function(res){
        if (res && res.ok) {
          var cp = res.clone();
          caches.open(V).then(function(c){ c.put(req, cp); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){ return hit || caches.match("./index.html"); });
      })
    );
    return;
  }

  /* static assets: cache first, refreshed in the background once used */
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function(c){ c.put(req, cp); }); }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});

self.addEventListener("message", function(e){
  if (e.data && e.data.type === "purge") {
    caches.keys().then(function(keys){ keys.forEach(function(k){ caches.delete(k); }); });
  }
});

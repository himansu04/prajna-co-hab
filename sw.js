/* Prajna Co-hab — service worker: instant repeat loads + offline shell.
   Cache-first for the app shell, network-first for anything else, and the
   rate card is never trusted from cache alone (it must stay truthful). */
var V = "prajna-v6";
var SHELL = [
  "./", "./index.html", "./gallery.html", "./pune.html", "./discover.html",
  "./autohub.html", "./about.html", "./contact.html", "./feedback.html",
  "./assets/style.css", "./assets/site.js", "./assets/fluid.js",
  "./assets/icon-192.png", "./assets/icon-512.png", "./manifest.webmanifest"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(V).then(function(c){ return c.addAll(SHELL).catch(function(){}); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k !== V ? caches.delete(k) : null; }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;              // never touch WhatsApp, maps, Apps Script
  if (url.pathname.endsWith("config.js")) return;           // live facts, always fresh
  if (url.pathname.endsWith("tour.mp4")) {                  // big media: cache on demand only
    e.respondWith(caches.match(req).then(function(hit){ return hit || fetch(req).then(function(res){ var cp = res.clone(); caches.open(V).then(function(c){ c.put(req, cp); }); return res; }); }));
    return;
  }
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function(c){ c.put(req, cp); }); }
        return res;
      }).catch(function(){ return hit || caches.match("./index.html"); });
      return hit || net;
    })
  );
});

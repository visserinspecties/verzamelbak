// Service worker: houdt de app beschikbaar zonder internet.
// Netwerk eerst: je krijgt altijd de nieuwste versie als je online bent,
// en de laatst bewaarde versie als je offline bent.
// Belangrijk: alleen bestanden van de app zelf. Alles van Microsoft (inloggen en
// OneDrive) gaat rechtstreeks naar het netwerk en wordt nooit bewaard.
var VERSION = 'verzamelbak-v7';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Microsoft e.d.: niet aanraken

  e.respondWith(
    fetch(req).then(function (res) {
      // Alleen bewaren zonder zoekopdracht in het adres (dus niet de terugkeer van het inloggen)
      if (res.ok && !url.search) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true });
    })
  );
});

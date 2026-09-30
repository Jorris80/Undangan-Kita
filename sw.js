/* UndangKita service worker — cangkang aplikasi offline + cache font.
 * Data (tamu, RSVP, check-in) TIDAK dicache di sini: aplikasi menyimpannya di
 * localStorage dan antrean check-in offline dikirim saat online. */
var VERSI = 'undangkita-v2.1.0';
var CANGKANG = ['./', './index.html', './config.js', './manifest.json', './icon.svg'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(CANGKANG); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSI; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;                                   // POST ke Apps Script selalu ke jaringan
  if (u.hostname.indexOf('script.google') >= 0 || u.hostname.indexOf('googleusercontent') >= 0) return;
  if (u.hostname.indexOf('fonts.') === 0) {                          // font: cache dulu, perbarui di latar
    e.respondWith(caches.open(VERSI + '-font').then(function (c) { return c.match(r).then(function (hit) { var net = fetch(r).then(function (res) { c.put(r, res.clone()); return res; }).catch(function () { return hit; }); return hit || net; }); }));
    return;
  }
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {                                       // halaman: jaringan dulu, cache bila offline
    e.respondWith(fetch(r).then(function (res) { var s = res.clone(); caches.open(VERSI).then(function (c) { c.put('./index.html', s); }); return res; }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (hit) { return hit || fetch(r).then(function (res) { if (res.ok) { var s = res.clone(); caches.open(VERSI).then(function (c) { c.put(r, s); }); } return res; }); }));
});

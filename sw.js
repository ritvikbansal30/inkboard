// Inkboard offline cache: the app keeps working when the local server is off.
const CACHE = 'inkboard-v8';
const CORE = ['./', './index.html', './styles.css', './app.js', './physics.js', './manifest.webmanifest', './icon.svg', './icon-512.png',
  './vendor/pdf.min.mjs', './vendor/pdf.worker.min.mjs', './vendor/perfect-freehand.mjs', './vendor/pdf-lib.esm.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});

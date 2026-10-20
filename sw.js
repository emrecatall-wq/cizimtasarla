// Mobilya CAD servis çalışanı: uygulama internetsiz de açılır.
// index.html önce internetten denenir (güncelleme gelsin), olmazsa kayıtlıdan açılır.
// Kütüphane ve ikonlar kayıtlıdan gelir. Yeni dosya/kütüphane eklersen CACHE adını değiştir (v1 -> v2).
const CACHE = 'mobilya-cad-v1';
const ASSETS = [
  './', 'index.html', 'manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'lib/tailwind.css', 'lib/three.min.js', 'lib/OrbitControls.js', 'lib/jspdf.umd.min.js',
  'lib/fontawesome/css/all.min.css',
  'lib/fontawesome/webfonts/fa-solid-900.woff2', 'lib/fontawesome/webfonts/fa-regular-400.woff2',
  'lib/fontawesome/webfonts/fa-brands-400.woff2', 'lib/fontawesome/webfonts/fa-v4compatibility.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isPage) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});

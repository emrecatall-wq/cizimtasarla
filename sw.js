// Mobilya CAD servis çalışanı: uygulama internetsiz de açılır.
// Bütün .html sayfaları (index.html, cizgi-cad.html ...) önce internetten denenir (güncelleme gelsin),
// internet yoksa kayıtlı kopyadan açılır. Her sayfa kendi adıyla kaydedilir.
// Kütüphane ve ikonlar kayıtlıdan gelir. Yeni dosya/kütüphane eklersen CACHE adını değiştir (v4 -> v5).
const CACHE = 'mobilya-cad-v4';
const ASSETS = [
  './', 'index.html', 'cizgi-cad.html', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // Bir dosya eksik olsa bile kurulum bozulmasın diye tek tek eklenir
      .then(c => Promise.all(ASSETS.map(a => c.add(new Request(a, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
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

  const p = url.pathname;
  const isPage = req.mode === 'navigate' || p.endsWith('/') || p.endsWith('.html');
  if (isPage) {
    // Sayfa adı: "/" ise index.html, değilse dosyanın kendi adı (cizgi-cad.html vb.)
    const key = p.endsWith('/') ? 'index.html' : p.split('/').pop();
    e.respondWith(
      fetch(url.href, { cache: 'no-cache' }).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
        return res;
      }).catch(() => caches.match(key).then(r => r || caches.match('index.html')))
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

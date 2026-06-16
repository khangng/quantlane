// sw.js — service worker cho Risk Desk PWA
// Cache phần "vỏ" (shell) để app mở nhanh; dữ liệu luôn lấy mới từ mạng.
const CACHE = 'riskdesk-v5';
const SHELL = [
  '/', '/index.html', '/manifest.json',
  '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Dữ liệu từ Netlify Functions: luôn lấy mạng, không cache (tránh số liệu cũ)
  if (url.pathname.includes('/.netlify/functions/')) return;

  // Vỏ app (same-origin GET): ưu tiên cache, có mạng thì cập nhật nền
  if (e.request.method === 'GET' && url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const live = fetch(e.request).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || live;
      })
    );
  }
  // Tài nguyên khác (CDN Chart.js, font...) để mạng xử lý mặc định
});

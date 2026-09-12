// عامل خدمة بسيط: يخزّن هيكل التطبيق ليعمل دون إنترنت.
// لا يخزّن أي وسائط للمستخدم — تلك تبقى في الذاكرة فقط ولا تغادر الجهاز.

const CACHE = 'mashhad-v1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './assets/icon.svg',
  './js/app.js',
  './js/state.js',
  './js/media.js',
  './js/engine.js',
  './js/timeline.js',
  './js/inspector.js',
  './js/export.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // الشبكة أولاً حتى يصل التحديث، مع الرجوع إلى الذاكرة عند انقطاع الاتصال.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html'))),
  );
});

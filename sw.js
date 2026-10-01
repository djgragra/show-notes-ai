/* Show Notes Generator — service worker: caches the app shell so it works offline.
   © 2026 Graziano Melzi · OnAir Garage — MIT License

   Bump CACHE_VERSION whenever any file below changes; old caches are dropped on activate. */
const CACHE_VERSION = "v2026.10.2";
const CACHE_NAME = "shownotesai-" + CACHE_VERSION;

const PRECACHE_URLS = [
  "./", "./index.html", "./manifest.json", "./style.css", "./i18n.js", "./providers.js", "./prompt.js", "./app.js", "./tool.js",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  // No skipWaiting(): on an update the new worker waits until the page asks for it (banner "new version ready").
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Cache-first, same origin only: instant offline loads.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

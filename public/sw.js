const SHELL_CACHE = "solodev-shell-v1";
const STATIC_CACHE = "solodev-static-v1";
const DATA_CACHE = "solodev-data-v1";

const SHELL_URLS = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((response) => {
    if (response.ok) cache.put(req, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(req);
    if (response.ok) cache.put(req, response.clone());
    return response;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Books data API — stale-while-revalidate so offline reads still work
  if (url.pathname.startsWith("/books-data") || url.pathname === "/api/books") {
    e.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // Next.js static chunks (JS/CSS) — cache and update in background
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Shell HTML and manifest — network-first for freshness
  if (url.pathname === "/" || SHELL_URLS.includes(url.pathname)) {
    e.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }
});

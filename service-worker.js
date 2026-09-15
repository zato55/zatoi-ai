// ZATOI AI SERVICE WORKER V14.24
const CACHE_NAME = "zatoi-ai-v14-28";
const APP_FILES = ["./", "./index.html",
  "./style.css?v=14.28", "./manifest.json", "./icon-192.png", "./icon-512.png",
  "./zatoi-ai-samurai-avatar.png", "./robots.txt", "./sitemap.xml", "./llms.txt", "./hakkinda/", "./ozellikler/"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(
    APP_FILES.map(file => cache.add(new Request(file, { cache: "reload" })))
  )).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("zatoi-ai-") && key !== CACHE_NAME)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const navigate = request.mode === "navigate";
  event.respondWith((async () => {
    try {
      const response = await fetch(new Request(request, { cache: navigate ? "no-store" : "no-cache" }));
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {}));
      }
      return response;
    } catch {
      const cache = await caches.open(CACHE_NAME);
      const exact = await cache.match(request);
      if (exact) return exact;
      const base = new URL("./", self.registration.scope);
      const isHome = url.pathname === base.pathname || url.pathname === new URL("index.html", base).pathname;
      if (navigate && isHome) {
        const home = (await cache.match(new URL("index.html", base).href)) || (await cache.match(base.href));
        if (home) return home;
      }
      return new Response("İnternet bağlantısı yok.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});

const CACHE_NAME = "zatoi-ai-v12.7";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );

  // Yeni sürümü bekletmeden devreye al.
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === "navigate";
  const isIndex = isSameOrigin && (
    requestUrl.pathname.endsWith("/") ||
    requestUrl.pathname.endsWith("/index.html")
  );

  // Ana uygulama dosyasını her zaman ağdan taze iste.
  // Böylece kullanıcı önbellek temizlemek zorunda kalmaz.
  if (isNavigation || isIndex) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put("./index.html", copy);
            });
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match("./index.html") ||
            await caches.match("./") ||
            Response.error()
          );
        })
    );
    return;
  }

  // Manifest ve ikonlar: ağ öncelikli, çevrimdışında cache.
  if (isSameOrigin) {
    event.respondWith(
      fetch(event.request, { cache: "no-cache" })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

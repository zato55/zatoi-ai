// ZATOI AI SERVICE WORKER V14.22 - SEO + ADMIN PANEL
const CACHE_NAME = "zatoi-ai-v14-22";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./robots.txt",
  "./sitemap.xml",
  "./llms.txt",
  "./hakkinda/",
  "./ozellikler/"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        APP_FILES.map(file =>
          cache.add(new Request(file, { cache: "reload" }))
        )
      )
    )
  );
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
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // SPA navigasyonları: ağ öncelikli, tamamen çevrimdışıyken index.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(new Request(request, { cache: "no-store" }))
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then(cache =>
                cache.put("./index.html", copy)
              )
            );
          }
          return response;
        })
        .catch(async () =>
          (await caches.match("./index.html")) ||
          (await caches.match("./")) ||
          new Response("Zatoi AI çevrimdışı.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        )
    );
    return;
  }

  // Uygulama dosyaları: network-first, hata olursa cache.
  event.respondWith(
    fetch(request, { cache: "no-cache" })
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          );
        }
        return response;
      })
      .catch(async () =>
        (await caches.match(request)) ||
        new Response("İnternet bağlantısı yok.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
      )
  );
});

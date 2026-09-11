const CACHE_NAME = "zatoi-ai-v14-8";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        APP_FILES.map(file =>
          cache.add(new Request(file, { cache: "reload" })).catch(error => {
            console.warn("Önbelleğe eklenemedi:", file, error);
          })
        )
      )
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  // Worker API gibi başka alan adlarına yapılan istekleri önbelleğe alma.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Ana uygulama ve navigasyonlarda tarayıcının eski HTTP önbelleğine takılma.
        const networkRequest =
          request.mode === "navigate" ||
          requestUrl.pathname.endsWith("/index.html") ||
          requestUrl.pathname.endsWith("/manifest.json")
            ? new Request(request, { cache: "no-store" })
            : request;

        const response = await fetch(networkRequest);

        if (response && response.ok) {
          const responseCopy = response.clone();

          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseCopy))
              .catch(error => {
                console.warn("Önbellek güncellenemedi:", error);
              })
          );
        }

        return response;
      } catch {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === "navigate") {
          const homePage =
            (await caches.match("./index.html")) ||
            (await caches.match("./"));

          if (homePage) {
            return homePage;
          }
        }

        return new Response("İnternet bağlantısı yok.", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      }
    })()
  );
});

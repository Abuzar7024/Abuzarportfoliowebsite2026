/*
 * Offline support for the portfolio.
 *
 * - Pages: network first, falling back to the cached app shell, so a visitor who
 *   loses their connection still gets the site (which then shows the offline
 *   screen with Sled Run).
 * - Hashed build assets (/assets/*): cache first; their names change on every
 *   deploy, so a cached copy is never stale.
 * - Everything else same-origin, plus Google Fonts: stale-while-revalidate.
 * - Third-party APIs (EmailJS, region lookup) are never cached.
 */
const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      const res = await fetch("/", { cache: "no-store" });
      await cache.put("/", res.clone());
      // Precache the entry script and stylesheet the shell references.
      const html = await res.text();
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
      await cache.addAll([...new Set([...assets, "/favicon.svg", "/site.webmanifest"])]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok && url.origin === self.location.origin) {
            const cache = await caches.open(SHELL);
            cache.put("/", res.clone());
          }
          return res;
        } catch {
          return (await caches.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname === "/sw.js" || url.searchParams.has("ping")) return;
    if (url.pathname.startsWith("/assets/")) {
      event.respondWith(
        (async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const res = await fetch(request);
          if (res.ok) (await caches.open(RUNTIME)).put(request, res.clone());
          return res;
        })()
      );
      return;
    }
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (FONT_HOSTS.includes(url.hostname)) event.respondWith(staleWhileRevalidate(request));
});

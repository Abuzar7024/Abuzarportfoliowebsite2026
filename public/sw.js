/*
 * Offline & low-bandwidth support for the portfolio.
 *
 * - Pages: network first with a fast timeout fallback to the cached app shell,
 *   so a visitor on a flaky or lost connection still gets the site quickly.
 * - Hashed build assets (/assets/*): cache first; their names change on every
 *   deploy, so a cached copy is never stale.
 * - Everything else same-origin, plus Google Fonts: stale-while-revalidate.
 * - Third-party APIs (EmailJS, region lookup) are never cached.
 */
const VERSION = "v2";
const SHELL = `shell-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(SHELL);
        const res = await fetch("/", { cache: "default" });
        if (res.ok) {
          await cache.put("/", res.clone());
          const html = await res.text();
          const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
          await cache.addAll([...new Set([...assets, "/favicon.svg", "/site.webmanifest"])]);
        }
      } catch {
        // Ignore install precache errors on flaky connections; runtime cache will populate on demand.
      }
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
        const cachedShell = await caches.match("/");
        try {
          const ctrl = new AbortController();
          const timer = cachedShell ? setTimeout(() => ctrl.abort(), 3500) : null;
          const res = await fetch(request, { signal: ctrl.signal });
          if (timer) clearTimeout(timer);
          if (res.ok && url.origin === self.location.origin) {
            const cache = await caches.open(SHELL);
            cache.put("/", res.clone());
          }
          return res;
        } catch {
          return cachedShell || Response.error();
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

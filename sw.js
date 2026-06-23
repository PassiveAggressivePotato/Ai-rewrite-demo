/* sw.js — minimal offline app-shell cache.
 *
 * Strategy: precache the static shell on install; serve cache-first with a
 * network fallback for navigations. Bump CACHE when assets change. Remote
 * fonts/artwork are fetched best-effort and simply skipped when offline (the
 * UI falls back to gradients and system fonts). */
const CACHE = "scores-shell-v41";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./sources.js",
  "./normalize.js",
  "./data.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  // Gold category icons (tabs + missing-poster placeholders).
  "./assets/icons/movie.svg",
  "./assets/icons/tv.svg",
  "./assets/icons/game.svg",
  "./assets/icons/book.svg",
  // Poster / backdrop artwork — precached so page backgrounds appear instantly.
  "./assets/dune-part-two-poster.webp",
  "./assets/dune-part-two-backdrop.webp",
  "./assets/oppenheimer-poster.webp",
  "./assets/oppenheimer-backdrop.webp",
  "./assets/poor-things-poster.webp",
  "./assets/poor-things-backdrop.webp",
  "./assets/across-the-spider-verse-poster.webp",
  "./assets/across-the-spider-verse-backdrop.webp",
  "./assets/everything-everywhere-all-at-once-poster.webp",
  "./assets/everything-everywhere-all-at-once-backdrop.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  // App-shell assets: network-first so updates always show when online, with a
  // cache fallback for offline. (Cache-first would pin stale builds on repeat
  // visits during active development.)
  if (new URL(request.url).origin === location.origin) {
    e.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(request).then((hit) => hit || caches.match("./index.html")))
    );
  }
  // Cross-origin (fonts/art): just let the network handle it; ignore failures.
});

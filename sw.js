"use strict";

const CACHE_NAME = "schema-tjapo-cache-v215";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./jochem.html",
  "./joep.html",
  "./styles.css?v=215",
  "./mono-preview.css?v=215",
  "./rehab.css?v=215",
  "./rehab-plan.js?v=215",
  "./rehab.js?v=215",
  "./plan-model.js?v=215",
  "./plan-editor.js?v=215",
  "./plan-editor.css?v=215",
  "./fonts/kh-teka-regular.woff2",
  "./firebase-config.js?v=215",
  "./app.js?v=215",
  "./app-startup.js?v=215",
  "./vendor/lucide-schema-1.69.0.min.js",
  "./profile-cloud.js?v=215",
  "./app-updates.js?v=215",
  "./rest-alarm.mp3?v=215",
  "./side-alarm.mp3?v=215",
  "./audio-unlock.mp3?v=215",
  "./manifest.webmanifest?v=215",
  "./manifest-jochem.webmanifest?v=215",
  "./manifest-joep.webmanifest?v=215",
  "./favicon.ico?v=215",
  "./favicon-32.png?v=215",
  "./apple-touch-icon.png?v=215",
  "./icon-192.png?v=215",
  "./icon-512.png?v=215",
  "./icon-maskable-512.png?v=215",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).pathname.endsWith("/app-version.json")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    const url = new URL(event.request.url);
    const profile = url.pathname.match(/\/(jochem|joep)\.html$/)?.[1]
      || url.searchParams.get("profiel")?.trim().toLowerCase();
    const cacheKey = ["jochem", "joep"].includes(profile) ? `./${profile}.html` : "./index.html";
    const cache = caches.open(CACHE_NAME);
    const fresh = fetch(event.request).then(async (response) => {
      if (response.ok) await (await cache).put(cacheKey, response.clone()).catch(() => {});
      return response;
    });
    event.waitUntil(fresh.catch(() => {}));
    // Open the installed shell immediately. Background refresh never replaces
    // the visible document; the existing update button remains in control.
    const requestedVersion = url.searchParams.get("v");
    const forceFresh = requestedVersion && CACHE_NAME !== `schema-tjapo-cache-v${requestedVersion}`;
    event.respondWith((async () => {
      const cached = await (await cache).match(cacheKey);
      if (cached && !forceFresh) return cached;
      try { return await fresh; } catch (error) { if (cached) return cached; throw error; }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});

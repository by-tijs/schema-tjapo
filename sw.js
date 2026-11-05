"use strict";

const CACHE_NAME = "schema-tjapo-cache-v213";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./jochem.html",
  "./styles.css?v=213",
  "./mono-preview.css?v=213",
  "./rehab.css?v=213",
  "./rehab-plan.js?v=213",
  "./rehab.js?v=213",
  "./plan-model.js?v=213",
  "./plan-editor.js?v=213",
  "./plan-editor.css?v=213",
  "./fonts/kh-teka-regular.woff2",
  "./firebase-config.js?v=213",
  "./app.js?v=213",
  "./app-startup.js?v=213",
  "./vendor/lucide-1.69.0.min.js",
  "./profile-cloud.js?v=213",
  "./app-updates.js?v=213",
  "./rest-alarm.mp3?v=213",
  "./side-alarm.mp3?v=213",
  "./audio-unlock.mp3?v=213",
  "./manifest.webmanifest?v=213",
  "./manifest-jochem.webmanifest?v=213",
  "./favicon.ico?v=213",
  "./favicon-32.png?v=213",
  "./apple-touch-icon.png?v=213",
  "./icon-192.png?v=213",
  "./icon-512.png?v=213",
  "./icon-maskable-512.png?v=213",
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
    const cacheKey = url.pathname.endsWith("/jochem.html")
      || url.searchParams.get("profiel")?.trim().toLowerCase() === "jochem"
      ? "./jochem.html" : "./index.html";
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(cacheKey)),
    );
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

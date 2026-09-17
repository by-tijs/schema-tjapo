"use strict";

const CACHE_NAME = "schema-tjapo-cache-v199";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=199",
  "./mono-preview.css?v=199",
  "./fonts/kh-teka-regular.woff2",
  "./firebase-config.js?v=199",
  "./app.js?v=199",
  "./profile-cloud.js?v=199",
  "./rest-alarm.mp3?v=199",
  "./side-alarm.mp3?v=199",
  "./audio-unlock.mp3?v=199",
  "./manifest.webmanifest?v=199",
  "./manifest-jochem.webmanifest?v=199",
  "./favicon.ico?v=199",
  "./favicon-32.png?v=199",
  "./apple-touch-icon.png?v=199",
  "./icon-192.png?v=199",
  "./icon-512.png?v=199",
  "./icon-maskable-512.png?v=199",
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
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
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

"use strict";

const CACHE_NAME = "schema-tjapo-cache-v173";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=173",
  "./mono-preview.css?v=173",
  "./fonts/kh-teka-regular.woff2",
  "./firebase-config.js?v=173",
  "./app.js?v=173",
  "./rest-alarm.mp3?v=173",
  "./side-alarm.mp3?v=173",
  "./audio-unlock.mp3?v=173",
  "./manifest.webmanifest?v=173",
  "./favicon.ico?v=173",
  "./favicon-32.png?v=173",
  "./apple-touch-icon.png?v=173",
  "./icon-192.png?v=173",
  "./icon-512.png?v=173",
  "./icon-maskable-512.png?v=173",
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

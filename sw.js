// শুধু অ্যাপের কাঠামো cache হয়; ওষুধের তথ্য ও দাম সবসময় সার্ভার থেকে আসে
const CACHE = 'pc-v1';
const SHELL = ['/', '/styles.css', '/app.js', '/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (!SHELL.includes(url.pathname)) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(url.pathname)));
});

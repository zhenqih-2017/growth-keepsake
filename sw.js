// Retirement worker: replace older cache-first workers without touching photos.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
 await self.clients.claim();
 for (const name of ['little-years-v1', 'little-years-v2', 'little-years-v3']) {
  await caches.delete(name);
 }
 await self.registration.unregister();
})()));
// No fetch handler: all page resources are requested from the network.

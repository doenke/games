/* Abgelöst: Alle Spiele laufen jetzt unter dem gemeinsamen Service Worker
   der Seite (/sw.js). Diese Datei bleibt nur, damit früher installierte
   Einzel-Apps sie beim nächsten Update-Check finden: Sie räumt den alten
   Cache weg, meldet sich ab und lädt offene Seiten neu. Nicht registrieren. */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith('spiele-')).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url).catch(() => {}));
  })());
});

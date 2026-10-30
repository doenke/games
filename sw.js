/* Service Worker für alle Spiele – eine einzige App für die ganze Seite.
   Er ist für "/" registriert, lädt beim Installieren alle Dateien aller Spiele
   vor (offline spielbar) und holt sonst alles Netz zuerst. Updates laufen
   still: Ein neuer Deploy ersetzt den Cache, ohne Meldung. */
// __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt (.github/workflows/deploy.yml).
const VERSION = '__BUILD__';
const CACHE   = `spiele-${VERSION}`;

// Der Deploy ersetzt die Liste durch alle hochgeladenen Dateien. Lokal (ohne
// Deploy) bleibt diese kleine Liste, der Rest landet beim ersten Aufruf im Cache.
const FILES = /*__FILES__*/['./', 'index.html', 'kontakt.html', 'site.css', 'favicon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(FILES.map((f) => cache.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Alles andere weg – auch die Caches der früheren Einzel-Apps je Spiel.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Alles Netz zuerst, damit HTML, CSS und JS immer aus demselben Deploy
  // stammen. Offline oder bei sehr langsamem Netz (4 s) greift der Cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Seitenaufrufe lassen sich nicht mit Optionen neu anfragen; für alle
      // anderen Dateien den HTTP-Cache des Browsers umgehen (Revalidierung).
      const net = req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' });
      const res = await withTimeout(net, 4000);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req, { ignoreSearch: true }))
        || (req.mode === 'navigate' ? await cache.match(new URL('index.html', url).href) : null)
        || Response.error();
    }
  })());
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

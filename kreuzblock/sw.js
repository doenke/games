/* Service Worker: Kreuzblock offline verfügbar halten. */
// __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt (.github/workflows/deploy.yml).
const VERSION = '__BUILD__';
const SHELL   = `kreuzblock-shell-${VERSION}`;

const SHELL_FILES = [
  './',
  'index.html',
  'anleitung.html',
  'css/style.css',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await Promise.all(SHELL_FILES.map((f) => cache.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('kreuzblock-shell-') && k !== SHELL)
                          .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Alles Netz zuerst, damit HTML, CSS und JS immer aus demselben Deploy
  // stammen. Ein Mix aus neuem HTML und altem Skript aus dem Cache hat nach
  // Updates die Seite zerlegt. Offline oder bei sehr langsamem Netz (4 s)
  // greift der Cache.
  event.respondWith((async () => {
    const cache = await caches.open(SHELL);
    try {
      // Seitenaufrufe lassen sich nicht mit Optionen neu anfragen; für alle
      // anderen Dateien den HTTP-Cache des Browsers umgehen (Revalidierung).
      const net = req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' });
      const res = await withTimeout(net, 4000);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await caches.match(req))
        || (req.mode === 'navigate' ? await caches.match('index.html') : null)
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

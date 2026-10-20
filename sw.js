/* Service Worker der Übersicht (Launcher).
   Er ist für "/" registriert und würde damit auch Seiten der Spiele erreichen.
   Deshalb bedient er ausschließlich die eigenen Dateien der Übersicht; alles in
   den Spiele-Ordnern geht unberührt ans Netz bzw. an den Service Worker des
   jeweiligen Spiels. */
// __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt (.github/workflows/deploy.yml).
const VERSION = '__BUILD__';
const SHELL   = `uebersicht-shell-${VERSION}`;

const SHELL_FILES = [
  './',
  'index.html',
  'kontakt.html',
  'site.css',
  'favicon.svg',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

// Pfade relativ zum Scope, die dieser Service Worker bedienen darf.
const OWN = new Set(SHELL_FILES.map((f) => new URL(f, self.registration.scope).pathname));
const isOwn = (url) => OWN.has(url.pathname) || url.pathname.startsWith(new URL('icons/', self.registration.scope).pathname);

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
    await Promise.all(keys.filter((k) => k.startsWith('uebersicht-shell-') && k !== SHELL)
                          .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !isOwn(url)) return; // Spiele nicht anfassen

  // Netz zuerst (gleiche Regel wie bei den Spielen), offline aus dem Cache.
  event.respondWith((async () => {
    const cache = await caches.open(SHELL);
    try {
      const net = req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' });
      const res = await withTimeout(net, 4000);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await caches.match(req)) || Response.error();
    }
  })());
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

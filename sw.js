/* Service worker mínimo do Claude (PWA): só guarda em cache os ícones e o
   manifest. Nunca guarda HTML ou JS — o site tem de carregar sempre a
   versão mais recente. */
const CACHE = "claude-v7.37";
const ASSETS = ["/icon-192.png", "/icon-512.png", "/icon-180.png", "/manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* O Chrome exige um listener de fetch para a instalação. Só os ficheiros
   estáticos da lista (mesma origem) passam pela cache; tudo o resto —
   navegação, HTML, JS e chamadas à API — vai direto para a rede. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  if (!ASSETS.includes(u.pathname)) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
      if (nr && nr.ok) {
        const cp = nr.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
      }
      return nr;
    }))
  );
});

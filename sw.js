// Make My Day — service worker
// Guarda os arquivos do app para abrir rápido e funcionar offline.
// Rede primeiro (sempre pega a versão mais nova); sem internet, usa o que está guardado.
// Quando mudar algum arquivo, aumente o número da versão abaixo.
const VERSAO = 'make-my-day-v1';
const ARQUIVOS = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon.svg',
                  'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // apaga os caches de versões antigas (inclui o "meu-dia-v1" do app anterior)
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // fontes do Google: cache primeiro
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(VERSAO).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; })))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
        return r;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
    );
  }
});

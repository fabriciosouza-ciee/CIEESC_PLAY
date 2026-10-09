// Troque o número da versão a cada atualização dos arquivos para o celular baixar a nova versão.
const VERSAO = 'ciee-play-v42';
const ARQUIVOS = [
  './',
  './admin.html',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-48.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icone-ios-v2.png',
  './assets/icons/maskable-512.png',
  './css/admin.css',
  './css/index.css',
  './css/playing.css',
  './css/politica.css',
  './index.html',
  './js/core/api.js',
  './js/core/atualiza.js',
  './js/core/lixeira.js',
  './js/core/moderacao.js',
  './js/core/niveis.js',
  './js/core/offline.js',
  './js/core/seguranca.js',
  './js/features/biometria.js',
  './js/features/calendario.js',
  './js/features/imagem.js',
  './js/features/leituras.js',
  './js/features/perfil.js',
  './js/features/relatorio.js',
  './js/features/scanner.js',
  './js/features/selos.js',
  './js/features/sugestoes.js',
  './js/pages/admin.js',
  './js/pages/index.js',
  './js/pages/playing.js',
  './js/ui/acessibilidade.js',
  './js/ui/atalhos.js',
  './js/ui/cookies.js',
  './js/ui/limpar-busca.js',
  './js/ui/temas.js',
  './js/vendor/jspdf-autotable.js',
  './js/vendor/jspdf.js',
  './js/vendor/qrcode.js',
  './js/vendor/zxing.js',
  './manifest.json',
  './playing.html',
  './politica-de-privacidade.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Páginas do app: tenta a internet primeiro (sempre atualizado) e usa o cache se estiver sem sinal.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // fontes, Outlook etc. seguem direto pela rede
  e.respondWith(
    fetch(req, { cache: 'no-store' }).then(res => {
      const copia = res.clone();
      caches.open(VERSAO).then(c => c.put(req, copia));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

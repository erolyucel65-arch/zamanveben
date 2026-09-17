// ZamanVeBen service worker — offline shell + runtime cache for CDN libs
const V = 'zvb-v3';
const LOCAL = ["./","index.html","manifest.webmanifest","icon.png","icon-maskable.png","supabase-config.js","icons.jsx","i18n.jsx","store.jsx","components.jsx","cloud.jsx","AuthGate.jsx","tweaks-panel.jsx","ritual-tweaks.jsx","DetailDrawer.jsx","Planners.jsx","LibraryView.jsx","MatrixView.jsx","TodayView.jsx","InsightsView.jsx","SettingsView.jsx","app.jsx"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(LOCAL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // never cache API/auth traffic
    if (url.hostname.endsWith('.supabase.co')) return;
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r; })));
    return;
  }
  e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(m => m || caches.match('index.html'))));
});

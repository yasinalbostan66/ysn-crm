// Cache versiyonu - her güncellemede artır
const CACHE_NAME = 'soft-crm-cache-v8';

// Önbelleğe alınacak dosyalar
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/components.js',
  './js/common.js',
  './js/sales.js',
  './js/marketing.js',
  './js/firebase.js'
];

// Kurulum: yeni cache oluştur
self.addEventListener('install', event => {
  // Hemen aktif ol - bekletme
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Aktivasyon: eski cache'leri sil
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // Tüm sekmeleri hemen kontrol et
  );
});

// Fetch: Network-First stratejisi - önce ağdan çek, olmazsa cache kullan
self.addEventListener('fetch', event => {
  // Sadece GET istekleri için cache uygula
  if (event.request.method !== 'GET') return;

  // Firebase ve harici API isteklerini cache'leme
  const url = event.request.url;
  if (url.includes('firebase') || url.includes('googleapis') || 
      url.includes('api.') || url.includes('cdn.') || url.includes('cdnjs.')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı yanıtı cache'e ekle
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Ağ yoksa cache'ten dön
        return caches.match(event.request);
      })
  );
});

const CACHE_NAME = 'ezan-vakti-v1';

// Çevrimdışı için hafızaya alınacak dosyalar
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Yükleme Aşaması: Dosyaları Önbelleğe (Cache) Ekle
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Getirme Aşaması: İnternet Yoksa Önbellekten Ver
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            // Eğer dosya önbellekte varsa onu ver, yoksa internetten indirmeyi dene
            return response || fetch(e.request);
        })
    );
});
const CACHE_NAME = 'nekoma-cache-v1';
const urlsToCache = [
  '/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Do not strictly require caching to succeed for SW installation
        return cache.addAll(urlsToCache).catch(err => console.log('Cache addAll failed', err));
      })
  );
});

self.addEventListener('fetch', event => {
  // Abaikan request selain GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Abaikan request internal Next.js, API, dan extension
  if (url.pathname.startsWith('/_next/') || 
      url.pathname.startsWith('/api/') || 
      !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch((err) => {
          console.log('Fetch failed for:', event.request.url, err);
          // Jika offline, kembalikan response kosong atau halaman fallback
        });
      })
  );
});

const CACHE_VERSION = '2025-10-16-001';
const CACHE_NAME = `wmart-ai-${CACHE_VERSION}`;
const urlsToCache = [
  '/manifest.json',
  '/logo.png',
  '/offline.html',
  '/offline.css'
];

const PROTECTED_ROUTES = [
  '/api/auth/',
  '/api/admin/',
  '/api/tenant/',
  '/api/tenants/',
  '/api/analytics/'
];

function isProtectedRoute(url) {
  return PROTECTED_ROUTES.some(route => url.includes(route));
}

function shouldSkipCaching(url) {
  return url.includes('/_next/') || url.includes('/api/');
}

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch((err) => {
          console.error('Failed to cache resources:', err);
        });
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // SECURITY: Never cache protected routes
  if (isProtectedRoute(event.request.url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.type !== 'basic') {
            return response;
          }

          // Don't cache redirects or auth failures
          if (response.status === 401 || response.status === 403 || response.status >= 300 && response.status < 400) {
            return response;
          }

          // Only cache successful responses (200-299)
          if (response.status < 200 || response.status >= 300) {
            return response;
          }

          // Skip caching Next.js build assets and API routes
          if (shouldSkipCaching(event.request.url)) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Only cache same-origin requests and specific static assets
          const url = new URL(event.request.url);
          if (url.origin === location.origin) {
            // Cache only public static assets (images, fonts, manifest)
            if (
              event.request.url.match(/\.(png|jpg|jpeg|svg|gif|woff|woff2|ttf|ico)$/) ||
              event.request.url.includes('/manifest.json')
            ) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
          }

          return response;
        }).catch(async () => {
          // Return cached offline page for document requests
          if (event.request.destination === 'document') {
            const offlineResponse = await caches.match('/offline.html');
            if (offlineResponse) {
              return offlineResponse;
            }
          }
          
          // Return cached offline CSS if available
          if (event.request.url.includes('/offline.css')) {
            const offlineCSS = await caches.match('/offline.css');
            if (offlineCSS) {
              return offlineCSS;
            }
          }
        });
      })
  );
});

// Handle background sync for offline actions (if needed in future)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'WMart AI Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url || '/dashboard'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/dashboard')
  );
});

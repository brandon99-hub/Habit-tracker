// Service Worker for HabitForge PWA
const CACHE_NAME = 'habitforge-v4' // Increment this to force update
const urlsToCache = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/logo-nobackground.png',
]

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - improved strategy for faster updates
self.addEventListener('fetch', (event) => {
    // Navigation request (HTML page) - Network-First
    // This ensures users get the latest HTML if online
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets (JS, CSS, Images) - Stale-While-Revalidate
    // Serve from cache but update in the background
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Cache the new version
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If fetch fails, we just return the cached response (if any)
            });

            return cachedResponse || fetchPromise;
        })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'HabitForge';
    const options = {
        body: data.body || 'Time to complete your habits!',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: data.vibrate || [200, 100, 200, 100, 200],
        data: data.data || {},
        actions: data.actions || [
            {
                action: 'complete',
                title: 'Mark Done',
                icon: '/logo.png'
            },
            {
                action: 'view',
                title: 'View',
                icon: '/logo.png'
            }
        ],
        tag: data.tag || 'habit-reminder',
        requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
        renotify: data.renotify || true,
        silent: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (let client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

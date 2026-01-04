// Service Worker for HabitForge PWA
const CACHE_NAME = 'habitforge-v2'; // BUMPED VERSION TO FORCE UPDATE
const urlsToCache = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/logo-nobackground.png',
];

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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'TaskFlow';
    const options = {
        body: data.body || 'Time to complete your tasks!',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: data.vibrate || [200, 100, 200, 100, 200], // More prominent vibration
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
        tag: data.tag || 'task-reminder',
        requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true, // Respect backend setting, default to true
        renotify: data.renotify || true, // Re-alert for same tag
        silent: false, // Always play sound
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
                // Check if app is already open
                for (let client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if not
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-habits') {
        event.waitUntil(
            // Sync logic here
            Promise.resolve()
        );
    }
});

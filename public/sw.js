// Service Worker for HabitForge PWA
const CACHE_NAME = 'habitforge-v1';
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
    const title = data.title || 'HabitForge';
    const options = {
        body: data.body || 'Time to complete your habits!',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
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
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'complete') {
        // Handle mark as done action
        event.waitUntil(
            clients.openWindow('/?action=complete&habitId=' + event.notification.data.habitId)
        );
    } else if (event.action === 'view') {
        // Handle view action
        event.waitUntil(
            clients.openWindow('/')
        );
    } else {
        // Default action - open app
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Check if app is already open
                    for (let client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window if not
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
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

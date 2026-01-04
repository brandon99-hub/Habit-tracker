"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    // Periodically check for updates (every 10 minutes)
                    const interval = setInterval(() => {
                        registration.update()
                    }, 10 * 60 * 1000)

                    // Also check for updates when the page becomes visible
                    const handleVisibilityChange = () => {
                        if (document.visibilityState === 'visible') {
                            registration.update()
                        }
                    }
                    document.addEventListener('visibilitychange', handleVisibilityChange)

                    return () => {
                        clearInterval(interval)
                        document.removeEventListener('visibilitychange', handleVisibilityChange)
                    }
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error)
                })

            // Auto-reload when a new service worker takes control
            let refreshing = false
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true
                    window.location.reload()
                }
            })
        }
    }, [])

    return null
}

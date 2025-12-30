"use client"

import { useEffect, useState } from "react"

export function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration)
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error)
                })
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)

            // Check if user has dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed')
            if (!dismissed) {
                setShowInstallPrompt(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running in standalone mode')
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        console.log(`User response: ${outcome}`)
        setDeferredPrompt(null)
        setShowInstallPrompt(false)
    }

    const handleDismiss = () => {
        setShowInstallPrompt(false)
        localStorage.setItem('pwa-install-dismissed', 'true')
    }

    if (!showInstallPrompt) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border border-border bg-card p-4 shadow-lg sm:left-auto sm:right-4 sm:w-96">
            <div className="flex items-start gap-3">
                <img src="/logo-nobackground.png" alt="HabitForge" className="h-12 w-12" />
                <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Install HabitForge</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add to your home screen for quick access and notifications
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Install
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

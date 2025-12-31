"use client"

import { useState, useEffect } from "react"

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function usePushSubscription() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if already subscribed on mount
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(async (registration) => {
                const subscription = await registration.pushManager.getSubscription()
                setIsSubscribed(!!subscription)
            })
        }
    }, [])

    const subscribe = async () => {
        if (!PUBLIC_KEY) {
            setError("VAPID Public Key not found")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const registration = await navigator.serviceWorker.ready

            // Subscribe the user
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
            })

            // Send subscription to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscription }),
            })

            if (!response.ok) {
                throw new Error('Failed to save subscription to server')
            }

            setIsSubscribed(true)
            console.log("Push user subscribed")
        } catch (err: any) {
            console.error('Failed to subscribe to push notifications', err)
            setError(err.message || 'Failed to subscribe')
        } finally {
            setLoading(false)
        }
    }

    const unsubscribe = async () => {
        // Implement unsubscribe if needed (optional for now)
    }

    return { isSubscribed, subscribe, loading, error }
}

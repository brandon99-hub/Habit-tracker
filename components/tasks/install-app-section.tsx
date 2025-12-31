"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function InstallAppSection() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            toast({
                title: "Installation Info",
                description: "App might already be installed or your browser doesn't support manual installation. Check your browser menu.",
            })
            return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsInstalled(true)
        }
    }

    // Only show if not installed (or if we want to show it always with a disabled state)
    // For now, let's show it always but give feedback if clicked and not prompted
    return (
        <Card className="p-6 mb-20"> {/* Extra margin for bottom nav */}
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Install TaskFlow
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                Install the app on your home screen for a better experience.
            </p>
            <Button
                onClick={handleInstallClick}
                className="w-full gradient-primary text-white border-0"
                disabled={isInstalled}
            >
                {isInstalled ? "App Installed" : "Install App"}
            </Button>
        </Card>
    )
}

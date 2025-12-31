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
                title: "Manual Install Required",
                description: "Tap the browser menu (⋮) and select 'Add to Home Screen' or 'Install App'.",
                duration: 5000,
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

    return (
        <Card className="p-6 mb-20">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Install TaskFlow
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                Get the standalone app experience.
            </p>

            <div className="space-y-3">
                <Button
                    onClick={handleInstallClick}
                    className="w-full gradient-primary text-white border-0"
                    disabled={isInstalled}
                >
                    {isInstalled ? "App Installed" : "Install App"}
                </Button>

                {!deferredPrompt && !isInstalled && (
                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        <p className="font-semibold mb-1">Don't see a prompt?</p>
                        <p>1. Tap your browser menu <span className="inline-block px-1 bg-background rounded border">⋮</span> or <span className="inline-block px-1 bg-background rounded border">Share</span></p>
                        <p>2. Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></p>
                    </div>
                )}
            </div>
        </Card>
    )
}

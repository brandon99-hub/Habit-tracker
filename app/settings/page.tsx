"use client"

import { SettingsPage as SettingsContent } from "@/components/settings-page"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"

export default function SettingsPage() {
    const router = useRouter()

    return (
        <>
            <div className="min-h-screen bg-background pb-24 md:pb-8">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold gradient-text">Settings</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage your preferences
                            </p>
                        </div>
                        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    {/* Settings Content */}
                    <SettingsContent />
                </div>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </>
    )
}

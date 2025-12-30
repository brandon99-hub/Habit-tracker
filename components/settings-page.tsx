"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Moon, Sun, Info } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { areNotificationsEnabled, requestNotificationPermission } from "@/lib/push-notifications"

export function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(false)

    useEffect(() => {
        setMounted(true)
        setNotificationsEnabled(areNotificationsEnabled())
    }, [])

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            const permission = await requestNotificationPermission()
            setNotificationsEnabled(permission === "granted")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your preferences</p>
            </div>

            {/* Notifications */}
            <Card className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Notifications</h3>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <Label htmlFor="notifications">Push Notifications</Label>
                            <p className="text-xs text-muted-foreground">
                                Get reminders for your habits
                            </p>
                        </div>
                        <Switch
                            id="notifications"
                            checked={notificationsEnabled}
                            onCheckedChange={handleNotificationToggle}
                        />
                    </div>

                    {notificationsEnabled && (
                        <div className="rounded-md bg-muted p-3">
                            <p className="text-xs text-muted-foreground">
                                ✓ Notifications enabled. You'll receive reminders for scheduled habits.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Appearance */}
            <Card className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        {mounted && theme === "dark" ? (
                            <Moon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <Sun className="h-5 w-5 text-muted-foreground" />
                        )}
                        <h3 className="font-semibold">Appearance</h3>
                    </div>

                    <div className="space-y-2">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={theme === "light" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("light")}
                                className="w-full"
                            >
                                <Sun className="mr-2 h-4 w-4" />
                                Light
                            </Button>
                            <Button
                                variant={theme === "dark" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("dark")}
                                className="w-full"
                            >
                                <Moon className="mr-2 h-4 w-4" />
                                Dark
                            </Button>
                            <Button
                                variant={theme === "system" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTheme("system")}
                                className="w-full"
                            >
                                System
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* About */}
            <Card className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">About</h3>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            <strong className="text-foreground">HabitForge</strong>
                        </p>
                        <p>Version 1.0.0</p>
                        <p>Discipline through clarity. Track what matters.</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}

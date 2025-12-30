"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

type Notification = {
    id: string
    title: string
    message: string
    timestamp: Date
    read: boolean
    type: "reminder" | "milestone" | "alert"
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [permission, setPermission] = useState<NotificationPermission>("default")

    useEffect(() => {
        if ("Notification" in window) {
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = async () => {
        if ("Notification" in window) {
            const perm = await Notification.requestPermission()
            setPermission(perm)

            if (perm === "granted") {
                new Notification("HabitForge Notifications Enabled", {
                    body: "You'll now receive reminders for your habits!",
                    icon: "/icon.svg",
                })
            }
        }
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
    }

    const clearAll = () => {
        setNotifications([])
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-2">
                    <h3 className="font-semibold">Notifications</h3>
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                            Clear all
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />

                {permission !== "granted" && (
                    <div className="p-3">
                        <div className="mb-2 flex items-start gap-2">
                            <BellOff className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Enable Notifications</p>
                                <p className="text-xs text-muted-foreground">Get reminders for your habits</p>
                            </div>
                        </div>
                        <Button onClick={requestPermission} size="sm" className="w-full">
                            Enable
                        </Button>
                    </div>
                )}

                {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex cursor-pointer flex-col items-start gap-1 p-3"
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <p className={`text-sm font-medium ${notification.read ? "text-muted-foreground" : ""}`}>
                                        {notification.title}
                                    </p>
                                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {notification.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

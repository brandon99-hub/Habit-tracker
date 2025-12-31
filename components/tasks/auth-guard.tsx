"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function TasksAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    // Don't redirect if on login or signup pages
    const isAuthPage = pathname === "/tasks/login" || pathname === "/tasks/signup"

    useEffect(() => {
        if (!loading && !user && !isAuthPage) {
            router.push("/tasks/login")
        }
    }, [user, loading, router, isAuthPage])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    // Allow auth pages to render even without user
    if (!user && !isAuthPage) {
        return null
    }

    return <div className="min-h-screen bg-background">{children}</div>
}

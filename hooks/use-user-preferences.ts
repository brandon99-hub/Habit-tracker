"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { UserPreferences, DEFAULT_PREFERENCES } from "@/lib/profile/preferences"

export function useUserPreferences() {
    const { user } = useAuth()
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user?.user_metadata?.preferences) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...user.user_metadata.preferences })
        }
        setLoading(false)
    }, [user])

    return { preferences, setPreferences, loading }
}

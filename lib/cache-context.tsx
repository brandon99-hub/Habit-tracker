"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type CacheEntry<T> = {
    data: T
    timestamp: number
    expiresIn: number // milliseconds
}

type CacheStore = {
    [key: string]: CacheEntry<any>
}

type CacheContextType = {
    get: <T>(key: string) => T | null
    set: <T>(key: string, data: T, expiresIn?: number) => void
    invalidate: (key: string) => void
    invalidateAll: () => void
    has: (key: string) => boolean
}

const CacheContext = createContext<CacheContextType | null>(null)

const DEFAULT_CACHE_TIME = 5 * 60 * 1000 // 5 minutes

export function CacheProvider({ children }: { children: ReactNode }) {
    const [cache, setCache] = useState<CacheStore>({})

    // Load cache from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("task-cache")
            if (stored) {
                const parsed = JSON.parse(stored)
                setCache(parsed)
            }
        } catch (error) {
            console.error("Error loading cache:", error)
        }
    }, [])

    // Save cache to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem("task-cache", JSON.stringify(cache))
        } catch (error) {
            console.error("Error saving cache:", error)
        }
    }, [cache])

    const get = <T,>(key: string): T | null => {
        const entry = cache[key]
        if (!entry) return null

        const now = Date.now()
        const isExpired = now - entry.timestamp > entry.expiresIn

        if (isExpired) {
            // Remove expired entry
            setCache(prev => {
                const newCache = { ...prev }
                delete newCache[key]
                return newCache
            })
            return null
        }

        return entry.data as T
    }

    const set = <T,>(key: string, data: T, expiresIn: number = DEFAULT_CACHE_TIME) => {
        setCache(prev => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now(),
                expiresIn
            }
        }))
    }

    const invalidate = (key: string) => {
        setCache(prev => {
            const newCache = { ...prev }
            delete newCache[key]
            return newCache
        })
    }

    const invalidateAll = () => {
        setCache({})
        localStorage.removeItem("task-cache")
    }

    const has = (key: string): boolean => {
        const entry = cache[key]
        if (!entry) return false

        const now = Date.now()
        const isExpired = now - entry.timestamp > entry.expiresIn
        return !isExpired
    }

    return (
        <CacheContext.Provider value={{ get, set, invalidate, invalidateAll, has }}>
            {children}
        </CacheContext.Provider>
    )
}

export function useCache() {
    const context = useContext(CacheContext)
    if (!context) {
        throw new Error("useCache must be used within CacheProvider")
    }
    return context
}

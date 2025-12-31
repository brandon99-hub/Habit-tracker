"use client"

import { useState, useEffect } from "react"
import {
    getDatabases,
    createDatabase,
    updateDatabase,
    deleteDatabase,
    type Database,
} from "@/lib/tasks/supabase-tasks"

export function useDatabases(workspaceId: string | null) {
    const [databases, setDatabases] = useState<Database[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDatabases = async () => {
        if (!workspaceId) {
            setLoading(false)
            return
        }

        setLoading(true)
        const { data, error } = await getDatabases(workspaceId)

        if (error) {
            setError(error.message)
        } else {
            setDatabases(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchDatabases()
    }, [workspaceId])

    const addDatabase = async (name: string, icon?: string, description?: string) => {
        if (!workspaceId) return { error: "No workspace selected" }

        const { data, error } = await createDatabase(workspaceId, name, icon, description)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setDatabases([data, ...databases])
        }

        return { data, error: null }
    }

    const editDatabase = async (id: string, updates: Partial<Database>) => {
        const { data, error } = await updateDatabase(id, updates)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setDatabases(databases.map((d) => (d.id === id ? data : d)))
        }

        return { data, error: null }
    }

    const removeDatabase = async (id: string) => {
        const { error } = await deleteDatabase(id)

        if (error) {
            setError(error.message)
            return { error }
        }

        setDatabases(databases.filter((d) => d.id !== id))
        return { error: null }
    }

    return {
        databases,
        loading,
        error,
        addDatabase,
        editDatabase,
        removeDatabase,
        refetch: fetchDatabases,
    }
}

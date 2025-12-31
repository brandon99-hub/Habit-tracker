"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
    getWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    type Workspace,
} from "@/lib/tasks/supabase-tasks"

export function useWorkspaces() {
    const { user } = useAuth()
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchWorkspaces = async () => {
        if (!user) return

        setLoading(true)
        const { data, error } = await getWorkspaces(user.id)

        if (error) {
            setError(error.message)
        } else {
            setWorkspaces(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchWorkspaces()
    }, [user])

    const addWorkspace = async (name: string, icon?: string) => {
        if (!user) return

        const { data, error } = await createWorkspace(user.id, name, icon)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setWorkspaces([data, ...workspaces])
        }

        return { data, error: null }
    }

    const editWorkspace = async (id: string, updates: Partial<Workspace>) => {
        const { data, error } = await updateWorkspace(id, updates)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setWorkspaces(workspaces.map((w) => (w.id === id ? data : w)))
        }

        return { data, error: null }
    }

    const removeWorkspace = async (id: string) => {
        const { error } = await deleteWorkspace(id)

        if (error) {
            setError(error.message)
            return { error }
        }

        setWorkspaces(workspaces.filter((w) => w.id !== id))
        return { error: null }
    }

    return {
        workspaces,
        loading,
        error,
        addWorkspace,
        editWorkspace,
        removeWorkspace,
        refetch: fetchWorkspaces,
    }
}

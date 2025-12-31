"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    type Category,
} from "@/lib/tasks/supabase-categories"

export function useCategories() {
    const { user } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCategories = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        setLoading(true)
        const { data, error } = await getCategories(user.id)

        if (error) {
            setError(error.message)
        } else {
            setCategories(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCategories()
    }, [user])

    const addCategory = async (
        name: string,
        icon?: string,
        description?: string,
        color?: string,
        gradient?: string
    ) => {
        if (!user) return { error: "No user logged in" }

        const { data, error } = await createCategory(user.id, name, icon, description, color, gradient)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setCategories([data, ...categories])
        }

        return { data, error: null }
    }

    const editCategory = async (id: string, updates: Partial<Category>) => {
        const { data, error } = await updateCategory(id, updates)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setCategories(categories.map((c) => (c.id === id ? data : c)))
        }

        return { data, error: null }
    }

    const removeCategory = async (id: string) => {
        const { error } = await deleteCategory(id)

        if (error) {
            setError(error.message)
            return { error }
        }

        setCategories(categories.filter((c) => c.id !== id))
        return { error: null }
    }

    return {
        categories,
        loading,
        error,
        addCategory,
        editCategory,
        removeCategory,
        refetch: fetchCategories,
    }
}

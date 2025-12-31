"use client"

import { useState, useEffect } from "react"
import {
    getPages,
    getProperties,
    getPropertyValues,
    createPage,
    updatePage,
    deletePage,
    setPropertyValue,
    type Page,
    type Property,
    type PropertyValue,
} from "@/lib/tasks/supabase-categories"

export type TaskWithProperties = Page & {
    properties?: (PropertyValue & { task_properties: Property })[]
}

export function useTasks(categoryId: string | null) {
    const [tasks, setTasks] = useState<Page[]>([])
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTasks = async () => {
        if (!categoryId) {
            setLoading(false)
            return
        }

        setLoading(true)
        const [pagesResult, propsResult] = await Promise.all([
            getPages(categoryId),
            getProperties(categoryId),
        ])

        if (pagesResult.error) {
            setError(pagesResult.error.message)
        } else {
            setTasks(pagesResult.data || [])
        }

        if (propsResult.error) {
            setError(propsResult.error.message)
        } else {
            setProperties(propsResult.data || [])
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchTasks()
    }, [categoryId])

    const addTask = async (title: string, icon?: string) => {
        if (!categoryId) return { error: "No category selected" }

        const { data, error } = await createPage(categoryId, title, icon)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setTasks([data, ...tasks])
        }

        return { data, error: null }
    }

    const editTask = async (id: string, updates: Partial<Page>) => {
        const { data, error } = await updatePage(id, updates)

        if (error) {
            setError(error.message)
            return { error }
        }

        if (data) {
            setTasks(tasks.map((t) => (t.id === id ? data : t)))
        }

        return { data, error: null }
    }

    const removeTask = async (id: string) => {
        const { error } = await deletePage(id)

        if (error) {
            setError(error.message)
            return { error }
        }

        setTasks(tasks.filter((t) => t.id !== id))
        return { error: null }
    }

    const updateProperty = async (pageId: string, propertyId: string, value: any) => {
        const { error } = await setPropertyValue(pageId, propertyId, value)

        if (error) {
            setError(error.message)
            return { error }
        }

        return { error: null }
    }

    const getTaskProperties = async (pageId: string) => {
        const { data, error } = await getPropertyValues(pageId)

        if (error) {
            setError(error.message)
            return { data: null, error }
        }

        return { data, error: null }
    }

    return {
        tasks,
        properties,
        loading,
        error,
        addTask,
        editTask,
        removeTask,
        updateProperty,
        getTaskProperties,
        refetch: fetchTasks,
    }
}

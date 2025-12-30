"use client"

import { useState, useEffect } from 'react'
import { supabase, type Reflection as DBReflection } from '@/lib/supabase'

export function useReflections() {
    const [reflections, setReflections] = useState<DBReflection[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadReflections()
    }, [])

    async function loadReflections() {
        try {
            const { data, error } = await supabase
                .from('reflections')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setReflections(data || [])
        } catch (err) {
            console.error('Error loading reflections:', err)
        } finally {
            setLoading(false)
        }
    }

    async function addReflection(content: string) {
        try {
            const { error } = await supabase
                .from('reflections')
                .insert({ content })

            if (error) throw error

            await loadReflections()
        } catch (err) {
            console.error('Error adding reflection:', err)
            throw err
        }
    }

    return {
        reflections,
        loading,
        addReflection,
    }
}

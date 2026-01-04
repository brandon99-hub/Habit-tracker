"use client"

import { useState, useEffect } from 'react'
import { supabase, type Habit as DBHabit, type Completion as DBCompletion } from '@/lib/supabase'
import { calculateStreak, formatDateToISO } from '@/lib/habit-service'

// Client-side habit type with computed fields
export type Habit = DBHabit & {
    completedToday: boolean
    value?: number
    currentStreak: number
    longestStreak: number
    lastCompletedDate?: string
    pausedDays: number
    history: { date: string; completed: boolean; value?: number }[]
    icon?: string
}

export function useHabits() {
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Load habits from Supabase
    useEffect(() => {
        loadHabits()
    }, [])

    async function loadHabits() {
        try {
            setLoading(true)
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .order('created_at', { ascending: false })

            if (habitsError) throw habitsError

            // Load completions for each habit
            const habitsWithData = await Promise.all(
                (habitsData || []).map(async (habit) => {
                    const { data: completions } = await supabase
                        .from('completions')
                        .select('*')
                        .eq('habit_id', habit.id)
                        .order('completed_at', { ascending: false })

                    const history = (completions || []).map((c) => ({
                        date: c.completed_at.split('T')[0],
                        completed: true,
                        value: c.value,
                    }))

                    const streakData = calculateStreak(history)
                    const today = formatDateToISO()
                    const completedToday = history.some((h) => h.date === today)

                    return {
                        ...habit,
                        history,
                        completedToday,
                        currentStreak: streakData.current,
                        longestStreak: streakData.longest,
                        pausedDays: streakData.paused,
                        lastCompletedDate: history[0]?.date,
                    }
                })
            )

            setHabits(habitsWithData)
            setError(null)
        } catch (err) {
            console.error('Error loading habits:', err)
            setError(err instanceof Error ? err.message : 'Failed to load habits')
        } finally {
            setLoading(false)
        }
    }

    async function addHabit(
        name: string,
        type: 'binary' | 'numeric',
        unit?: string,
        category?: string,
        scheduledDays?: number[],
        scheduledTime?: string,
        icon?: string,
    ) {
        try {
            const { data, error } = await supabase
                .from('habits')
                .insert({
                    name,
                    type,
                    unit,
                    category,
                    scheduled_days: scheduledDays,
                    scheduled_time: scheduledTime,
                    icon: icon || 'Sparkles',
                    archived: false,
                    paused: false,
                })
                .select()
                .single()

            if (error) throw error

            await loadHabits()
            return data
        } catch (err) {
            console.error('Error adding habit:', err)
            throw err
        }
    }

    async function updateHabit(
        habitId: string,
        updates: Partial<Omit<DBHabit, 'id' | 'created_at'>>
    ) {
        try {
            const { error } = await supabase
                .from('habits')
                .update(updates)
                .eq('id', habitId)

            if (error) throw error

            await loadHabits()
        } catch (err) {
            console.error('Error updating habit:', err)
            throw err
        }
    }

    async function deleteHabit(habitId: string) {
        try {
            const { error } = await supabase
                .from('habits')
                .delete()
                .eq('id', habitId)

            if (error) throw error

            setHabits(habits.filter((h) => h.id !== habitId))
        } catch (err) {
            console.error('Error deleting habit:', err)
            throw err
        }
    }

    async function toggleHabit(habitId: string, value?: number, note?: string) {
        try {
            const habit = habits.find((h) => h.id === habitId)
            if (!habit) return

            const today = formatDateToISO()
            const isCompleted = habit.history.some((h) => h.date === today)

            if (isCompleted) {
                // Remove completion
                const { error } = await supabase
                    .from('completions')
                    .delete()
                    .eq('habit_id', habitId)
                    .gte('completed_at', `${today}T00:00:00`)
                    .lt('completed_at', `${today}T23:59:59`)

                if (error) throw error
            } else {
                // Add completion
                const { error } = await supabase
                    .from('completions')
                    .insert({
                        habit_id: habitId,
                        completed_at: new Date().toISOString(),
                        value,
                        note,
                    })

                if (error) throw error
            }

            await loadHabits()
        } catch (err) {
            console.error('Error toggling habit:', err)
            throw err
        }
    }

    return {
        habits,
        loading,
        error,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabit,
        refreshHabits: loadHabits,
    }
}

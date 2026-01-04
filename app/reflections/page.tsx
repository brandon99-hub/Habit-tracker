"use client"

import { useHabits } from "@/hooks/use-habits"
import { useReflections } from "@/hooks/use-reflections"
import { WeeklyReflection } from "@/components/weekly-reflection"
import { HabitTimeline } from "@/components/habit-timeline"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function ReflectionsPage() {
    const router = useRouter()
    const { habits, loading } = useHabits()
    const [reflections, setReflections] = useState<any[]>([])

    useEffect(() => {
        loadReflections()
    }, [])

    async function loadReflections() {
        const { data } = await supabase
            .from("reflections")
            .select("*")
            .order("created_at", { ascending: false })

        if (data) setReflections(data)
    }

    const handleAddReflection = async (content: string) => {
        const { error } = await supabase
            .from("reflections")
            .insert({ content })

        if (!error) {
            loadReflections()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading reflections...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Reflections</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Weekly insights and habit timeline
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <div className="space-y-8">
                    <WeeklyReflection
                        reflections={reflections.map(r => ({ ...r, date: r.created_at }))}
                        onAddReflection={handleAddReflection}
                    />
                    <div className="mt-8">
                        <HabitTimeline habits={habits} />
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    )
}

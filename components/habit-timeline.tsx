"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Completion = {
  id: string
  habit_id: string
  completed_at: string
  value?: number
  note?: string
}

type HabitTimelineProps = {
  habits: Array<{ id: string; name: string; unit?: string }>
}

const ITEMS_PER_PAGE = 5

export function HabitTimeline({ habits }: HabitTimelineProps) {
  const [completions, setCompletions] = useState<Completion[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompletions()
  }, [])

  async function loadCompletions() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('completions')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(50) // Get last 50 completions

      if (error) throw error
      setCompletions(data || [])
    } catch (err) {
      console.error('Error loading completions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getHabitName = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    return habit?.name || 'Unknown Habit'
  }

  const getHabitUnit = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    return habit?.unit
  }

  const totalPages = Math.ceil(completions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentCompletions = completions.slice(startIndex, endIndex)

  if (loading) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Activity</h2>
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        </Card>
      </section>
    )
  }

  if (completions.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Activity</h2>
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No activity yet. Complete your first habit to see it here.</p>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Activity</h2>
        <p className="text-sm text-muted-foreground">
          {completions.length} total completion{completions.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-2">
        {currentCompletions.map((completion) => {
          const habitName = getHabitName(completion.habit_id)
          const habitUnit = getHabitUnit(completion.habit_id)

          return (
            <Card key={completion.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {habitName}
                    {completion.value && habitUnit && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {completion.value} {habitUnit}
                      </span>
                    )}
                  </p>
                  {completion.note && (
                    <p className="mt-1 text-sm italic text-muted-foreground">&quot;{completion.note}&quot;</p>
                  )}
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(completion.completed_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

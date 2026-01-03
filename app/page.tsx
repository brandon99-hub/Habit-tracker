"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Plus, MoreVertical, Archive, Pause, Play, Trash2, MessageSquare, Moon, Sun, Edit } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HabitTimeline } from "@/components/habit-timeline"
import { AddHabitDialog } from "@/components/add-habit-dialog"
import { EditHabitDialog } from "@/components/edit-habit-dialog"
import { HabitStats } from "@/components/habit-stats"
import { WeeklyReflection } from "@/components/weekly-reflection"
import { HabitNoteDialog } from "@/components/habit-note-dialog"
import { NotificationCenter } from "@/components/notification-center"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HabitDetailDialog } from "@/components/habit-detail-dialog"
import { useHabits } from "@/hooks/use-habits"
import { useReflections } from "@/hooks/use-reflections"
import { calculateConsistency, isScheduledToday } from "@/lib/habit-service"
import { MobileNav } from "@/components/mobile-nav"
import { SwipeableHabitCard } from "@/components/swipeable-habit-card"
import { SettingsPage } from "@/components/settings-page"

type Completion = {
  id: string
  habitId: string
  habitName: string
  timestamp: Date
  value?: number
  unit?: string
  note?: string
}

export default function HabitForgePage() {
  const { habits, loading, error, addHabit, updateHabit, deleteHabit, toggleHabit } = useHabits()
  const { reflections, addReflection } = useReflections()

  const [completions, setCompletions] = useState<Completion[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editHabitId, setEditHabitId] = useState<string | null>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteHabitId, setNoteHabitId] = useState<string | null>(null)
  const [noteHabitValue, setNoteHabitValue] = useState<number | undefined>(undefined)
  const [currentTab, setCurrentTab] = useState<"active" | "archived">("active")
  const [detailHabitId, setDetailHabitId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<"today" | "stats" | "reflections" | "settings">("today")

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Fix for theme toggle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleHabit = async (habitId: string, value?: number, note?: string) => {
    await toggleHabit(habitId, value, note)
  }

  const openNoteDialog = (habitId: string, value?: number) => {
    setNoteHabitId(habitId)
    setNoteHabitValue(value)
    setNoteDialogOpen(true)
  }

  const handleHabitWithNote = async (note: string) => {
    if (noteHabitId) {
      await toggleHabit(noteHabitId, noteHabitValue, note)
      setNoteDialogOpen(false)
      setNoteHabitId(null)
      setNoteHabitValue(undefined)
    }
  }

  const handleAddHabit = async (
    name: string,
    type: "binary" | "numeric",
    unit?: string,
    category?: string,
    scheduledDays?: number[],
    scheduledTime?: string
  ) => {
    await addHabit(name, type, unit, category, scheduledDays, scheduledTime)
    setShowAddDialog(false)
  }

  const handleEditHabit = async (
    habitId: string,
    name: string,
    type: "binary" | "numeric",
    unit?: string,
    category?: string,
    scheduledDays?: number[],
    scheduledTime?: string
  ) => {
    await updateHabit(habitId, {
      name,
      type,
      unit,
      category,
      scheduled_days: scheduledDays,
      scheduled_time: scheduledTime,
    })
    setEditHabitId(null)
  }

  const togglePauseHabit = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId)
    if (habit) {
      await updateHabit(habitId, { paused: !habit.paused })
    }
  }

  const archiveHabit = async (habitId: string) => {
    await updateHabit(habitId, { archived: true })
  }

  const unarchiveHabit = async (habitId: string) => {
    await updateHabit(habitId, { archived: false })
  }

  const handleDeleteHabit = async (habitId: string) => {
    await deleteHabit(habitId)
  }

  const handleAddReflection = async (content: string) => {
    await addReflection(content)
  }

  const activeHabits = habits.filter((h) => !h.archived)
  const archivedHabits = habits.filter((h) => h.archived)
  const visibleHabits = activeHabits.filter((h) => !h.paused && isScheduledToday(h.scheduled_days))

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading habits...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-safe">
        <header className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-nobackground.png" alt="HabitForge Logo" className="h-16 w-16" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">HabitForge</h1>
              <p className="mt-1 text-sm text-muted-foreground">Discipline through clarity. Track what matters.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 p-0"
              suppressHydrationWarning
            >
              {mounted && (
                <>
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </>
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as "active" | "archived")} className="mb-12">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Today</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archivedHabits.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Today
                {activeHabits.length > visibleHabits.length && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({visibleHabits.length} scheduled)
                  </span>
                )}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Habit
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleHabits.map((habit) => (
                <SwipeableHabitCard
                  key={habit.id}
                  onSwipeRight={() => !habit.completedToday && handleToggleHabit(habit.id)}
                  disabled={habit.completedToday}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <button onClick={() => setDetailHabitId(habit.id)} className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{habit.name}</h3>
                          {habit.category && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {habit.category}
                            </span>
                          )}
                          {habit.scheduled_time && (
                            <span className="text-xs text-muted-foreground">{habit.scheduled_time}</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          {habit.currentStreak > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-foreground">{habit.currentStreak}</span> day streak
                              {habit.pausedDays > 0 && <span className="text-yellow-600">(paused)</span>}
                            </span>
                          )}
                          {habit.longestStreak > habit.currentStreak && <span>Best: {habit.longestStreak} days</span>}
                          <span>{calculateConsistency(habit.history, 7)}% this week</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {habit.type === "binary" ? (
                          <>
                            <Button
                              variant={habit.completedToday ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleToggleHabit(habit.id)}
                              className="h-10 gap-2 px-4"
                            >
                              {habit.completedToday && <Check className="h-4 w-4" />}
                              {habit.completedToday ? "Done" : "Mark Done"}
                            </Button>
                            {!habit.completedToday && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openNoteDialog(habit.id)}
                                className="h-10 w-10 p-0"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={habit.value || 0}
                              onChange={async (e) => {
                                const val = Number.parseInt(e.target.value) || 0
                                await updateHabit(habit.id, { value: val } as any)
                              }}
                              className="h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                            <Button
                              variant={habit.completedToday ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleToggleHabit(habit.id, habit.value)}
                              className="h-10 gap-2 px-4"
                            >
                              {habit.completedToday && <Check className="h-4 w-4" />}
                              Log
                            </Button>
                            {!habit.completedToday && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openNoteDialog(habit.id, habit.value)}
                                className="h-10 w-10 p-0"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditHabitId(habit.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePauseHabit(habit.id)}>
                              {habit.paused ? (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Resume
                                </>
                              ) : (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveHabit(habit.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteHabit(habit.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                </SwipeableHabitCard>
              ))}

              {activeHabits.some((h) => h.paused) && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Paused</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {activeHabits
                      .filter((h) => h.paused)
                      .map((habit) => (
                        <Card key={habit.id} className="p-3 opacity-60">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{habit.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => togglePauseHabit(habit.id)}>
                              <Play className="mr-2 h-3 w-3" />
                              Resume
                            </Button>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="mt-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Archived Habits</h2>
              <p className="text-sm text-muted-foreground">Habits you've completed or replaced</p>
            </div>

            {archivedHabits.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No archived habits yet</p>
              </Card>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {archivedHabits.map((habit) => (
                  <Card key={habit.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{habit.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {habit.history.filter((h) => h.completed).length} total completions · Best streak:{" "}
                          {habit.longestStreak} days
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => unarchiveHabit(habit.id)}>
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHabit(habit.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Desktop: Show all sections | Mobile: Show based on active tab */}
        <div className={mobileTab !== "today" ? "hidden md:block" : "md:block"}>
          {mobileTab === "today" && (
            <div className="md:hidden">
              {/* Mobile Today tab content - just habits, no stats */}
            </div>
          )}
        </div>

        <div className={mobileTab !== "stats" ? "hidden md:block" : "block"}>
          <HabitStats habits={activeHabits} />
        </div>

        <div className={mobileTab !== "reflections" ? "hidden md:block" : "block"}>
          <WeeklyReflection
            reflections={reflections.map(r => ({ ...r, date: r.created_at }))}
            onAddReflection={handleAddReflection}
          />

          <div className="mt-8">
            <HabitTimeline habits={habits} />
          </div>
        </div>

        {mobileTab === "settings" && (
          <div className="md:hidden">
            <SettingsPage />
          </div>
        )}

        <AddHabitDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddHabit} />
        <HabitNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} onSubmit={handleHabitWithNote} />
        {editHabitId && (
          <EditHabitDialog
            open={!!editHabitId}
            onOpenChange={(open) => !open && setEditHabitId(null)}
            habit={habits.find((h) => h.id === editHabitId)!}
            onSave={handleEditHabit}
          />
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} />

      {detailHabitId && (
        <HabitDetailDialog
          habit={habits.find((h) => h.id === detailHabitId)!}
          completions={completions.filter((c) => c.habitId === detailHabitId)}
          open={!!detailHabitId}
          onOpenChange={(open) => !open && setDetailHabitId(null)}
        />
      )}
    </div>
  )
}

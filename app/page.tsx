"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Global error handler for mobile debugging
if (typeof window !== 'undefined') {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const errorMsg = `Error: ${msg}\nFile: ${url}\nLine: ${lineNo}:${columnNo}\nStack: ${error?.stack || 'N/A'}`
    console.error('MOBILE ERROR:', errorMsg)
    // Uncomment to show alert on mobile
    // alert(errorMsg)
    return false
  }

  window.addEventListener('unhandledrejection', function (event) {
    console.error('UNHANDLED PROMISE REJECTION:', event.reason)
    // Uncomment to show alert on mobile
    // alert('Promise rejection: ' + event.reason)
  })
}

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, Plus, MoreVertical, Archive, Pause, Play, Trash2, MessageSquare, Moon, Sun, Edit, Eye, Clock, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { GradientCard } from "@/components/ui/gradient-card"
import { getStreakBadge } from "@/components/streak-badge"
import { HabitIcon } from "@/components/habit-icon"

type Completion = {
  id: string
  habitId: string
  habitName: string
  timestamp: Date
  value?: number
  unit?: string
  note?: string
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { habits, loading, addHabit, updateHabit, deleteHabit, toggleHabit } = useHabits()
  const { reflections, addReflection } = useReflections()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<"today" | "archived">("today")
  const [detailHabitId, setDetailHabitId] = useState<string | null>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteHabitId, setNoteHabitId] = useState<string | null>(null)
  const [noteHabitValue, setNoteHabitValue] = useState<number | undefined>(undefined)
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
    scheduledTime?: string,
    icon?: string,
  ) => {
    await addHabit(name, type, unit, category, scheduledDays, scheduledTime, icon)
    setShowAddDialog(false)
  }



  const handleDeleteHabit = async (habitId: string) => {
    await deleteHabit(habitId)
  }

  const handleAddReflection = async (content: string) => {
    await addReflection(content)
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

  const activeHabits = habits.filter((h) => !h.archived)
  const archivedHabits = habits.filter((h) => h.archived)
  const visibleHabits = activeHabits.filter((h) => !h.paused && isScheduledToday(h.scheduled_days))

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!mounted) return null;

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

        <Tabs value={activeTab === "today" ? "active" : "archived"} onValueChange={(v) => setActiveTab(v === "active" ? "today" : "archived")} className="w-full">
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
                  <GradientCard
                    gradient="card"
                    hover="lift"
                    className={cn(
                      "p-3 cursor-pointer relative overflow-hidden transition-all duration-300",
                      habit.completedToday && "opacity-75 bg-accent/50"
                    )}
                    onClick={() => router.push(`/habit/${habit.id}`)}
                  >
                    {/* Top Section: Icon, Title, Streak, Menu */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0 transition-colors",
                          habit.completedToday ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                        )}>
                          {habit.icon ? (
                            <HabitIcon name={habit.icon as any} className="h-5 w-5" />
                          ) : (
                            <div className="h-5 w-5 flex items-center justify-center font-bold">
                              {habit.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className={cn(
                            "font-bold text-base leading-tight truncate",
                            habit.completedToday && "text-muted-foreground line-through decoration-2"
                          )}>
                            {habit.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {habit.category && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
                                {habit.category}
                              </span>
                            )}
                            {habit.scheduled_time && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                <Clock className="h-3 w-3" />
                                <span>{habit.scheduled_time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {habit.currentStreak > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">
                            <Flame className="h-3.5 w-3.5" />
                            <span>{habit.currentStreak}</span>
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/habit/${habit.id}`) }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Middle Section: Progress & Actions */}
                    <div className="flex items-end justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-muted-foreground font-medium">
                            {calculateConsistency(habit.history, 7)}% consistency
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              habit.completedToday ? "bg-green-500" : "bg-primary"
                            )}
                            style={{ width: `${calculateConsistency(habit.history, 7)}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0">
                        {habit.type === "binary" ? (
                          <Button
                            variant={habit.completedToday ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleHabit(habit.id)}
                            className={cn(
                              "h-9 w-9 p-0 rounded-xl transition-all duration-300",
                              habit.completedToday
                                ? "bg-green-500 hover:bg-green-600 border-none scale-105 shadow-sm shadow-green-500/20"
                                : "hover:border-primary hover:text-primary"
                            )}
                          >
                            {habit.completedToday ? (
                              <Check className="h-5 w-5 text-white" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-current" />
                            )}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50">
                            <Input
                              type="number"
                              value={habit.value || 0}
                              onChange={async (e) => {
                                const val = Number.parseInt(e.target.value) || 0
                                await updateHabit(habit.id, { value: val } as any)
                              }}
                              className="w-12 h-7 border-none p-0 text-center text-sm font-bold bg-transparent focus-visible:ring-0 shadow-none"
                              min="0"
                            />
                            <Button
                              variant={habit.completedToday ? "default" : "secondary"}
                              size="sm"
                              onClick={() => handleToggleHabit(habit.id, habit.value)}
                              className={cn(
                                "h-7 px-3 text-[10px] font-bold rounded-lg transition-all",
                                habit.completedToday && "bg-green-500 hover:bg-green-600 text-white border-none"
                              )}
                            >
                              {habit.completedToday ? "SAVED" : "LOG"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </GradientCard>
                </SwipeableHabitCard>
              ))}
            </div>

            {!visibleHabits.length && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
                <p className="text-sm text-muted-foreground">No habits scheduled for today</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeHabits.length > 0 ? "Check your schedule settings" : "Add your first habit to get started"}
                </p>
              </div>
            )}
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
        </Tabs >

        <AddHabitDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddHabit} />
        <HabitNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} onSubmit={handleHabitWithNote} />
      </div>

      {/* Mobile Navigation */}
      < MobileNav />
    </div >
  )
}

"use client"

import { useCategories } from "@/hooks/use-categories"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { GradientCard } from "@/components/ui/gradient-card"
import { EmptyState } from "@/components/ui/empty-state"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { BottomNav } from "@/components/ui/bottom-nav"
import { ProgressRing } from "@/components/ui/progress-ring"
import { Plus, CheckCircle2, Clock, AlertCircle, Grid, Calendar, User, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { CreateCategoryDialog } from "@/components/tasks/create-category-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"

export default function TasksPage() {
    const { user, signOut } = useAuth()
    const { categories, loading, addCategory } = useCategories()
    const [showCategoryDialog, setShowCategoryDialog] = useState(false)
    const router = useRouter()

    // No mock data - stats will be calculated from real tasks when we fetch them
    // For now, just show category count
    const stats = {
        total: 0, // Will be calculated from actual tasks
        completed: 0, // Will be calculated from actual tasks
        overdue: 0, // Will be calculated from actual tasks
    }

    const handleCreateCategory = async (
        name: string,
        icon: string,
        description?: string,
        color?: string,
        gradient?: string
    ) => {
        await addCategory(name, icon, description, color, gradient)
        setShowCategoryDialog(false)
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 18) return "Good afternoon"
        return "Good evening"
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your workspace...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
                {/* Header */}
                <header className="mb-8 animate-slide-in">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                                TaskFlow
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                {getGreeting()}, {user?.user_metadata?.name || user?.email?.split('@')[0]}! 👋
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 hidden md:flex">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                        <StatCard
                            title="Total Tasks"
                            value={stats.total}
                            icon={Grid}
                            gradient="primary"
                            className="animate-scale-in"
                        />
                        <StatCard
                            title="Completed Today"
                            value={stats.completed}
                            icon={CheckCircle2}
                            gradient="success"
                            className="animate-scale-in"
                            style={{ animationDelay: '0.1s' }}
                        />
                        <StatCard
                            title="Overdue"
                            value={stats.overdue}
                            icon={AlertCircle}
                            gradient="warning"
                            className="animate-scale-in sm:col-span-2 lg:col-span-1"
                            style={{ animationDelay: '0.2s' }}
                        />
                    </div>
                </header>

                {/* Categories Section */}
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Your Categories</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowCategoryDialog(true)}
                            className="gap-2 gradient-primary text-white border-0 hover:opacity-90 hidden md:flex"
                        >
                            <Plus className="h-4 w-4" />
                            New Category
                        </Button>
                    </div>

                    {categories.length === 0 ? (
                        <EmptyState
                            illustration="tasks"
                            title="No categories yet"
                            description="Create your first category to start organizing your tasks"
                            action={{
                                label: "Create Category",
                                onClick: () => setShowCategoryDialog(true),
                                icon: Plus,
                            }}
                            className="animate-fade-in"
                        />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category, index) => (
                                <GradientCard
                                    key={category.id}
                                    gradient={category.gradient as any || "card"}
                                    hover="lift"
                                    className="p-6 cursor-pointer animate-slide-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                    onClick={() => router.push(`/tasks/category/${category.id}`)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-4xl">{category.icon}</div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-foreground mb-1">
                                                {category.name}
                                            </h3>
                                            {category.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </GradientCard>
                            ))}
                        </div>
                    )}
                </div>

                {/* Floating Action Button (Mobile) */}
                <FloatingActionButton
                    icon={Plus}
                    onClick={() => setShowCategoryDialog(true)}
                    position="bottom-right"
                    gradient="primary"
                    label="Add"
                    className="md:hidden mb-20"
                />

                {/* Bottom Navigation (Mobile) */}
                <BottomNav
                    items={[
                        { icon: Grid, label: 'Home', href: '/tasks' },
                        { icon: CheckCircle2, label: 'Tasks', href: '/tasks/all' },
                        { icon: Calendar, label: 'Calendar', href: '/tasks/calendar' },
                        { icon: User, label: 'Profile', href: '/tasks/profile' },
                    ]}
                />

                {/* Create Category Dialog */}
                <CreateCategoryDialog
                    open={showCategoryDialog}
                    onOpenChange={setShowCategoryDialog}
                    onCreate={handleCreateCategory}
                />
            </div>
        </div>
    )
}

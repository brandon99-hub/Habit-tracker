"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DataManagementCardProps {
    userId: string
}

export function DataManagementCard({ userId }: DataManagementCardProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [showClearDialog, setShowClearDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleClearCompleted = async () => {
        setClearing(true)
        try {
            // Get all completed tasks
            const { data: completedTasks, error: fetchError } = await supabase
                .from('task_property_values')
                .select('page_id, task_properties!inner(name)')
                .eq('task_properties.name', 'Status')
                .eq('value', 'Completed')

            if (fetchError) throw fetchError

            if (!completedTasks || completedTasks.length === 0) {
                toast({
                    title: "No completed tasks",
                    description: "There are no completed tasks to clear"
                })
                setShowClearDialog(false)
                setClearing(false)
                return
            }

            const taskIds = completedTasks.map(t => t.page_id)

            // Delete the tasks
            const { error: deleteError } = await supabase
                .from('task_pages')
                .delete()
                .in('id', taskIds)

            if (deleteError) throw deleteError

            toast({
                title: "Success",
                description: `Cleared ${taskIds.length} completed task${taskIds.length === 1 ? '' : 's'}`
            })

            setShowClearDialog(false)
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to clear completed tasks",
                variant: "destructive"
            })
        } finally {
            setClearing(false)
        }
    }

    const handleDeleteAccount = async () => {
        setDeleting(true)
        try {
            // Delete user's tasks
            await supabase.from('task_pages').delete().eq('user_id', userId)

            // Delete user's categories
            await supabase.from('task_categories').delete().eq('user_id', userId)

            // Delete user's subscriptions
            await supabase.from('user_push_subscriptions').delete().eq('user_id', userId)

            // Delete user account
            const { error } = await supabase.rpc('delete_user')

            if (error) throw error

            toast({
                title: "Account deleted",
                description: "Your account has been permanently deleted"
            })

            // Sign out and redirect
            await supabase.auth.signOut()
            router.push('/auth/signin')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete account",
                variant: "destructive"
            })
            setDeleting(false)
        }
    }

    return (
        <>
            <Card className="p-6 mb-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management
                </h2>
                <div className="space-y-3">
                    {/* Clear Completed Tasks */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                        <Trash2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">Clear Completed Tasks</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Permanently delete all tasks marked as completed
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowClearDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                        >
                            Clear
                        </Button>
                    </div>

                    {/* Delete Account */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-destructive">Delete Account</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowDeleteDialog(true)}
                            variant="destructive"
                            size="sm"
                            className="flex-shrink-0"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Clear Completed Confirmation */}
            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear completed tasks?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all tasks marked as completed. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearCompleted}
                            disabled={clearing}
                            className="bg-orange-500 hover:bg-orange-600"
                        >
                            {clearing ? "Clearing..." : "Clear Completed"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account First Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your account, all your tasks, categories, and settings. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowDeleteDialog(false)
                                setShowDeleteConfirm(true)
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account Final Confirmation */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This is your final warning. Once you delete your account, there is no going back. All your data will be permanently erased.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Yes, Delete My Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

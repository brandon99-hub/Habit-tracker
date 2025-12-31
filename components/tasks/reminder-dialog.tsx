"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Trash2 } from "lucide-react"
import { createReminder, getReminders, updateReminder, deleteReminder, type Reminder } from "@/lib/tasks/reminder-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    taskId: string
    dueDate: string | null
}

const REMINDER_OPTIONS = [
    { value: 5, label: "5 minutes before" },
    { value: 15, label: "15 minutes before" },
    { value: 20, label: "20 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 1440, label: "1 day before" },
]

export function ReminderDialog({ open, onOpenChange, taskId, dueDate }: Props) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [selectedMinutes, setSelectedMinutes] = useState(20)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && taskId) {
            fetchReminders()
        }
    }, [open, taskId])

    const fetchReminders = async () => {
        const { data } = await getReminders(taskId)
        if (data) {
            setReminders(data)
        }
    }

    const handleAddReminder = async () => {
        if (!user || !dueDate) {
            toast({
                title: "Error",
                description: "Please set a due date first",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        const { error } = await createReminder(taskId, user.id, dueDate, selectedMinutes)

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Reminder created",
            })
            fetchReminders()
        }

        setLoading(false)
    }

    const handleUpdateReminder = async (reminderId: string, newMinutes: number) => {
        if (!dueDate) return

        const { error } = await updateReminder(reminderId, newMinutes, dueDate)

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Reminder updated",
            })
            fetchReminders()
        }
    }

    const handleDeleteReminder = async (reminderId: string) => {
        const { error } = await deleteReminder(reminderId)

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Reminder deleted",
            })
            fetchReminders()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Reminders
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {!dueDate && (
                        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                            Set a due date to create reminders
                        </div>
                    )}

                    {/* Existing Reminders */}
                    {reminders.length > 0 && (
                        <div className="space-y-2">
                            <Label>Active Reminders</Label>
                            {reminders.map((reminder) => (
                                <div key={reminder.id} className="flex items-center gap-2 rounded-md border p-2">
                                    <Select
                                        value={reminder.minutes_before.toString()}
                                        onValueChange={(value) => handleUpdateReminder(reminder.id, parseInt(value))}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {REMINDER_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value.toString()}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteReminder(reminder.id)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Reminder */}
                    {dueDate && (
                        <div className="space-y-2">
                            <Label>Add Reminder</Label>
                            <div className="flex gap-2">
                                <Select value={selectedMinutes.toString()} onValueChange={(v) => setSelectedMinutes(parseInt(v))}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REMINDER_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value.toString()}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddReminder} disabled={loading}>
                                    Add
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

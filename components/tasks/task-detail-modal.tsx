"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Paperclip, MessageSquare, History } from "lucide-react"
import type { Page } from "@/lib/tasks/supabase-categories"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    task: Page | null
    onUpdate: (id: string, updates: Partial<Page>) => Promise<any>
}

export function TaskDetailModal({ open, onOpenChange, task, onUpdate }: Props) {
    const [title, setTitle] = useState(task?.title || "")
    const [description, setDescription] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    if (!task) return null

    const handleSave = async () => {
        setIsSaving(true)
        await onUpdate(task.id, {
            title,
            description,
        })
        setIsSaving(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="sr-only">Task Details</DialogTitle>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
                                placeholder="Task title"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="details" className="mt-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="comments">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Comments
                        </TabsTrigger>
                        <TabsTrigger value="attachments">
                            <Paperclip className="h-4 w-4 mr-2" />
                            Attachments
                        </TabsTrigger>
                        <TabsTrigger value="activity">
                            <History className="h-4 w-4 mr-2" />
                            Activity
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                rows={10}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-4">
                        <div className="text-center text-muted-foreground py-8">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No comments yet</p>
                            <p className="text-sm">Add a comment to start the conversation</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="attachments" className="space-y-4">
                        <div className="text-center text-muted-foreground py-8">
                            <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No attachments</p>
                            <p className="text-sm">Upload files to attach them to this task</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4">
                        <div className="text-center text-muted-foreground py-8">
                            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No activity yet</p>
                            <p className="text-sm">Activity will appear here as you work on this task</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

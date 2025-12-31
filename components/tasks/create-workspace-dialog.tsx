"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (name: string, icon: string) => void
}

const iconOptions = ["🏢", "💼", "🎯", "📊", "🚀", "⭐", "🔥", "💡"]

export function CreateWorkspaceDialog({ open, onOpenChange, onCreate }: Props) {
    const [name, setName] = useState("")
    const [selectedIcon, setSelectedIcon] = useState("🏢")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onCreate(name, selectedIcon)
            setName("")
            setSelectedIcon("🏢")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Workspace Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Workspace"
                            required
                        />
                    </div>

                    <div>
                        <Label>Icon</Label>
                        <div className="flex gap-2 mt-2">
                            {iconOptions.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`text-2xl p-2 rounded border ${selectedIcon === icon ? "border-primary bg-primary/10" : "border-border"
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

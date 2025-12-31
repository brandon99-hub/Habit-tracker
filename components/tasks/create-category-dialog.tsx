"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreateCategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (name: string, icon: string, description?: string, color?: string, gradient?: string) => void
}

const EMOJI_OPTIONS = ["📋", "💼", "🎯", "📝", "✅", "🚀", "💡", "📊", "🎨", "🔥", "⭐", "🌟", "💪", "🎓", "🏆"]

const GRADIENT_OPTIONS = [
    { name: "Purple & Pink", value: "primary", class: "gradient-primary" },
    { name: "Green & Blue", value: "success", class: "gradient-success" },
    { name: "Orange & Red", value: "warning", class: "gradient-warning" },
    { name: "Blue & Purple", value: "info", class: "gradient-info" },
]

const COLOR_OPTIONS = [
    { name: "Purple", value: "purple" },
    { name: "Pink", value: "pink" },
    { name: "Blue", value: "blue" },
    { name: "Green", value: "green" },
    { name: "Orange", value: "orange" },
    { name: "Red", value: "red" },
]

export function CreateCategoryDialog({ open, onOpenChange, onCreate }: CreateCategoryDialogProps) {
    const [name, setName] = useState("")
    const [icon, setIcon] = useState("📋")
    const [description, setDescription] = useState("")
    const [selectedGradient, setSelectedGradient] = useState("primary")
    const [selectedColor, setSelectedColor] = useState("purple")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onCreate(name, icon, description || undefined, selectedColor, selectedGradient)
            // Reset form
            setName("")
            setIcon("📋")
            setDescription("")
            setSelectedGradient("primary")
            setSelectedColor("purple")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl gradient-text">Create New Category</DialogTitle>
                    <DialogDescription>
                        Organize your tasks into categories. Choose an icon and color theme.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pb-4">
                    {/* Icon Selection */}
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="grid grid-cols-8 gap-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setIcon(emoji)}
                                    className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${icon === emoji
                                        ? "border-primary bg-primary/10 scale-110"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Category Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Work, Personal, Projects"
                            required
                            className="text-base"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What kind of tasks will you organize here?"
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Gradient Selection */}
                    <div className="space-y-2">
                        <Label>Color Theme</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {GRADIENT_OPTIONS.map((gradient) => (
                                <button
                                    key={gradient.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedGradient(gradient.value)
                                        setSelectedColor(gradient.value === "primary" ? "purple" :
                                            gradient.value === "success" ? "green" :
                                                gradient.value === "warning" ? "orange" : "blue")
                                    }}
                                    className={`p-4 rounded-lg border-2 transition-all ${selectedGradient === gradient.value
                                        ? "border-primary scale-105"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className={`h-8 rounded ${gradient.class} mb-2`} />
                                    <p className="text-sm font-medium">{gradient.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="gradient-primary text-white border-0 hover:opacity-90"
                            disabled={!name.trim()}
                        >
                            Create Category
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

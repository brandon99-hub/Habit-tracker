"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type HabitNoteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (note: string) => void
}

const QUICK_NOTES = ["Felt great", "Struggled but did it", "Almost skipped", "Easy today", "Pushed through fatigue"]

export function HabitNoteDialog({ open, onOpenChange, onSubmit }: HabitNoteDialogProps) {
  const [note, setNote] = useState("")

  const handleSubmit = () => {
    onSubmit(note)
    setNote("")
  }

  const handleQuickNote = (quickNote: string) => {
    setNote(quickNote)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Note (Optional)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Quick notes:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_NOTES.map((quickNote) => (
                <button
                  key={quickNote}
                  type="button"
                  onClick={() => handleQuickNote(quickNote)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    note === quickNote
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  {quickNote}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Or write your own note..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onSubmit("")
                setNote("")
              }}
              className="flex-1"
            >
              Skip
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Complete with Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Plus } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

type Reflection = {
  id: string
  date: string
  content: string
}

type WeeklyReflectionProps = {
  reflections: Reflection[]
  onAddReflection: (content: string) => void
}

const REFLECTION_PROMPTS = [
  "What patterns did you notice this week?",
  "Which habits felt easiest? Which felt hardest?",
  "What got in the way of your consistency?",
  "What did you learn about yourself this week?",
  "How did you feel on days you completed your habits vs days you didn't?",
]

export function WeeklyReflection({ reflections, onAddReflection }: WeeklyReflectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reflectionContent, setReflectionContent] = useState("")
  const [showAllReflections, setShowAllReflections] = useState(false)

  const randomPrompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]

  const handleSubmit = () => {
    if (reflectionContent.trim()) {
      onAddReflection(reflectionContent)
      setReflectionContent("")
      setIsDialogOpen(false)
    }
  }

  const lastReflection = reflections[0]
  const daysSinceLastReflection = lastReflection
    ? Math.floor((Date.now() - new Date(lastReflection.date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const shouldPromptReflection = daysSinceLastReflection === null || daysSinceLastReflection >= 7

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Reflections</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Add Reflection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Weekly Reflection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm text-muted-foreground">{randomPrompt}</p>
                <Textarea
                  value={reflectionContent}
                  onChange={(e) => setReflectionContent(e.target.value)}
                  placeholder="Write your thoughts here..."
                  className="min-h-[120px]"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Save Reflection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {shouldPromptReflection && (
        <Card className="mb-4 border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Time to reflect</h3>
              <p className="mt-1 text-sm text-muted-foreground">{randomPrompt}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="shrink-0 border-blue-500/20"
            >
              Reflect
            </Button>
          </div>
        </Card>
      )}

      {reflections.length > 0 ? (
        <>
          <div className="space-y-3">
            {(showAllReflections ? reflections : reflections.slice(0, 3)).map((reflection) => (
              <Card key={reflection.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reflection.date), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(reflection.date), "MMM d, yyyy")}</p>
                </div>
                <p className="text-sm leading-relaxed text-foreground">{reflection.content}</p>
              </Card>
            ))}
          </div>

          {reflections.length > 3 && (
            <div className="mt-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAllReflections(!showAllReflections)}>
                {showAllReflections ? "Show Less" : `Show ${reflections.length - 3} More`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No reflections yet. Start reflecting on your patterns.</p>
        </Card>
      )}
    </section>
  )
}

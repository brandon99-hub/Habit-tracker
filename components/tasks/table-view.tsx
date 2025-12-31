"use client"

import { Card } from "@/components/ui/card"
import { TaskRow } from "@/components/tasks/task-row"
import type { Page, Property } from "@/lib/tasks/supabase-categories"

type Props = {
    tasks: Page[]
    properties: Property[]
    onEditTask: (id: string, updates: Partial<Page>) => Promise<any>
    onDeleteTask: (id: string) => Promise<any>
    onUpdateProperty: (pageId: string, propertyId: string, value: any) => Promise<any>
}

export function TableView({ tasks, properties, onEditTask, onDeleteTask, onUpdateProperty }: Props) {
    if (tasks.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No tasks yet. Add your first task to get started!</p>
            </Card>
        )
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => (
                <TaskRow
                    key={task.id}
                    task={task}
                    properties={properties}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onUpdateProperty={onUpdateProperty}
                />
            ))}
        </div>
    )
}

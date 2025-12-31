"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export type SortOption = {
    field: "dueDate" | "priority" | "status" | "title" | "created"
    direction: "asc" | "desc"
}

type Props = {
    sort: SortOption
    onSortChange: (sort: SortOption) => void
}

export function TaskSort({ sort, onSortChange }: Props) {
    const toggleDirection = () => {
        onSortChange({
            ...sort,
            direction: sort.direction === "asc" ? "desc" : "asc",
        })
    }

    return (
        <div className="flex items-center gap-2">
            <Select
                value={sort.field}
                onValueChange={(field: any) => onSortChange({ ...sort, field })}
            >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="created">Created Date</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={toggleDirection} className="h-8 w-8 p-0">
                {sort.direction === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                ) : (
                    <ArrowDown className="h-4 w-4" />
                )}
            </Button>
        </div>
    )
}

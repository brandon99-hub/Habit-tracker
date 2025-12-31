import { Metadata } from "next"
import { TasksAuthGuard } from "@/components/tasks/auth-guard"

export const metadata: Metadata = {
    title: "TaskFlow",
    description: "Manage your tasks effectively",
    manifest: "/manifest-tasks.json",
    appleWebApp: {
        capable: true,
        title: "TaskFlow",
        statusBarStyle: "black-translucent",
    },
}

export default function TasksLayout({ children }: { children: React.ReactNode }) {
    return <TasksAuthGuard>{children}</TasksAuthGuard>
}



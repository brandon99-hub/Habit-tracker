import { Metadata } from "next"
import { TasksAuthGuard } from "@/components/tasks/auth-guard"
import { ServiceWorkerRegistration } from "@/components/tasks/service-worker-registration"

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
    return (
        <TasksAuthGuard>
            <ServiceWorkerRegistration />
            {children}
        </TasksAuthGuard>
    )
}



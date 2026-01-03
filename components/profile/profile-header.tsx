"use client"

import { Card } from "@/components/ui/card"
import { User as UserIcon } from "lucide-react"
import { format } from "date-fns"

interface ProfileHeaderProps {
    userName: string
    userEmail: string
    createdAt: string
}

export function ProfileHeader({ userName, userEmail, createdAt }: ProfileHeaderProps) {
    // Get initials from name or email
    const getInitials = () => {
        if (userName && userName.trim()) {
            const names = userName.trim().split(' ')
            if (names.length >= 2) {
                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            }
            return userName.substring(0, 2).toUpperCase()
        }
        return userEmail.substring(0, 2).toUpperCase()
    }

    const formatMemberSince = () => {
        try {
            return format(new Date(createdAt), 'MMMM yyyy')
        } catch {
            return 'Recently'
        }
    }

    return (
        <Card className="p-8 mb-6 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
            <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-background">
                        {getInitials()}
                    </div>
                </div>

                {/* User Info */}
                <h2 className="text-2xl font-bold text-foreground mb-1">
                    {userName || userEmail}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    Member since {formatMemberSince()}
                </p>
            </div>
        </Card>
    )
}

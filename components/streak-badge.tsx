import { Badge } from "@/components/ui/badge"

export function getStreakBadge(streak: number) {
    if (streak >= 100) {
        return (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none shadow-sm">
                👑 {streak}
            </Badge>
        )
    }
    if (streak >= 30) {
        return (
            <Badge className="bg-gradient-to-r from-blue-400 to-purple-500 text-white border-none shadow-sm">
                🌟 {streak}
            </Badge>
        )
    }
    if (streak >= 14) {
        return (
            <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white border-none shadow-sm">
                💪 {streak}
            </Badge>
        )
    }
    if (streak >= 7) {
        return (
            <Badge className="bg-gradient-to-r from-yellow-300 to-orange-400 text-white border-none shadow-sm">
                ⚡ {streak}
            </Badge>
        )
    }
    if (streak >= 3) {
        return (
            <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white border-none shadow-sm">
                🔥 {streak}
            </Badge>
        )
    }
    return null
}

// Streak calculation service
export function calculateStreak(history: { date: string; completed: boolean }[]): {
    current: number
    longest: number
    paused: number
} {
    if (history.length === 0) return { current: 0, longest: 0, paused: 0 }

    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let pausedDays = 0
    let gracePeriodUsed = false

    for (let i = 0; i < sortedHistory.length; i++) {
        if (sortedHistory[i].completed) {
            tempStreak++
            if (i === 0) currentStreak = tempStreak
            longestStreak = Math.max(longestStreak, tempStreak)
            gracePeriodUsed = false
        } else {
            if (!gracePeriodUsed && i === 0) {
                pausedDays++
                gracePeriodUsed = true
            } else {
                tempStreak = 0
                currentStreak = 0
            }
        }
    }

    return { current: currentStreak, longest: longestStreak, paused: pausedDays }
}

// Consistency calculation
export function calculateConsistency(history: { date: string; completed: boolean }[], days: number): number {
    if (history.length === 0) return 0
    const recentHistory = history.slice(0, days)
    const completed = recentHistory.filter((h) => h.completed).length
    return Math.round((completed / Math.min(days, recentHistory.length)) * 100)
}

// Recovery rate calculation
export function calculateRecoveryRate(history: { date: string; completed: boolean }[]): string | null {
    const missedIndices: number[] = []
    history.forEach((h, i) => {
        if (!h.completed) missedIndices.push(i)
    })

    if (missedIndices.length < 2) return null

    const recoveryTimes = []
    for (let i = 1; i < missedIndices.length; i++) {
        recoveryTimes.push(missedIndices[i] - missedIndices[i - 1])
    }

    if (recoveryTimes.length === 0) return null
    const avgRecovery = Math.round(recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length)
    return `${avgRecovery} days`
}

// Check if habit is scheduled for today
export function isScheduledToday(scheduledDays?: number[]): boolean {
    if (!scheduledDays || scheduledDays.length === 0) return true
    const today = new Date().getDay()
    return scheduledDays.includes(today)
}

// Format date to ISO string (YYYY-MM-DD)
export function formatDateToISO(date: Date = new Date()): string {
    return date.toISOString().split('T')[0]
}

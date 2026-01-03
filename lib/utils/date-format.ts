import { format as dateFnsFormat } from 'date-fns'
import type { UserPreferences } from '@/lib/profile/preferences'

export function formatDate(date: Date | string, formatType: UserPreferences['dateFormat']): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    switch (formatType) {
        case 'MM/DD/YYYY':
            return dateFnsFormat(dateObj, 'MM/dd/yyyy')
        case 'DD/MM/YYYY':
            return dateFnsFormat(dateObj, 'dd/MM/yyyy')
        case 'YYYY-MM-DD':
            return dateFnsFormat(dateObj, 'yyyy-MM-dd')
        default:
            return dateFnsFormat(dateObj, 'MM/dd/yyyy')
    }
}

export function formatTime(date: Date | string, formatType: UserPreferences['timeFormat']): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return formatType === '12h'
        ? dateFnsFormat(dateObj, 'h:mm a')
        : dateFnsFormat(dateObj, 'HH:mm')
}

export function formatDateTime(date: Date | string, dateFormat: UserPreferences['dateFormat'], timeFormat: UserPreferences['timeFormat']): string {
    return `${formatDate(date, dateFormat)} ${formatTime(date, timeFormat)}`
}

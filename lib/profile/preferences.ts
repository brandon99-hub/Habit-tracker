export interface UserPreferences {
    defaultStatus: string
    defaultPriority: string
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    timeFormat: '12h' | '24h'
    weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    defaultStatus: 'Not Started',
    defaultPriority: 'Medium',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStartsOn: 0
}

export const STATUS_OPTIONS = [
    'Not Started',
    'In Progress',
    'Completed'
]

export const PRIORITY_OPTIONS = [
    'Low',
    'Medium',
    'High',
    'Urgent'
]

export const DATE_FORMAT_OPTIONS = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' }
] as const

export const TIME_FORMAT_OPTIONS = [
    { value: '12h', label: '12-hour (3:00 PM)' },
    { value: '24h', label: '24-hour (15:00)' }
] as const

export const WEEK_START_OPTIONS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' }
] as const

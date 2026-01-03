import { useCache } from "@/lib/cache-context"

/**
 * Helper function to invalidate all task-related caches
 * Call this after any task create/update/delete operation
 */
export function useInvalidateTaskCaches() {
    const cache = useCache()

    const invalidateAll = (categoryId?: string) => {
        // Core caches
        cache.invalidate('all-tasks-data')
        cache.invalidate('home-stats')
        cache.invalidate('calendar-data')

        // Category-specific caches
        if (categoryId) {
            cache.invalidate(`category-${categoryId}-data`)
            cache.invalidate(`category-${categoryId}-tasks`)
        } else {
            // Invalidate ALL category caches
            // Get all keys from localStorage
            if (typeof window !== 'undefined') {
                const cacheData = localStorage.getItem('task-cache')
                if (cacheData) {
                    try {
                        const parsed = JSON.parse(cacheData)
                        Object.keys(parsed).forEach(key => {
                            if (key.startsWith('category-')) {
                                cache.invalidate(key)
                            }
                        })
                    } catch (e) {
                        console.error('Error parsing cache:', e)
                    }
                }
            }
        }
    }

    return { invalidateAll }
}

// Offline storage using IndexedDB
const DB_NAME = "TaskManagerDB"
const DB_VERSION = 1
const TASKS_STORE = "tasks"
const SYNC_QUEUE_STORE = "syncQueue"

let db: IDBDatabase | null = null

// Initialize IndexedDB
export async function initOfflineDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
            db = request.result
            resolve()
        }

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result

            // Tasks store
            if (!database.objectStoreNames.contains(TASKS_STORE)) {
                database.createObjectStore(TASKS_STORE, { keyPath: "id" })
            }

            // Sync queue store
            if (!database.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
                const syncStore = database.createObjectStore(SYNC_QUEUE_STORE, { autoIncrement: true })
                syncStore.createIndex("timestamp", "timestamp", { unique: false })
            }
        }
    })
}

// Save tasks to offline storage
export async function saveTasksOffline(tasks: any[]): Promise<void> {
    if (!db) await initOfflineDB()

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction([TASKS_STORE], "readwrite")
        const store = transaction.objectStore(TASKS_STORE)

        // Clear existing tasks
        store.clear()

        // Add new tasks
        tasks.forEach((task) => store.add(task))

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
    })
}

// Get tasks from offline storage
export async function getTasksOffline(): Promise<any[]> {
    if (!db) await initOfflineDB()

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction([TASKS_STORE], "readonly")
        const store = transaction.objectStore(TASKS_STORE)
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

// Queue an action for sync when online
export async function queueSyncAction(action: {
    type: "create" | "update" | "delete"
    table: string
    data: any
}): Promise<void> {
    if (!db) await initOfflineDB()

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction([SYNC_QUEUE_STORE], "readwrite")
        const store = transaction.objectStore(SYNC_QUEUE_STORE)

        store.add({
            ...action,
            timestamp: Date.now(),
        })

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
    })
}

// Get all queued sync actions
export async function getSyncQueue(): Promise<any[]> {
    if (!db) await initOfflineDB()

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction([SYNC_QUEUE_STORE], "readonly")
        const store = transaction.objectStore(SYNC_QUEUE_STORE)
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

// Clear sync queue after successful sync
export async function clearSyncQueue(): Promise<void> {
    if (!db) await initOfflineDB()

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction([SYNC_QUEUE_STORE], "readwrite")
        const store = transaction.objectStore(SYNC_QUEUE_STORE)

        store.clear()

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
    })
}

// Check if online
export function isOnline(): boolean {
    return navigator.onLine
}

// Listen for online/offline events
export function setupOfflineListeners(
    onOnline: () => void,
    onOffline: () => void
) {
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    return () => {
        window.removeEventListener("online", onOnline)
        window.removeEventListener("offline", onOffline)
    }
}

import { supabase } from "../supabase"

// Category type (renamed from Database)
export type Category = {
    id: string
    user_id: string
    name: string
    icon: string | null
    description: string | null
    color: string | null
    gradient: string | null
    created_at: string
    updated_at: string
}

export type Property = {
    id: string
    category_id: string  // renamed from database_id
    name: string
    type: "text" | "select" | "date" | "checkbox" | "number"
    config: any
    position: number
    created_at: string
}

export type Page = {
    id: string
    category_id: string  // renamed from database_id
    title: string
    icon: string | null
    content: any
    description: string | null
    created_at: string
    updated_at: string
}

export type PropertyValue = {
    id: string
    page_id: string
    property_id: string
    value: any
    created_at: string
    updated_at: string
}

// Category operations (renamed from Database operations)
export async function getCategories(userId: string) {
    const { data, error } = await supabase
        .from("task_categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    return { data, error }
}

export async function createCategory(
    userId: string,
    name: string,
    icon?: string,
    description?: string,
    color?: string,
    gradient?: string
) {
    const { data, error } = await supabase
        .from("task_categories")
        .insert({
            user_id: userId,
            name,
            icon: icon || "📋",
            description,
            color: color || "purple",
            gradient: gradient || "primary",
        })
        .select()
        .single()

    if (data && !error) {
        // Create default properties
        await createDefaultProperties(data.id)
    }

    return { data, error }
}

export async function updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase
        .from("task_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    return { data, error }
}

export async function deleteCategory(id: string) {
    const { error } = await supabase.from("task_categories").delete().eq("id", id)

    return { error }
}

// Property operations
async function createDefaultProperties(categoryId: string) {
    const defaultProperties = [
        { name: "Status", type: "select", config: { options: ["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"] }, position: 0 },
        { name: "Priority", type: "select", config: { options: ["Low", "Medium", "High", "Urgent"] }, position: 1 },
        { name: "Due Date", type: "date", config: {}, position: 2 },
    ]

    const { error } = await supabase.from("task_properties").insert(
        defaultProperties.map((prop) => ({
            category_id: categoryId,
            ...prop,
        }))
    )

    return { error }
}

export async function getProperties(categoryId: string) {
    const { data, error } = await supabase
        .from("task_properties")
        .select("*")
        .eq("category_id", categoryId)
        .order("position", { ascending: true })

    return { data, error }
}

// Page (Task) operations
export async function getPages(categoryId: string) {
    const { data, error } = await supabase
        .from("task_pages")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false })

    return { data, error }
}

export async function getPageWithProperties(pageId: string) {
    const { data: page, error: pageError } = await supabase
        .from("task_pages")
        .select("*")
        .eq("id", pageId)
        .single()

    if (pageError) return { data: null, error: pageError }

    const { data: values, error: valuesError } = await supabase
        .from("task_property_values")
        .select("*, task_properties(*)")
        .eq("page_id", pageId)

    return { data: { ...page, property_values: values }, error: valuesError }
}

export async function createPage(categoryId: string, title: string, icon?: string) {
    const { data, error } = await supabase
        .from("task_pages")
        .insert({
            category_id: categoryId,
            title,
            icon,
        })
        .select()
        .single()

    return { data, error }
}

export async function updatePage(id: string, updates: Partial<Page>) {
    const { data, error } = await supabase
        .from("task_pages")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    return { data, error }
}

export async function deletePage(id: string) {
    const { error } = await supabase.from("task_pages").delete().eq("id", id)

    return { error }
}

// Property Value operations
export async function setPropertyValue(pageId: string, propertyId: string, value: any) {
    // First, check if this is a Status property being set to "Completed"
    const { data: property } = await supabase
        .from("task_properties")
        .select("name")
        .eq("id", propertyId)
        .single()

    // If setting status to "Completed", also update completed_at timestamp
    if (property?.name === "Status" && value === "Completed") {
        await supabase
            .from("task_pages")
            .update({ completed_at: new Date().toISOString() })
            .eq("id", pageId)

        // Check if this is a recurring task and advance next_occurrence
        const { data: recurringTask } = await supabase
            .from("recurring_tasks")
            .select("*")
            .eq("page_id", pageId)
            .single()

        if (recurringTask) {
            // Calculate next occurrence based on pattern
            const { advanceToNextOccurrence } = await import("./recurring-service")
            const nextOccurrence = advanceToNextOccurrence(
                new Date(recurringTask.next_occurrence),
                recurringTask.pattern,
                recurringTask.interval || 1
            )

            // Update recurring task with new next_occurrence and last_completed_at
            await supabase
                .from("recurring_tasks")
                .update({
                    next_occurrence: nextOccurrence.toISOString(),
                    last_completed_at: new Date().toISOString()
                })
                .eq("id", recurringTask.id)
        }
    }
    // If changing from "Completed" to something else, clear completed_at
    else if (property?.name === "Status" && value !== "Completed") {
        await supabase
            .from("task_pages")
            .update({ completed_at: null })
            .eq("id", pageId)
    }

    const { data, error } = await supabase
        .from("task_property_values")
        .upsert({
            page_id: pageId,
            property_id: propertyId,
            value,
        }, {
            onConflict: 'page_id,property_id'  // Specify which columns define uniqueness
        })
        .select()
        .single()

    return { data, error }
}

export async function getPropertyValues(pageId: string) {
    const { data, error } = await supabase
        .from("task_property_values")
        .select("*, task_properties(*)")
        .eq("page_id", pageId)

    return { data, error }
}

// Backward compatibility exports (deprecated - use Category versions)
/** @deprecated Use Category type instead */
export type Database = Category
/** @deprecated Use getCategories instead */
export const getDatabases = getCategories
/** @deprecated Use createCategory instead */
export const createDatabase = createCategory
/** @deprecated Use updateCategory instead */
export const updateDatabase = updateCategory
/** @deprecated Use deleteCategory instead */
export const deleteDatabase = deleteCategory

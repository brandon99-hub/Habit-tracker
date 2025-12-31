import { supabase } from "../supabase"

// Workspace types
export type Workspace = {
    id: string
    user_id: string
    name: string
    icon: string | null
    created_at: string
    updated_at: string
}

export type Database = {
    id: string
    workspace_id: string
    name: string
    icon: string | null
    description: string | null
    created_at: string
    updated_at: string
}

export type Property = {
    id: string
    database_id: string
    name: string
    type: "text" | "select" | "date" | "checkbox" | "number"
    config: any
    position: number
    created_at: string
}

export type Page = {
    id: string
    database_id: string
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

// Workspace operations
export async function getWorkspaces(userId: string) {
    const { data, error } = await supabase
        .from("task_workspaces")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    return { data, error }
}

export async function createWorkspace(userId: string, name: string, icon?: string) {
    const { data, error } = await supabase
        .from("task_workspaces")
        .insert({
            user_id: userId,
            name,
            icon: icon || "🏢",
        })
        .select()
        .single()

    return { data, error }
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>) {
    const { data, error } = await supabase
        .from("task_workspaces")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    return { data, error }
}

export async function deleteWorkspace(id: string) {
    const { error } = await supabase.from("task_workspaces").delete().eq("id", id)

    return { error }
}

// Database operations
export async function getDatabases(workspaceId: string) {
    const { data, error } = await supabase
        .from("task_databases")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })

    return { data, error }
}

export async function createDatabase(
    workspaceId: string,
    name: string,
    icon?: string,
    description?: string
) {
    const { data, error } = await supabase
        .from("task_databases")
        .insert({
            workspace_id: workspaceId,
            name,
            icon: icon || "📋",
            description,
        })
        .select()
        .single()

    if (data && !error) {
        // Create default properties
        await createDefaultProperties(data.id)
    }

    return { data, error }
}

export async function updateDatabase(id: string, updates: Partial<Database>) {
    const { data, error } = await supabase
        .from("task_databases")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    return { data, error }
}

export async function deleteDatabase(id: string) {
    const { error } = await supabase.from("task_databases").delete().eq("id", id)

    return { error }
}

// Property operations
async function createDefaultProperties(databaseId: string) {
    const defaultProperties = [
        { name: "Status", type: "select", config: { options: ["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"] }, position: 0 },
        { name: "Priority", type: "select", config: { options: ["Low", "Medium", "High", "Urgent"] }, position: 1 },
        { name: "Due Date", type: "date", config: {}, position: 2 },
    ]

    const { error } = await supabase.from("task_properties").insert(
        defaultProperties.map((prop) => ({
            database_id: databaseId,
            ...prop,
        }))
    )

    return { error }
}

export async function getProperties(databaseId: string) {
    const { data, error } = await supabase
        .from("task_properties")
        .select("*")
        .eq("database_id", databaseId)
        .order("position", { ascending: true })

    return { data, error }
}

// Page (Task) operations
export async function getPages(databaseId: string) {
    const { data, error } = await supabase
        .from("task_pages")
        .select("*")
        .eq("database_id", databaseId)
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

export async function createPage(databaseId: string, title: string, icon?: string) {
    const { data, error } = await supabase
        .from("task_pages")
        .insert({
            database_id: databaseId,
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
    const { data, error } = await supabase
        .from("task_property_values")
        .upsert({
            page_id: pageId,
            property_id: propertyId,
            value,
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

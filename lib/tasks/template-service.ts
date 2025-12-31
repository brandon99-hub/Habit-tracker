import { supabase } from "../supabase"

export type Template = {
    id: string
    user_id: string
    name: string
    icon: string | null
    description: string | null
    properties: Record<string, any> // Pre-filled property values
    is_recurring: boolean
    recurring_config: any
    created_at: string
}

// Get all templates for a user
export async function getTemplates(userId: string) {
    const { data, error } = await supabase
        .from("task_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    return { data, error }
}

// Create a template from a task
export async function createTemplate(
    userId: string,
    name: string,
    icon: string | null,
    description: string | null,
    properties: Record<string, any>,
    isRecurring: boolean = false,
    recurringConfig: any = null
) {
    const { data, error } = await supabase
        .from("task_templates")
        .insert({
            user_id: userId,
            name,
            icon,
            description,
            properties,
            is_recurring: isRecurring,
            recurring_config: recurringConfig,
        })
        .select()
        .single()

    return { data, error }
}

// Update a template
export async function updateTemplate(
    id: string,
    updates: Partial<Template>
) {
    const { data, error } = await supabase
        .from("task_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    return { data, error }
}

// Delete a template
export async function deleteTemplate(id: string) {
    const { error } = await supabase
        .from("task_templates")
        .delete()
        .eq("id", id)

    return { error }
}

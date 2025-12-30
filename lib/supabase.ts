import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Habit = {
  id: string
  name: string
  type: 'binary' | 'numeric'
  unit?: string
  category?: string
  scheduled_days?: number[]
  scheduled_time?: string
  archived: boolean
  paused: boolean
  created_at: string
}

export type Completion = {
  id: string
  habit_id: string
  completed_at: string
  value?: number
  note?: string
}

export type Reflection = {
  id: string
  content: string
  created_at: string
}

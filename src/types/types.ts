import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient<Database> | null = null

function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a dummy client during build time - will be replaced at runtime
    if (typeof window === 'undefined') {
      return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')
    }
    throw new Error('Missing Supabase environment variables')
  }

  supabaseInstance = createClient<Database>(url, key)
  return supabaseInstance
}

// Export as getter to ensure lazy initialization
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop: keyof SupabaseClient<Database>) {
    return getSupabaseClient()[prop]
  }
})

export type Participant = Database['public']['Tables']['participants']['Row']

export type Choice = Database['public']['Tables']['choices']['Row']

export type Question = Database['public']['Tables']['questions']['Row'] & {
  choices: Choice[]
}

export type QuizSet = Database['public']['Tables']['quiz_sets']['Row'] & {
  questions: Question[]
}

export type Answer = Database['public']['Tables']['answers']['Row']

export type Game = Database['public']['Tables']['games']['Row']

export type GameResult = Database['public']['Views']['game_results']['Row']

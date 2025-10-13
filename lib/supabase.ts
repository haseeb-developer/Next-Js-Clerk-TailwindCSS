import { createClient } from '@supabase/supabase-js'

// Fallback values for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akrqdinpdwfwfuomocar.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcnFkaW5wZHdmd2Z1b21vY2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDAxMjQsImV4cCI6MjA3NTgxNjEyNH0.M0Z7EZc-YIQ09wIw9GTz6gOUn4U8yfYcL3GyoXlXtBc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Snippet {
  id: string
  title: string
  description?: string
  code: string
  language: string
  tags?: string[]
  is_public: boolean
  is_favorite: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export interface CreateSnippetData {
  title: string
  description?: string
  code: string
  language: string
  tags?: string[]
  is_public?: boolean
  is_favorite?: boolean
}

export interface UpdateSnippetData {
  title?: string
  description?: string
  code?: string
  language?: string
  tags?: string[]
  is_public?: boolean
  is_favorite?: boolean
}

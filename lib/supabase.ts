import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

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
}

export interface UpdateSnippetData {
  title?: string
  description?: string
  code?: string
  language?: string
  tags?: string[]
  is_public?: boolean
}

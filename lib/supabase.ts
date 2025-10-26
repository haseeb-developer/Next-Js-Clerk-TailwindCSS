import { createClient } from '@supabase/supabase-js'

// Fallback values for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akrqdinpdwfwfuomocar.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcnFkaW5wZHdmd2Z1b21vY2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDAxMjQsImV4cCI6MjA3NTgxNjEyNH0.M0Z7EZc-YIQ09wIw9GTz6gOUn4U8yfYcL3GyoXlXtBc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Folder {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  background: string
  icon: string
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

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
  folder_id?: string | null
  category_id?: string | null
  created_at: string
  updated_at: string
}

export interface CreateFolderData {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateFolderData {
  name?: string
  description?: string
  color?: string
  icon?: string
}

export interface CreateCategoryData {
  name: string
  description?: string
  color?: string
  background?: string
  icon?: string
  is_default?: boolean
  sort_order?: number
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  color?: string
  background?: string
  icon?: string
  sort_order?: number
}

export interface CreateSnippetData {
  title: string
  description?: string
  code: string
  language: string
  tags?: string[]
  is_public?: boolean
  is_favorite?: boolean
  folder_id?: string | null
  category_id?: string | null
}

export interface UpdateSnippetData {
  title?: string
  description?: string
  code?: string
  language?: string
  tags?: string[]
  is_public?: boolean
  is_favorite?: boolean
  folder_id?: string | null
  category_id?: string | null
}

export interface MediaFile {
  id: string
  user_id: string
  file_name: string
  file_type: 'image' | 'video'
  file_url: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  duration?: number
  description?: string
  tags?: string[]
  media_folder_id?: string | null
  category_id?: string | null
  is_favorite: boolean
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export interface MediaFolder {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string // This now stores the icon name (e.g., 'folder', 'image', 'video', etc.)
  parent_id?: string | null
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateMediaData {
  file_name: string
  file_type: 'image' | 'video'
  file_url: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  duration?: number
  description?: string
  tags?: string[]
  media_folder_id?: string | null
  category_id?: string | null
  is_favorite?: boolean
}

export interface UpdateMediaData {
  file_name?: string
  description?: string
  tags?: string[]
  media_folder_id?: string | null
  category_id?: string | null
  is_favorite?: boolean
}

export interface CreateMediaFolderData {
  name: string
  description?: string
  color?: string
  icon?: string
  parent_id?: string | null
}

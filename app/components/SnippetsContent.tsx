'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { supabase, type Snippet, type CreateSnippetData, type Folder, type CreateFolderData, type Category, type CreateCategoryData } from '../../lib/supabase'
import { Toast, ToastContainer } from './Toast'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { ComprehensiveRecycleBinModal } from './ComprehensiveRecycleBinModal'
import { ExportModal } from './ExportModal'
import { ImportModal } from './ImportModal'
import { CreateFolderModal } from './CreateFolderModal'
import { ConfirmDeleteFolderModal } from './ConfirmDeleteFolderModal'
import { AlertModal } from './AlertModal'
import { FolderCard } from './FolderCard'
import CategoryCard from './CategoryCard'
import CreateCategoryModal from './CreateCategoryModal'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useUserID } from '../hooks/useUserID'

const PROGRAMMING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SCSS', 'SQL', 'Bash', 'PowerShell', 'JSON',
  'YAML', 'XML', 'Markdown', 'Vue', 'React', 'Angular', 'Node.js', 'Express', 'Next.js',
  'Liquid', 'GraphQL', 'Dockerfile', 'Shell', 'Zsh', 'Fish', 'Vim', 'Emacs', 'Makefile'
]



export default function SnippetsContent() {
  const [isClient, setIsClient] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clerkComponents, setClerkComponents] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Load Clerk components
    import('@clerk/nextjs').then((clerk) => {
      setClerkComponents({
        useUser: clerk.useUser,
      })
    })
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading snippets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!clerkComponents) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading authentication...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <SnippetsUserContent {...clerkComponents} />
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SnippetsUserContent({ useUser }: any) {
  const { user } = useUser()
  const { userID, loading: userIDLoading } = useUserID()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
          const [searchTerm, setSearchTerm] = useState('')
          const [sortBy, setSortBy] = useState('newest')
          const [showRecentSnippets, setShowRecentSnippets] = useState(true)
          const [showAllSnippets, setShowAllSnippets] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
          const [viewingSnippet, setViewingSnippet] = useState<Snippet | null>(null)
          const [activeTabs, setActiveTabs] = useState<{ [snippetId: string]: 'code' | 'tags' | 'category' | 'info' }>({})
          
          // Lock body scroll when modals are open
          useBodyScrollLock(showCreateForm || viewingSnippet !== null)
          
          // Toast state
          const [toasts, setToasts] = useState<Toast[]>([])
          
          // Modal states
          const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
          const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null)
          const [showRecycleBin, setShowRecycleBin] = useState(false)
          
          // Copy state for toast feedback
          const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null)
          const [modalCopyClicked, setModalCopyClicked] = useState(false)
          
          // Import/Export modal states
          const [showExportModal, setShowExportModal] = useState(false)
          const [showImportModal, setShowImportModal] = useState(false)
          
  // Folder states
  const [folders, setFolders] = useState<Folder[]>([])
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showFoldersSection, setShowFoldersSection] = useState(true)
  const [folderSearchTerm, setFolderSearchTerm] = useState('')
  const [showDeleteFolder, setShowDeleteFolder] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
  const [showAlert, setShowAlert] = useState<{ open: boolean; title: string; message: string; variant?: 'error'|'info' }>({ open: false, title: '', message: '' })
  
  // Category states
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showCategoriesSection, setShowCategoriesSection] = useState(true)
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
  const [categorySnippetCounts, setCategorySnippetCounts] = useState<{ [key: string]: number }>({})
          
  // Form validation states
  const [titleError, setTitleError] = useState('')
  
  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Check if new schema is available
  const [hasNewSchema, setHasNewSchema] = useState<boolean | null>(null)

  // Validation function
  const validateForm = () => {
    setTitleError('')
    
    if (formData.title.trim().length < 5) {
      setTitleError('Title must be at least 5 characters long')
      return false
    }
    
    return true
  }

  // Keyboard shortcut handler for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Form state
  const [formData, setFormData] = useState<CreateSnippetData>({
    title: '',
    description: '',
    code: '',
    language: '',
    tags: [],
    is_public: false,
    is_favorite: false,
    folder_id: null,
    category_id: null
  })

  const fetchSnippets = useCallback(async () => {
    if (!user || !user.id) return
    
    try {
      // First try with deleted_at filter (new schema)
      const { data, error: firstError } = await supabase
        .from('snippets')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      let finalData = data

      // If error, try without deleted_at filter (old schema)
      if (firstError && (firstError.code === '42703' || firstError.code === 'PGRST204')) {
        console.log('deleted_at column not found, using old schema')
        setHasNewSchema(false)
        const { data: oldData, error: oldError } = await supabase
          .from('snippets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (oldError) throw oldError
        finalData = oldData
      } else if (firstError) {
        throw firstError
      } else {
        setHasNewSchema(true)
      }

      setSnippets(finalData || [])
    } catch (error) {
      console.error('Error fetching snippets:', error)
      // Fallback: try to fetch without any filters
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('snippets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (fallbackError) throw fallbackError
        setSnippets(fallbackData || [])
        setHasNewSchema(false) // Set to false since we had to use fallback
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError)
        setSnippets([])
        setHasNewSchema(false)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!user || !user.id) return
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
      setFolders([])
    }
  }, [user])

  const fetchCategories = useCallback(async () => {
    if (!user || !user.id) return
    
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch snippet counts for each category
      const { data: snippetCounts, error: countError } = await supabase
        .from('snippets')
        .select('category_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (countError) throw countError

      const counts: { [key: string]: number } = {}
      snippetCounts?.forEach(snippet => {
        const categoryId = snippet.category_id || 'uncategorized'
        counts[categoryId] = (counts[categoryId] || 0) + 1
      })

      setCategorySnippetCounts(counts)
      
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
      setCategorySnippetCounts({})
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSnippets()
      fetchFolders()
      fetchCategories()
    }
  }, [user, fetchSnippets, fetchFolders, fetchCategories])

  // Load accordion state from localStorage
  useEffect(() => {
    const savedRecentState = localStorage.getItem('snippets-recent-open')
    const savedAllState = localStorage.getItem('snippets-all-open')
    
    if (savedRecentState !== null) {
      setShowRecentSnippets(JSON.parse(savedRecentState))
    }
    if (savedAllState !== null) {
      setShowAllSnippets(JSON.parse(savedAllState))
    }
  }, [])

  // Save accordion state to localStorage
  useEffect(() => {
    localStorage.setItem('snippets-recent-open', JSON.stringify(showRecentSnippets))
  }, [showRecentSnippets])

  useEffect(() => {
    localStorage.setItem('snippets-all-open', JSON.stringify(showAllSnippets))
  }, [showAllSnippets])

  // Handle body overflow when modal is open
  useEffect(() => {
    if (showCreateForm || editingSnippet) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showCreateForm, editingSnippet])


  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !user.id) return

    // Validate form
    if (!validateForm()) return

    try {
      const { error } = await supabase
        .from('snippets')
        .insert([{
          ...formData,
          user_id: user.id
        }])

      if (error) throw error

      setFormData({
        title: '',
        description: '',
        code: '',
        language: '',
        tags: [],
        is_public: false,
        is_favorite: false,
        folder_id: selectedFolderId
      })
      setShowCreateForm(false)
      addToast({
        message: 'Snippet created successfully!',
        type: 'success'
      })
      fetchSnippets()
    } catch (error) {
      console.error('Error creating snippet:', error)
    }
  }

  const handleUpdateSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSnippet) return

    // Validate form
    if (!validateForm()) return

    try {
      const { error } = await supabase
        .from('snippets')
        .update(formData)
        .eq('id', editingSnippet.id)

      if (error) throw error

      setEditingSnippet(null)
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        code: '',
        language: '',
        tags: [],
        is_public: false,
        is_favorite: false,
        folder_id: selectedFolderId
      })
      addToast({
        message: 'Snippet updated successfully!',
        type: 'success'
      })
      fetchSnippets()
    } catch (error) {
      console.error('Error updating snippet:', error)
    }
  }

  // Toast functions
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Handle delete confirmation
  const handleDeleteClick = (snippet: Snippet) => {
    setSnippetToDelete(snippet)
    setShowDeleteConfirm(true)
  }

  // Soft delete (move to recycle bin)
  const handleDeleteSnippet = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/snippets/${id}/soft-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to delete snippet')
      }

      addToast({
        message: 'Snippet moved to recycle bin',
        type: 'success'
      })
      
      fetchSnippets()
    } catch (error) {
      console.error('Error deleting snippet:', error)
      addToast({
        message: 'Failed to delete snippet',
        type: 'error'
      })
    }
  }, [fetchSnippets, addToast])

  // Permanent delete (from recycle bin)
  const handlePermanentDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', id)

      if (error) throw error

      addToast({
        message: 'Snippet permanently deleted',
        type: 'success'
      })
    } catch (error) {
      console.error('Error permanently deleting snippet:', error)
      addToast({
        message: 'Failed to permanently delete snippet',
        type: 'error'
      })
    }
  }, [addToast])

  // Restore from recycle bin
  const handleRestoreSnippet = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('snippets')
        .update({ deleted_at: null })
        .eq('id', id)

      if (error) throw error

      addToast({
        message: 'Snippet restored successfully',
        type: 'success'
      })
      
      // Refresh snippets list
      fetchSnippets()
    } catch (error) {
      console.error('Error restoring snippet:', error)
      addToast({
        message: 'Failed to restore snippet',
        type: 'error'
      })
    }
  }, [fetchSnippets, addToast])

  // Handle copy with toast feedback
  const handleCopySnippet = useCallback(async (code: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedSnippetId(snippetId)
      addToast({
        message: 'COPIED',
        type: 'success'
      })
      
      // Reset copy state after 2 seconds
      setTimeout(() => setCopiedSnippetId(null), 2000)
    } catch {
      addToast({
        message: 'Failed to copy code',
        type: 'error'
      })
    }
  }, [addToast])

  // Handle importing snippets
  const handleImportSnippets = useCallback(async (snippets: Omit<Snippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    if (!user || !user.id) return

    try {
      const { error } = await supabase
        .from('snippets')
        .insert(snippets.map(snippet => ({
          ...snippet,
          user_id: user.id
        })))
        .select()

      if (error) throw error

      // Refresh snippets list
      await fetchSnippets()
      
      addToast({
        message: `Successfully imported ${snippets.length} snippet(s)`,
        type: 'success'
      })
    } catch {
      addToast({
        message: 'Failed to import snippets',
        type: 'error'
      })
    }
  }, [user, addToast, fetchSnippets])

  // Handle copy in modal with toast feedback
  const handleModalCopy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setModalCopyClicked(true)
      addToast({
        message: 'Snippet copied to clipboard',
        type: 'success'
      })
      
      // Reset copy state after 2 seconds
      setTimeout(() => setModalCopyClicked(false), 2000)
    } catch {
      addToast({
        message: 'Failed to copy code',
        type: 'error'
      })
    }
  }, [addToast])

  // Helper function to get active tab for a snippet
  const getActiveTab = (snippetId: string) => {
    return activeTabs[snippetId] || 'code'
  }

  // Helper function to set active tab for a snippet
  const setSnippetActiveTab = (snippetId: string, tab: 'code' | 'tags' | 'category' | 'info') => {
    setActiveTabs(prev => ({ ...prev, [snippetId]: tab }))
  }

  const toggleFavorite = useCallback(async (snippet: Snippet) => {
    if (!user || !user.id) return

    try {
      const { error } = await supabase
        .from('snippets')
        .update({ 
          is_favorite: !snippet.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', snippet.id)

      if (error) throw error

      // Update local state
      setSnippets(prev => 
        prev.map(s => 
          s.id === snippet.id 
            ? { ...s, is_favorite: !snippet.is_favorite, updated_at: new Date().toISOString() }
            : s
        )
      )

      addToast({
        message: snippet.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        type: 'success'
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      addToast({
        message: 'Failed to update favorite status',
        type: 'error'
      })
    }
  }, [user, addToast])

  const startEditing = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setFormData({
      title: snippet.title,
      description: snippet.description || '',
      code: snippet.code,
      language: snippet.language,
      tags: snippet.tags || [],
      is_public: snippet.is_public,
      is_favorite: snippet.is_favorite,
      folder_id: snippet.folder_id || null
    })
    setShowCreateForm(true)
  }

  // Folder CRUD functions
  const handleCreateFolder = async (data: CreateFolderData) => {
    if (!user || !user.id) return
    
    try {
      // Check duplicate by name for this user (case-insensitive)
      const { data: existing } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', data.name.trim())
        .limit(1)

      if (existing && existing.length > 0) {
        setShowAlert({ open: true, title: 'Duplicate Folder Name', message: 'A folder with this name already exists. Please choose a different name.', variant: 'error' })
        return
      }

      const { error } = await supabase
        .from('folders')
        .insert([{
          ...data,
          user_id: user.id
        }])

      if (error) throw error

      addToast({
        message: 'Folder created successfully!',
        type: 'success'
      })
      fetchFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
      addToast({
        message: 'Failed to create folder',
        type: 'error'
      })
    }
  }

  const handleUpdateFolder = async (data: CreateFolderData) => {
    if (!editingFolder) return
    
    try {
      const { error } = await supabase
        .from('folders')
        .update(data)
        .eq('id', editingFolder.id)

      if (error) throw error

      addToast({
        message: 'Folder updated successfully!',
        type: 'success'
      })
      setEditingFolder(null)
      fetchFolders()
    } catch (error) {
      console.error('Error updating folder:', error)
      addToast({
        message: 'Failed to update folder',
        type: 'error'
      })
    }
  }

  const handleDeleteFolder = async (folder: Folder) => {
    setFolderToDelete(folder)
    setShowDeleteFolder(true)
  }

  const confirmDeleteFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (selectedFolderId === id) {
        setSelectedFolderId(null)
      }

      addToast({
        message: 'Folder deleted successfully',
        type: 'success'
      })
      setShowDeleteFolder(false)
      setFolderToDelete(null)
      fetchFolders()
      fetchSnippets() // Refresh snippets to reflect folder changes
    } catch (error) {
      console.error('Error deleting folder:', error)
      addToast({
        message: 'Failed to delete folder',
        type: 'error'
      })
    }
  }

  // Category CRUD functions
  const handleCreateCategory = async (data: CreateCategoryData) => {
    if (!user?.id) return

    try {
      // Check for duplicate names
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', user.id)
        .ilike('name', data.name!)

      if (existingCategories && existingCategories.length > 0) {
        setShowAlert({ 
          open: true, 
          title: 'Duplicate Category', 
          message: `A category named "${data.name}" already exists. Please choose a different name.`,
          variant: 'error'
        })
        return
      }

      // Get the next sort order
      const { data: lastCategory } = await supabase
        .from('categories')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextSortOrder = lastCategory?.[0]?.sort_order ? lastCategory[0].sort_order + 1 : 0

      const { error } = await supabase
        .from('categories')
        .insert([{
          ...data,
          user_id: user.id,
          sort_order: nextSortOrder
        }])

      if (error) throw error

      addToast({
        message: 'Category created successfully',
        type: 'success'
      })
      setShowCreateCategory(false)
      fetchCategories()
      
    } catch (error) {
      console.error('Error creating category:', error)
      addToast({
        message: 'Failed to create category',
        type: 'error'
      })
    }
  }

  const handleUpdateCategory = async (data: CreateCategoryData) => {
    if (!editingCategory || !user?.id) return

    try {
      // Check for duplicate names (excluding current category)
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', user.id)
        .neq('id', editingCategory.id)
        .ilike('name', data.name!)

      if (existingCategories && existingCategories.length > 0) {
        setShowAlert({ 
          open: true, 
          title: 'Duplicate Category', 
          message: `A category named "${data.name}" already exists. Please choose a different name.`,
          variant: 'error'
        })
        return
      }

      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', editingCategory.id)
        .eq('user_id', user.id)

      if (error) throw error

      addToast({
        message: 'Category updated successfully',
        type: 'success'
      })
      setEditingCategory(null)
      fetchCategories()
      
    } catch (error) {
      console.error('Error updating category:', error)
      addToast({
        message: 'Failed to update category',
        type: 'error'
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // First, move all snippets in this category to uncategorized
      await supabase
        .from('snippets')
        .update({ category_id: null })
        .eq('category_id', categoryId)
        .eq('user_id', user.id)

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id)

      if (error) throw error

      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null)
      }

      addToast({
        message: 'Category deleted successfully',
        type: 'success'
      })
      fetchCategories()
      fetchSnippets() // Refresh snippets to reflect category changes
      
    } catch (error) {
      console.error('Error deleting category:', error)
      addToast({
        message: 'Failed to delete category',
        type: 'error'
      })
    }
  }


  const getCategoryInfo = (categoryId: string | null) => {
    if (!categoryId) return null
    const category = categories.find(cat => cat.id === categoryId)
    return category ? { name: category.name, color: category.color, icon: category.icon } : null
  }

  const renderCategoryIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.JSX.Element } = {
      'web': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
        </svg>
      ),
      'mobile': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      ),
      'backend': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
        </svg>
      ),
      'database': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
        </svg>
      ),
      'ai': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      ),
      'design': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
        </svg>
      ),
      'devops': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>
      ),
      'game': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      'other': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      )
    }
    return iconMap[iconName] || iconMap['other']
  }

  // Get recent snippets (4 most recent), respecting folder and category context
          const recentSnippets = [...snippets]
            .filter(s => {
              const folderMatch = selectedFolderId ? s.folder_id === selectedFolderId : s.folder_id == null
              const categoryMatch = selectedCategoryId ? s.category_id === selectedCategoryId : true
              return folderMatch && categoryMatch
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 4)

          // Filter folders by search term
          const filteredFolders = folders.filter(folder => 
            folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase()) ||
            folder.description?.toLowerCase().includes(folderSearchTerm.toLowerCase())
          )

          // Filter categories by search term
          const filteredCategories = categories.filter(category => 
            category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
            category.description?.toLowerCase().includes(categorySearchTerm.toLowerCase())
          )

          // Limit language options to the current Snippets context (e.g., not in folders)
          const scopeSnippets = snippets.filter(s => {
            const folderMatch = selectedFolderId ? s.folder_id === selectedFolderId : s.folder_id == null
            const categoryMatch = selectedCategoryId ? s.category_id === selectedCategoryId : true
            return folderMatch && categoryMatch
          })

          // Get unique languages from scoped snippets with counts
          const languageCounts = scopeSnippets.reduce((acc, snippet) => {
            const lang = snippet.language || 'other'
            acc[lang] = (acc[lang] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          // Filter and sort all snippets
         const filteredSnippets = snippets.filter(snippet => {
            const matchesSearch = snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 snippet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 snippet.code.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesLanguage = !selectedLanguage || snippet.language === selectedLanguage
            const matchesFavorites = !showFavoritesOnly || snippet.is_favorite
            const matchesFolder = selectedFolderId ? (snippet.folder_id === selectedFolderId) : (snippet.folder_id == null)
            const matchesCategory = selectedCategoryId ? (snippet.category_id === selectedCategoryId) : true
            const matchesVisibility = visibilityFilter === 'all' || (visibilityFilter === 'public' && snippet.is_public) || (visibilityFilter === 'private' && !snippet.is_public)
            return matchesSearch && matchesLanguage && matchesFavorites && matchesFolder && matchesCategory && matchesVisibility
          }).sort((a, b) => {
            switch (sortBy) {
              case 'newest':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              case 'oldest':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              case 'name-az':
                return a.title.localeCompare(b.title)
              case 'name-za':
                return b.title.localeCompare(a.title)
              default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
          })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading your snippets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no user, show sign-in required message
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-5rem)] py-12">
        <div className="max-w-[1800px] mx-auto">
          <div className="mb-8 mx-5">
            <div className="bg-[#111B32] border border-gray-700 rounded-3xl p-8 shadow-2xl">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
                <p className="text-gray-400 mb-6">Please sign in to access your snippets.</p>
                      <div className="flex gap-4 justify-center">
                        <Link 
                          href="/sign-in" 
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link 
                          href="/choose-username" 
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Continue as Guest
                        </Link>
                      </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

          return (
            <div className="min-h-[calc(100vh-5rem)] py-12">
              <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8 mx-5">
          <div className="bg-[#111B32] border border-gray-700 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-montserrat">
                  Code Snippets
                </h1>
                <p className="text-gray-300 text-lg font-poppins">
                  Save, organize, and manage your code snippets
                </p>
                <div className="mt-3">
                  <a
                    href={userID?.user_id_number ? `/${userID.user_id_number}/public-snippets` : "/public-snippets"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {userIDLoading ? 'Loading...' : 'Browse My Public Snippets'}
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                {/* Import Button */}
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Import
                </button>
                
                {/* Export Button */}
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Export
                </button>
                
                {hasNewSchema === true && (
                  <button
                    onClick={() => setShowRecycleBin(true)}
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Recycle Bin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Folders Section */}
        {/* <div className="mb-8 mx-5">
            <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
              <div
                role="button"
                onClick={() => setShowFoldersSection(!showFoldersSection)}
                className="w-full p-6 text-left border-b border-gray-600/30 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">My Folders</h2>
                    <p className="text-gray-400">Organize your snippets into folders</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedFolderId && (
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFolderId(null)
                      }}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium cursor-pointer"
                    >
                      Clear Selected
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreateFolder(true)
                      setEditingFolder(null)
                    }}
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                    New Folder
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowFoldersSection(!showFoldersSection) }}
                    className="p-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/70 rounded-lg transition-all duration-300 cursor-pointer"
                    aria-label="Toggle folders"
                  >
                    <svg className={`w-5 h-5 text-gray-400 hover:text-white transition-all duration-200 ${showFoldersSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className={`transition-all duration-300 overflow-hidden ${showFoldersSection ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6">
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search folders..."
                        value={folderSearchTerm}
                        onChange={(e) => setFolderSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-12 pr-4 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400/50 shadow-sm transition-all duration-200"
                      />
                      <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {folderSearchTerm && (
                        <button
                          onClick={() => setFolderSearchTerm('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-white transition-colors duration-200"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div
                      onClick={() => setSelectedFolderId(null)}
                      className="group relative rounded-2xl p-4 border-2 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-xl"
                      style={{
                        backgroundColor: '#3B82F608',
                        borderColor: selectedFolderId === null ? '#3B82F6' : '#374151'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                            style={{ backgroundColor: '#3B82F6' }}
                          >
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold leading-5 line-clamp-2 break-words text-white">
                              All Snippets
                            </h3>
                          </div>
                        </div>

                        {selectedFolderId === null && (
                          <div className="absolute top-[-5px] right-[0px] flex items-center gap-1.5 text-xs font-medium" style={{ color: '#3B82F6' }}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                            <span>Selected</span>
                          </div>
                        )}

                        <div className="mb-4 flex-1">
                          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 break-words">
                            View all your snippets across all folders
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                              style={{ backgroundColor: '#3B82F6' }}
                            >
                              <span className="text-white text-sm font-semibold">
                                {snippets.length}
                              </span>
                            </div>
                            <span className="text-gray-300 text-sm">snippets</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredFolders.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredFolders.map((folder) => {
                        const snippetCount = snippets.filter(s => s.folder_id === folder.id).length
                        return (
                          <FolderCard
                            key={folder.id}
                            folder={folder}
                            snippetCount={snippetCount}
                            onSelect={setSelectedFolderId}
                            onEdit={(folder) => {
                              setEditingFolder(folder)
                              setShowCreateFolder(true)
                            }}
                            onDelete={handleDeleteFolder}
                            isSelected={selectedFolderId === folder.id}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">No folders found</h3>
                      <p className="text-gray-500 mb-6">
                        {folderSearchTerm ? 'Try adjusting your search terms.' : 'Start by creating your first folder!'}
                      </p>
                      {!folderSearchTerm && (
                        <button
                          onClick={() => {
                            setShowCreateFolder(true)
                            setEditingFolder(null)
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 cursor-pointer"
                        >
                          Create Your First Folder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div> */}

        {/* <div className="mb-8 mx-5">
          <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
            <div
              role="button"
              onClick={() => setShowCategoriesSection(!showCategoriesSection)}
              className="w-full p-6 text-left border-b border-gray-600/30 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">My Categories</h3>
                  <p className="text-gray-400 text-sm">Organize snippets by category</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedCategoryId && (
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCategoryId(null)
                    }}
                    className="px-4 py-2 text-sm font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCreateCategory(true)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg transition-all duration-200 shadow-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5"/>
                    </svg>
                    New Category
                  </div>
                </button>
                <button
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    showCategoriesSection ? 'bg-gray-700 rotate-180' : 'bg-gray-700/50'
                  }`}
                >
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              </div>
            </div>

            {showCategoriesSection && (
              <div className="p-6">
                <div 
                  className={`cursor-pointer transition-all duration-300 rounded-2xl border-2 p-6 mb-6 ${
                    selectedCategoryId === null 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedCategoryId === null ? 'bg-purple-500/20' : 'bg-gray-700/50'
                    }`}>
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">All Categories</h3>
                      <p className="text-sm text-gray-400">View snippets from all categories</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {Object.values(categorySnippetCounts).reduce((sum, count) => sum + count, 0)}
                      </div>
                      <div className="text-xs text-gray-400">total snippets</div>
                    </div>
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="relative mb-6">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    />
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                )}

                {filteredCategories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCategories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        snippetCount={categorySnippetCounts[category.id] || 0}
                        isSelected={selectedCategoryId === category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        onEdit={() => setEditingCategory(category)}
                        onDelete={() => handleDeleteCategory(category.id)}
                      />
                    ))}
                  </div>
                ) : categorySearchTerm ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories found</h3>
                    <p className="text-gray-500">No categories match your search term.</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories yet</h3>
                    <p className="text-gray-500 mb-6">Create your first category to organize your snippets.</p>
                    <button
                      onClick={() => setShowCreateCategory(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      Create Category
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div> */}

        {recentSnippets.length > 0 && (
          <div className="mb-8 mx-5">
          <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
          
              <div
                role="button"
                onClick={() => setShowRecentSnippets(!showRecentSnippets)}
                className="p-6 border-b border-gray-600/30 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Recent Snippets</h2>
                    <p className="text-gray-400">Continue working on your latest code</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowRecentSnippets(!showRecentSnippets) }}
                  className="p-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/70 rounded-lg transition-all duration-300 cursor-pointer"
                  aria-label="Toggle recent snippets"
                >
                  <svg className={`w-5 h-5 text-gray-400 hover:text-white transition-all duration-200 ${showRecentSnippets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              </div>

              <div className={`transition-all duration-300 overflow-hidden ${showRecentSnippets ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6">
                  <div className={`grid gap-4 ${
                    recentSnippets.length === 1 ? 'grid-cols-1' :
                    recentSnippets.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    recentSnippets.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    <AnimatePresence>
                      {recentSnippets.map((snippet) => (
                        <motion.div
                          key={snippet.id}
                          className="relative group cursor-pointer"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          {/* Main Card */}
                          <div className="bg-gray-800 rounded-2xl border border-gray-600 shadow-lg hover:shadow-xl hover:border-gray-500 transition-all duration-300 overflow-hidden h-full flex flex-col">
                            {/* Header Section */}
                            <div className="relative p-4 border-b border-gray-600/50">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-2xl"></div>
                              <div className="ml-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors flex-1" title={snippet.title}>
                                    {snippet.title}
                                  </h3>
                                  {snippet.is_public && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30 flex-shrink-0">
                                      Public
                                    </span>
                                  )}
                                </div>
                                
                                {snippet.description && (
                                  <>
                                    <div className="h-px bg-gradient-to-r from-gray-600/40 to-transparent my-2"></div>
                                    <p className="text-gray-300 text-sm leading-relaxed" title={snippet.description}>
                                      {snippet.description}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Footer with Date */}
                            <div className="px-4 py-3 mt-auto border-t border-gray-600/30">
                              <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>
                                  {(() => {
                                    const createdDate = new Date(snippet.created_at)
                                    const updatedDate = new Date(snippet.updated_at)
                                    const isUpdated = updatedDate.getTime() - createdDate.getTime() > 1000
                                    
                                    if (isUpdated) {
                                      return `Updated ${updatedDate.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric'
                                      })}`
                                    } else {
                                      return `Created ${createdDate.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric'
                                      })}`
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <motion.button
                              onClick={() => {
                                setSearchTerm(snippet.title)
                                // Focus on search input if it exists
                                setTimeout(() => {
                                  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
                                  if (searchInput) {
                                    searchInput.focus()
                                  }
                                }, 100)
                              }}
                              className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all duration-300 cursor-pointer"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Search for this snippet"
                            >
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                              </svg>
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Snippets Accordion */}
        <div className="mb-8 mx-5">
          <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
            {/* Header */}
            <div
              role="button"
              onClick={() => setShowAllSnippets(!showAllSnippets)}
              className="p-6 border-b border-gray-600/30 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">All Snippets</h2>
                  <p className="text-gray-400">Browse and manage all your code snippets</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCreateForm(true)
                    setFormData({
                      ...formData,
                      folder_id: selectedFolderId
                    })
                  }}
                  className="px-6 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5v14m7-7H5"/>
                  </svg>
                  New Snippet
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAllSnippets(!showAllSnippets) }}
                  className="p-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/70 rounded-lg transition-all duration-300 cursor-pointer"
                  aria-label="Toggle all snippets"
                >
                  <svg className={`w-5 h-5 text-gray-400 hover:text-white transition-all duration-200 ${showAllSnippets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Accordion Content */}
            <div className={`transition-all duration-300 overflow-hidden ${showAllSnippets ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6">
                {/* Search and Filter */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0 }}
                >
                  <div className="bg-gray-800/50 border border-gray-600/60 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: 0 }}
                        >
                          <div className="relative">
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder="Search snippets... (Ctrl+K)"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full px-4 py-3 pl-12 pr-12 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 shadow-sm transition-all duration-200"
                            />
                            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-white transition-colors duration-200"
                                title="Clear search"
                              >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {/* Language Filter */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[192px]">
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm"
                          >
                            <option value="">All ({scopeSnippets.length})</option>
                            {Object.entries(languageCounts)
                              .sort(([,a], [,b]) => b - a)
                              .map(([lang, count]) => (
                                <option key={lang} value={lang}>
                                  {lang.charAt(0).toUpperCase() + lang.slice(1)} ({count})
                                </option>
                              ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M19 9l-7 7-7-7"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Favorites Filter */}
                        <div className="relative flex-1 min-w-[160px] sm:min-w-[160px]">
                          <select
                            value={showFavoritesOnly ? 'favorites' : 'all'}
                            onChange={(e) => setShowFavoritesOnly(e.target.value === 'favorites')}
                            className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm"
                          >
                            <option value="all">All Snippets</option>
                            <option value="favorites">⭐ Favorites</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M19 9l-7 7-7-7"/>
                            </svg>
                          </div>
                        </div>

                        {/* Visibility Filter */}
                        <div className="relative flex-1 min-w-[160px] sm:min-w-[160px]">
                          <select
                            value={visibilityFilter}
                            onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
                            className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm"
                          >
                            <option value="all">All Visibility</option>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M19 9l-7 7-7-7"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Sort Filter */}
                        <div className="relative flex-1 min-w-[160px] sm:min-w-[160px]">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm"
                          >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="name-az">Name A-Z</option>
                            <option value="name-za">Name Z-A</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M19 9l-7 7-7-7"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>


                {filteredSnippets.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSnippets.map((snippet) => {
            const createdDate = new Date(snippet.created_at)
            const updatedDate = new Date(snippet.updated_at)
            // Check if updated time is more than 1 second after created time (more accurate than exact equality)
            const isUpdated = updatedDate.getTime() - createdDate.getTime() > 1000
            
            return (
              <motion.div
                key={snippet.id}
                className="bg-gray-800 rounded-2xl border border-gray-600 shadow-xl hover:shadow-2xl hover:border-gray-500 transition-all duration-150 group overflow-hidden h-full flex flex-col hover:bg-gray-700 w-full max-w-sm mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                whileHover={{ scale: 1.01 }}
              >
                {/* Title + Description Section */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-150 flex-1" title={snippet.title}>
                      {snippet.title.length > 25 ? snippet.title.substring(0, 25) + '...' : snippet.title}
                    </h3>
                    {snippet.is_public && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30 flex-shrink-0">
                        Public
                      </span>
                    )}
                  </div>
                  {snippet.description && (
                    <>
                      <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-150" title={snippet.description}>
                        {snippet.description.length > 60 ? snippet.description.substring(0, 60) + '...' : snippet.description}
                      </p>
                      <div className="border-b border-gray-700/50 mt-3"></div>
                    </>
                  )}
                </div>

                {/* Modern Tabs Section */}
                <div className="px-4 pb-4 flex-1 flex flex-col">
                  {/* Tab Navigation */}
                  <div className="flex bg-gray-900/50 rounded-lg p-1 mb-3 border border-gray-700/50">
                    <button
                      onClick={() => setSnippetActiveTab(snippet.id, 'code')}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                        getActiveTab(snippet.id) === 'code'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Code
                      </div>
                    </button>
                    <button
                      onClick={() => setSnippetActiveTab(snippet.id, 'tags')}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                        getActiveTab(snippet.id) === 'tags'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M3 11l8 8a2 2 0 002.828 0l6.172-6.172a2 2 0 000-2.828l-8-8H5a2 2 0 00-2 2v6z" />
                        </svg>
                        Tags
                      </div>
                    </button>
                    <button
                      onClick={() => setSnippetActiveTab(snippet.id, 'category')}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                        getActiveTab(snippet.id) === 'category'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3h10a2 2 0 012 2v14l-7-3-7 3V5a2 2 0 012-2z" />
                        </svg>
                        Cat
                      </div>
                    </button>
                    <button
                      onClick={() => setSnippetActiveTab(snippet.id, 'info')}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                        getActiveTab(snippet.id) === 'info'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Info
                      </div>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="h-[140px] bg-gray-900/30 rounded-lg p-3 border border-gray-700/30 flex-1">
                    {getActiveTab(snippet.id) === 'code' && (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{snippet.language}</span>
                          <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">{snippet.code.split('\n').length} lines</span>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700 h-[72px] overflow-hidden">
                          <pre className="text-gray-300 text-sm overflow-hidden whitespace-pre-wrap break-words h-full leading-6">
                            <code>{snippet.code.length > 200 ? snippet.code.substring(0, 200) + '...' : snippet.code}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                    {getActiveTab(snippet.id) === 'tags' && (
                      <div className="h-full flex flex-wrap gap-2 content-start">
                        {snippet.tags && snippet.tags.length > 0 ? (
                          <>
                            {snippet.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-blue-500/30 bg-blue-500/10 text-blue-200">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M3 11l8 8a2 2 0 002.828 0l6.172-6.172a2 2 0 000-2.828l-8-8H5a2 2 0 00-2 2v6z" />
                                </svg>
                                {tag}
                              </span>
                            ))}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            No tags added
                          </div>
                        )}
                      </div>
                    )}

                    {getActiveTab(snippet.id) === 'category' && (
                      <div className="h-full flex items-center">
                        {snippet.category_id && getCategoryInfo(snippet.category_id) ? (
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${getCategoryInfo(snippet.category_id)?.color}20`, borderColor: getCategoryInfo(snippet.category_id)?.color, borderWidth: '2px' }}
                            >
                              <div style={{ color: getCategoryInfo(snippet.category_id)?.color }}>
                                {renderCategoryIcon(getCategoryInfo(snippet.category_id)?.icon || 'other')}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-300 font-medium">
                                {getCategoryInfo(snippet.category_id)?.name}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Category assigned
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            {snippet.category_id ? 'No category found' : 'No category assigned'}
                          </div>
                        )}
                      </div>
                    )}

                    {getActiveTab(snippet.id) === 'info' && (
                      <div className="h-full flex flex-col justify-center space-y-3">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Created:</span>
                          <span className="text-gray-400">
                            {new Date(snippet.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {isUpdated && (
                          <div className="flex items-center gap-2 text-xs text-gray-300">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="font-medium">Updated:</span>
                            <span className="text-gray-400">
                              {new Date(snippet.updated_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <span className="font-medium">Lines:</span>
                          <span className="text-gray-400">{snippet.code.split('\n').length}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                          <span className="font-medium">Language:</span>
                          <span className="text-gray-400">{snippet.language}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="border-t border-gray-600/30 p-4 mt-auto">
                  <div className="grid grid-cols-5 gap-2">
                    <motion.button
                      onClick={() => setViewingSnippet(snippet)}
                      className="flex justify-center items-center p-2.5 text-blue-300 bg-blue-500/10 hover:text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all duration-150 cursor-pointer group/view border border-blue-400/30 hover:border-blue-400/50 shadow-sm hover:shadow-lg relative"
                      title="VIEW SNIPPET"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4 group-hover/view:scale-110 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/view:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        VIEW SNIPPET
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(snippet)
                      }}
                      className={`flex justify-center items-center p-2.5 rounded-xl transition-all duration-150 cursor-pointer group/favorite border shadow-sm hover:shadow-lg relative ${
                        snippet.is_favorite
                          ? 'text-yellow-400 bg-yellow-500/20 border-yellow-400/50 hover:text-yellow-300 hover:bg-yellow-500/30'
                          : 'text-yellow-300 bg-yellow-500/10 border-yellow-400/30 hover:text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400/50'
                      }`}
                      title={snippet.is_favorite ? "REMOVE FROM FAVORITES" : "ADD TO FAVORITES"}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4 group-hover/favorite:scale-110 transition-transform duration-150" fill={snippet.is_favorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/favorite:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {snippet.is_favorite ? "REMOVE FROM FAVORITES" : "ADD TO FAVORITES"}
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={() => handleCopySnippet(snippet.code, snippet.id)}
                      className={`flex justify-center items-center p-2.5 rounded-xl transition-all duration-150 cursor-pointer group/copy border shadow-sm hover:shadow-lg relative ${
                        copiedSnippetId === snippet.id
                          ? 'text-green-400 bg-green-500/20 border-green-400/50'
                          : 'text-green-300 bg-green-500/10 border-green-400/30 hover:text-green-400 hover:bg-green-500/20 hover:border-green-400/50'
                      }`}
                      title="COPY CODE"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copiedSnippetId === snippet.id ? (
                        <svg className="w-4 h-4 group-hover/copy:scale-110 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 group-hover/copy:scale-110 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                      )}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        COPY CODE
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={() => startEditing(snippet)}
                      className="flex justify-center items-center p-2.5 text-yellow-300 bg-yellow-500/10 hover:text-yellow-400 hover:bg-yellow-500/20 rounded-xl transition-all duration-150 cursor-pointer group/edit border border-yellow-400/30 hover:border-yellow-400/50 shadow-sm hover:shadow-lg relative"
                      title="EDIT SNIPPET"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4 group-hover/edit:scale-110 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/edit:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        EDIT SNIPPET
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteClick(snippet)}
                      className="flex justify-center items-center p-2.5 text-red-300 bg-red-500/10 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-150 cursor-pointer group/delete border border-red-400/30 hover:border-red-400/50 shadow-sm hover:shadow-lg relative"
                      title="DELETE SNIPPET"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4 group-hover/delete:scale-110 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/delete:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        DELETE SNIPPET
                      </div>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No snippets found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || selectedLanguage ? 'Try adjusting your search or filters.' : 'Start by creating your first code snippet!'}
                    </p>
                    {!searchTerm && !selectedLanguage && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 cursor-pointer"
                      >
                        Create Your First Snippet
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snippet View Modal */}
      <AnimatePresence>
        {viewingSnippet && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 sm:p-8 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            setViewingSnippet(null)
            setModalCopyClicked(false)
          }}
        >
            <motion.div 
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                border: '1px solid #0f172a'
              }} 
              className="backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-2 break-words">{viewingSnippet.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {viewingSnippet.language}
                  </span>
                  {viewingSnippet.is_public && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Public
                    </span>
                  )}
                  <span className="text-gray-400 text-sm">
                    Created {new Date(viewingSnippet.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingSnippet(null)
                  setModalCopyClicked(false)
                }}
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 cursor-pointer flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            {viewingSnippet.description && (
              <div className="mb-4">
                <p className="text-gray-300 text-base leading-relaxed break-words">{viewingSnippet.description}</p>
              </div>
            )}

            <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Code</h3>
                <button
                  onClick={() => handleModalCopy(viewingSnippet.code)}
                  className={`px-4 py-2 text-white text-sm rounded-lg transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    modalCopyClicked
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {modalCopyClicked ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <path d="M8 2h8v4H8V2z"/>
                      </svg>
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="text-gray-300 text-sm leading-relaxed overflow-x-auto modal-scroll">
                <code>{viewingSnippet.code}</code>
              </pre>
            </div>

            {viewingSnippet.tags && viewingSnippet.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {viewingSnippet.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700/50 text-gray-300 text-sm rounded-lg border border-gray-600/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {(showCreateForm || editingSnippet) && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                border: '1px solid #0f172a'
              }} 
              className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingSnippet(null)
                  setFormData({
                    title: '',
                    description: '',
                    code: '',
                    language: '',
                    tags: [],
                    is_public: false,
                    is_favorite: false,
                    folder_id: selectedFolderId
                  })
                }}
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={editingSnippet ? handleUpdateSnippet : handleCreateSnippet} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Title * <span className="text-gray-400 text-xs">({formData.title.length}/20)</span>
                    {titleError && <span className="text-red-400 text-xs ml-2">• {titleError}</span>}
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={20}
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      // Clear error when user starts typing
                      if (titleError) setTitleError('')
                    }}
                    className={`w-full px-4 py-3 bg-gray-800/90 border rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm transition-all duration-200 ${
                      titleError 
                        ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-400/50' 
                        : 'border-gray-600/60 focus:ring-blue-500/30 focus:border-blue-400/50'
                    }`}
                    placeholder="Enter snippet title (minimum 5 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Language *</label>
                  <div className="relative">
                    <select
                      required
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm transition-all duration-200"
                    >
                      <option value="">Select Language</option>
                      {PROGRAMMING_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description <span className="text-gray-400 text-xs">({(formData.description || '').length}/50)</span>
                </label>
                <textarea
                  value={formData.description}
                  maxLength={50}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 shadow-sm transition-all duration-200"
                  placeholder="Describe what this snippet does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Code *</label>
                <textarea
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 font-mono text-sm shadow-sm transition-all duration-200"
                  placeholder="Paste your code here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                  })}
                  className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 shadow-sm transition-all duration-200"
                  placeholder="react, hooks, api (optional)"
                />
              </div>

              {/* Folder Selection */}
              {folders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Folder (Optional)</label>
                  <div className="relative">
                    <select
                      value={formData.folder_id || ''}
                      onChange={(e) => setFormData({ ...formData, folder_id: e.target.value || null })}
                      className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm transition-all duration-200"
                    >
                      <option value="">No Folder (Root)</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>📁 {folder.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Selection */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Category (Optional)</label>
                  <div className="relative">
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                      className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50 cursor-pointer appearance-none pr-10 shadow-sm transition-all duration-200"
                    >
                      <option value="">No Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>🏷️ {category.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-white">
                  Make this snippet public
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_favorite"
                  checked={formData.is_favorite}
                  onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                  className="w-4 h-4 text-yellow-600 bg-gray-800 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2 transition-all duration-200"
                />
                <label htmlFor="is_favorite" className="text-sm font-medium text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  Mark as favorite
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold cursor-pointer"
                >
                  {editingSnippet ? 'Update Snippet' : 'Create Snippet'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingSnippet(null)
                    setFormData({
                      title: '',
                      description: '',
                      code: '',
                      language: '',
                      tags: [],
                      is_public: false,
                      is_favorite: false,
                      folder_id: selectedFolderId,
                      category_id: selectedCategoryId
                    })
                  }}
                  className="px-8 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-all duration-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false)
            setSnippetToDelete(null)
          }}
          onConfirm={() => {
            if (snippetToDelete) {
              handleDeleteSnippet(snippetToDelete.id)
            }
          }}
          snippetTitle={snippetToDelete?.title || ''}
          isPermanent={hasNewSchema === false}
        />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        snippets={snippets}
        onShowToast={(message, type) => addToast({ message, type })}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSnippets={handleImportSnippets}
        onShowToast={(message, type) => addToast({ message, type })}
      />

      {/* Create/Edit Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => {
          setShowCreateFolder(false)
          setEditingFolder(null)
        }}
        onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
        editingFolder={editingFolder}
      />

      {/* Confirm Delete Folder */}
      <ConfirmDeleteFolderModal
        isOpen={showDeleteFolder}
        folder={folderToDelete}
        onClose={() => { setShowDeleteFolder(false); setFolderToDelete(null) }}
        onConfirm={confirmDeleteFolder}
      />

      {/* Alert (e.g., duplicate name) */}
      <AlertModal
        isOpen={showAlert.open}
        title={showAlert.title}
        message={showAlert.message}
        variant={showAlert.variant}
        onClose={() => setShowAlert({ open: false, title: '', message: '' })}
      />

      {/* Comprehensive Recycle Bin Modal */}
      <ComprehensiveRecycleBinModal
        isOpen={showRecycleBin}
        onClose={() => setShowRecycleBin(false)}
        onRestore={handleRestoreSnippet}
        onPermanentDelete={handlePermanentDelete}
        userId={user?.id || ''}
        onShowToast={(message, type) => addToast({ message, type })}
      />

      {/* Category Modals */}
      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onSubmit={(data) => handleCreateCategory(data as CreateCategoryData)}
      />

      <CreateCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={(data) => handleUpdateCategory(data as CreateCategoryData)}
        editingCategory={editingCategory}
      />
    </div>
  )
}
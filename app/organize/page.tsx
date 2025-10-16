'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { Folder, Category, CreateFolderData, UpdateFolderData, CreateCategoryData, UpdateCategoryData, Snippet, CreateSnippetData } from '../../lib/supabase'
import { FolderCard } from '../components/FolderCard'
import CategoryCard from '../components/CategoryCard'
import { CreateFolderModal } from '../components/CreateFolderModal'
import CreateCategoryModal from '../components/CreateCategoryModal'
import { ConfirmDeleteFolderModal } from '../components/ConfirmDeleteFolderModal'
import { AlertModal } from '../components/AlertModal'
import { ToastContainer } from '../components/Toast'
import CreateSnippetModal from '../components/CreateSnippetModal'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useSwiperSettings } from '../hooks/useSwiperSettings'
import { SwiperSlider } from '../components/SwiperSlider'

export default function OrganizePage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'folders' | 'categories'>('folders')
  const { settings: swiperSettings, isLoaded: swiperSettingsLoaded } = useSwiperSettings()
  
  
  // Folders state
  const [folders, setFolders] = useState<Folder[]>([])
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [showDeleteFolder, setShowDeleteFolder] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
  const [folderSearchTerm, setFolderSearchTerm] = useState('')
  const [folderSnippetCounts, setFolderSnippetCounts] = useState<{ [key: string]: number }>({})
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [categorySnippetCounts, setCategorySnippetCounts] = useState<{ [key: string]: number }>({})
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([])
  const [showAlert, setShowAlert] = useState<{ open: boolean; title: string; message: string; variant?: 'error'|'info' }>({ open: false, title: '', message: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showCreateSnippet, setShowCreateSnippet] = useState(false)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [showSnippetsForFolder, setShowSnippetsForFolder] = useState<string | null>(null)
  const [showSnippetsForCategory, setShowSnippetsForCategory] = useState<string | null>(null)
  const [snippetSearchTerm, setSnippetSearchTerm] = useState('')
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [viewingSnippet, setViewingSnippet] = useState<Snippet | null>(null)
  const [modalCopyClicked, setModalCopyClicked] = useState(false)
  const [activeTabs, setActiveTabs] = useState<{ [snippetId: string]: 'code' | 'tags' | 'category' | 'info' }>({})

  // Lock body scroll when modals are open
  useBodyScrollLock(viewingSnippet !== null || showDeleteConfirm.open || showCreateSnippet || editingSnippet !== null)

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFolders(data || [])

      // Fetch snippet counts for each folder
      const { data: snippetCounts, error: countError } = await supabase
        .from('snippets')
        .select('folder_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (countError) throw countError

      const counts: { [key: string]: number } = {}
      snippetCounts?.forEach(snippet => {
        const folderId = snippet.folder_id || 'uncategorized'
        counts[folderId] = (counts[folderId] || 0) + 1
      })

      setFolderSnippetCounts(counts)

    } catch (error) {
      console.error('Error fetching folders:', error)
      setFolders([])
      setFolderSnippetCounts({})
    }
  }, [user])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!user?.id) return

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
      await fetchCategorySnippetCounts()

    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
      setCategorySnippetCounts({})
    }
  }, [user])

  // Fetch snippet counts for categories
  const fetchCategorySnippetCounts = useCallback(async () => {
    if (!user?.id) return
    
    try {
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
      console.error('Error fetching snippet counts:', error)
    }
  }, [user])

  // Fetch snippets for a specific folder
  const fetchSnippetsForFolder = useCallback(async (folderId: string) => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder_id', folderId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSnippets(data || [])
    } catch (error) {
      console.error('Error fetching snippets for folder:', error)
      setSnippets([])
    }
  }, [user])

  // Fetch snippets for a specific category
  const fetchSnippetsForCategory = useCallback(async (categoryId: string) => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSnippets(data || [])
    } catch (error) {
      console.error('Error fetching snippets for category:', error)
      setSnippets([])
    }
  }, [user])

  // Load data on mount
  useEffect(() => {
    if (user) {
      Promise.all([fetchFolders(), fetchCategories()]).finally(() => {
        setLoading(false)
      })
    }
  }, [user, fetchFolders, fetchCategories])

  // Toast management
  const addToast = (toast: { message: string; type: 'success' | 'error' | 'info' }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

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


  // Folder CRUD functions
  const handleCreateFolder = async (data: CreateFolderData) => {
    if (!user?.id) return
    
    try {
      // Check for duplicate names
      const { data: existingFolders } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', data.name)

      if (existingFolders && existingFolders.length > 0) {
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
      setShowCreateFolder(false)
      fetchFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
      addToast({
        message: 'Failed to create folder',
        type: 'error'
      })
    }
  }

  const handleUpdateFolder = async (data: UpdateFolderData) => {
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
      const response = await fetch(`/api/folders/${id}/soft-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to delete folder')

      addToast({
        message: 'Folder moved to recycle bin',
        type: 'success'
      })
      setShowDeleteFolder(false)
      setFolderToDelete(null)
      fetchFolders()
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
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', data.name!)

      if (existingCategories && existingCategories.length > 0) {
        setShowAlert({ open: true, title: 'Duplicate Category Name', message: 'A category with this name already exists. Please choose a different name.', variant: 'error' })
        return
      }

      const { error } = await supabase
        .from('categories')
        .insert([{
          ...data,
          user_id: user.id
        }])

      if (error) throw error

      addToast({
        message: 'Category created successfully!',
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

  const handleUpdateCategory = async (data: UpdateCategoryData) => {
    if (!editingCategory) return

    try {
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', editingCategory.id)

      if (error) throw error

      addToast({
        message: 'Category updated successfully!',
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

  const handleDeleteCategory = (category: Category) => {
    setShowDeleteConfirm({ open: true, category })
  }

  const confirmDeleteCategory = async () => {
    if (!showDeleteConfirm.category) return
    
    const categoryId = showDeleteConfirm.category.id
    
    try {
      const response = await fetch(`/api/categories/${categoryId}/soft-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to delete category')

      // Clear snippet list if the deleted category was selected
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null)
        setShowSnippetsForCategory(null)
        setSnippets([])
      }

      addToast({
        message: 'Category moved to recycle bin',
        type: 'success'
      })
      
      setShowDeleteConfirm({ open: false, category: null })
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      addToast({
        message: 'Failed to delete category',
        type: 'error'
      })
    }
  }

  // Handle snippet creation
  const handleCreateSnippet = async (data: CreateSnippetData) => {
    if (!user?.id || !selectedFolderId) return

    try {
      const { error } = await supabase
        .from('snippets')
        .insert([{
          ...data,
          user_id: user.id,
          folder_id: selectedFolderId,
          category_id: selectedCategoryId
        }])

      if (error) throw error

      addToast({
        message: 'Snippet created successfully!',
        type: 'success'
      })
      setShowCreateSnippet(false)
      
      // Update category snippet counts
      await fetchCategorySnippetCounts()
      
      // Refresh snippets for the current folder
      if (showSnippetsForFolder) {
        fetchSnippetsForFolder(showSnippetsForFolder)
      }
      
      // Update folder snippet counts
      fetchFolders()
    } catch (error) {
      console.error('Error creating snippet:', error)
      addToast({
        message: 'Failed to create snippet',
        type: 'error'
      })
    }
  }

  const handleUpdateSnippet = async (data: CreateSnippetData) => {
    if (!editingSnippet) return

    try {
      const { error } = await supabase
        .from('snippets')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSnippet.id)

      if (error) throw error

      addToast({
        message: 'Snippet updated successfully!',
        type: 'success'
      })

      // Update category snippet counts
      await fetchCategorySnippetCounts()

      // Refresh snippets for the current folder
      if (showSnippetsForFolder) {
        fetchSnippetsForFolder(showSnippetsForFolder)
      }

      setShowCreateSnippet(false)
      setEditingSnippet(null)
    } catch (error) {
      console.error('Error updating snippet:', error)
      addToast({
        message: 'Failed to update snippet',
        type: 'error'
      })
    }
  }

  // Handle snippet actions
  const handleViewSnippet = (snippet: Snippet) => {
    setViewingSnippet(snippet)
    setModalCopyClicked(false)
  }

  const handleToggleFavorite = async (snippet: Snippet) => {
    try {
      const { error } = await supabase
        .from('snippets')
        .update({ is_favorite: !snippet.is_favorite })
        .eq('id', snippet.id)

      if (error) throw error

      // Update local state
      setSnippets(prev => prev.map(s => 
        s.id === snippet.id ? { ...s, is_favorite: !s.is_favorite } : s
      ))

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
  }

  const handleCopySnippet = async (snippet: Snippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      addToast({
        message: 'Code copied to clipboard!',
        type: 'success'
      })
    } catch (error) {
      console.error('Error copying snippet:', error)
      addToast({
        message: 'Failed to copy code',
        type: 'error'
      })
    }
  }

  const handleEditSnippet = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setShowCreateSnippet(true)
  }

  const handleDeleteSnippet = async (snippet: Snippet) => {
    try {
      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', snippet.id)

      if (error) throw error

      // Update local state
      setSnippets(prev => prev.filter(s => s.id !== snippet.id))

      addToast({
        message: 'Snippet deleted successfully',
        type: 'success'
      })

      // Update category snippet counts
      await fetchCategorySnippetCounts()

      // Update folder snippet counts
      fetchFolders()
    } catch (error) {
      console.error('Error deleting snippet:', error)
      addToast({
        message: 'Failed to delete snippet',
        type: 'error'
      })
    }
  }

  // Filter data based on search terms
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(folderSearchTerm.toLowerCase())
  )

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(categorySearchTerm.toLowerCase())
  )

  const filteredSnippets = snippets.filter(snippet => 
    snippet.title.toLowerCase().includes(snippetSearchTerm.toLowerCase()) ||
    snippet.description?.toLowerCase().includes(snippetSearchTerm.toLowerCase()) ||
    snippet.code.toLowerCase().includes(snippetSearchTerm.toLowerCase()) ||
    snippet.tags?.some(tag => tag.toLowerCase().includes(snippetSearchTerm.toLowerCase()))
  )

  if (!user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your organization...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-[2000px] mx-auto pt-[40px] py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Organize Your Library</h1>
              <p className="text-gray-300 text-lg">Manage your folders and categories to keep your code snippets organized</p>
            </div>
            {(selectedFolderId || selectedCategoryId) && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFolderId(null)
                    setSelectedCategoryId(null)
                    setShowSnippetsForFolder(null)
                    setSnippets([])
                    setSnippetSearchTerm('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Selected
                </button>
                <button
                  onClick={() => setShowCreateSnippet(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Create Snippet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-3 bg-gray-800/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('folders')}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group ${
                activeTab === 'folders'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/25 scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/30 hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-center gap-3 cursor-pointer relative z-10">
                <div className={`transition-all duration-300 ${activeTab === 'folders' ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                  </svg>
                </div>
                <span className="text-sm">Folders</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeTab === 'folders' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-600/50 text-gray-400 group-hover:bg-gray-500/50 group-hover:text-gray-300'
                }`}>
                  {folders.length}
                </span>
              </div>
              {activeTab === 'folders' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 animate-pulse"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/30 hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-center gap-3 cursor-pointer relative z-10">
                <div className={`transition-all duration-300 ${activeTab === 'categories' ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                </div>
                <span className="text-sm">Categories</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeTab === 'categories' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-600/50 text-gray-400 group-hover:bg-gray-500/50 group-hover:text-gray-300'
                }`}>
                  {categories.length}
                </span>
              </div>
              {activeTab === 'categories' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20 animate-pulse"></div>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-[#111B32] border border-gray-700 rounded-3xl p-8 shadow-xl">
          {activeTab === 'folders' ? (
            <div>
              {/* Folders Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Your Folders</h2>
                  <p className="text-gray-300">Organize your snippets into folders for better management</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search folders..."
                      value={folderSearchTerm}
                      onChange={(e) => setFolderSearchTerm(e.target.value)}
                      className="w-64 px-4 py-2 pl-10 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    New Folder
                  </button>
                </div>
              </div>

              {/* Folders Grid/Swiper */}
              {filteredFolders.length > 0 ? (
                swiperSettingsLoaded && swiperSettings.foldersSwiper && filteredFolders.length > 3 ? (
                  <div className="overflow-hidden rounded-2xl">
                    <SwiperSlider
                      className="folders-swiper"
                      slidesPerView={3}
                      spaceBetween={24}
                      breakpoints={{
                        320: { slidesPerView: 1, spaceBetween: 16 },
                        640: { slidesPerView: 2, spaceBetween: 20 },
                        1024: { slidesPerView: 3, spaceBetween: 24 }
                      }}
                    >
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        snippetCount={folderSnippetCounts[folder.id] || 0}
                        onEdit={() => setEditingFolder(folder)}
                        onDelete={() => handleDeleteFolder(folder)}
                        onSelect={(folderId) => {
                          const newSelectedId = selectedFolderId === folderId ? null : folderId
                          setSelectedFolderId(newSelectedId)
                          if (newSelectedId) {
                            setShowSnippetsForFolder(newSelectedId)
                            fetchSnippetsForFolder(newSelectedId)
                          } else {
                            setShowSnippetsForFolder(null)
                            setSnippets([])
                          }
                        }}
                        isSelected={selectedFolderId === folder.id}
                      />
                    ))}
                    </SwiperSlider>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        snippetCount={folderSnippetCounts[folder.id] || 0}
                        onEdit={() => setEditingFolder(folder)}
                        onDelete={() => handleDeleteFolder(folder)}
                        onSelect={(folderId) => {
                          const newSelectedId = selectedFolderId === folderId ? null : folderId
                          setSelectedFolderId(newSelectedId)
                          if (newSelectedId) {
                            setShowSnippetsForFolder(newSelectedId)
                            fetchSnippetsForFolder(newSelectedId)
                          } else {
                            setShowSnippetsForFolder(null)
                            setSnippets([])
                          }
                        }}
                        isSelected={selectedFolderId === folder.id}
                      />
                    ))}
                  </div>
                )
              ) : folderSearchTerm ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No folders found</h3>
                  <p className="text-gray-500">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No folders yet</h3>
                  <p className="text-gray-500 mb-6">Create your first folder to organize your snippets</p>
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium cursor-pointer"
                  >
                    Create Your First Folder
                  </button>
                </div>
              )}

              {/* Show snippets for selected folder */}
              {showSnippetsForFolder && (
                <div className="mt-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Snippets in this folder</h3>
                        <p className="text-gray-300">
                          {filteredSnippets.length} of {snippets.length} snippet{snippets.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                    </div>
                    
                    {/* Search bar for snippets */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search snippets in this folder..."
                        value={snippetSearchTerm}
                        onChange={(e) => setSnippetSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {filteredSnippets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredSnippets.map((snippet) => (
                        <div
                          key={snippet.id}
                          className="bg-gray-800 rounded-2xl border border-gray-600 shadow-xl hover:shadow-2xl hover:border-gray-500 transition-all duration-150 group overflow-hidden p-6"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                {snippet.title}
                              </h4>
                              {snippet.description && (
                                <>
                                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                    {snippet.description}
                                  </p>
                                  <div className="border-b border-gray-700/50 mb-4"></div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Modern Tabs Section */}
                          <div className="mb-4">
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
                            <div className="h-[140px] bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
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
                                    snippet.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-blue-500/30 bg-blue-500/10 text-blue-200"
                                      >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M3 11l8 8a2 2 0 002.828 0l6.172-6.172a2 2 0 000-2.828l-8-8H5a2 2 0 00-2 2v6z" />
                                        </svg>
                                        {tag}
                                      </span>
                                    ))
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
                                  {(() => {
                                    const category = categories.find(c => c.id === snippet.category_id)
                                    if (category) {
                                      const pillBg = category.background || 'rgba(147,51,234,0.15)'
                                      const pillFg = category.color || '#E9D5FF'
                                      return (
                                        <div className="flex items-center gap-3">
                                          <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${pillBg}`, borderColor: pillFg, borderWidth: '2px' }}
                                          >
                                            <div style={{ color: pillFg }}>
                                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M5 3a2 2 0 00-2 2v16l7-4 7 4V5a2 2 0 00-2-2H5z" />
                                              </svg>
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-sm text-gray-300 font-medium">
                                              {category.name}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                              Category assigned
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        {snippet.category_id ? 'No category found' : 'No category assigned'}
                                      </div>
                                    )
                                  })()}
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

                          {/* Action buttons */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewSnippet(snippet)}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                title="View snippet"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleToggleFavorite(snippet)}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  snippet.is_favorite 
                                    ? 'text-yellow-400 hover:bg-yellow-500/10' 
                                    : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                                }`}
                                title={snippet.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <svg className="w-4 h-4" fill={snippet.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleCopySnippet(snippet)}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Copy code"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSnippet(snippet)}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit snippet"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteSnippet(snippet)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete snippet"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.636M15 6.343A7.962 7.962 0 0112 5c-2.34 0-4.29 1.009-5.824 2.636" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        {snippetSearchTerm ? 'No snippets found' : 'No snippets in this folder'}
                      </h3>
                      <p className="text-gray-400 mb-6">
                        {snippetSearchTerm 
                          ? 'Try adjusting your search terms' 
                          : 'Create your first snippet to get started'
                        }
                      </p>
                      {!snippetSearchTerm && (
                        <button
                          onClick={() => setShowCreateSnippet(true)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center gap-2 cursor-pointer mx-auto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                          </svg>
                          Create First Snippet
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div>
              {/* Categories Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Your Categories</h2>
                  <p className="text-gray-300">Categorize your snippets with colors and icons</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      className="w-64 px-4 py-2 pl-10 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateCategory(true)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    New Category
                  </button>
                </div>
              </div>

              {/* Categories Grid/Swiper */}
              {filteredCategories.length > 0 ? (
                swiperSettingsLoaded && swiperSettings.categoriesSwiper && filteredCategories.length > 3 ? (
                  <div className="overflow-hidden rounded-2xl">
                    <SwiperSlider
                      className="categories-swiper"
                      slidesPerView={3}
                      spaceBetween={24}
                      breakpoints={{
                        320: { slidesPerView: 1, spaceBetween: 16 },
                        640: { slidesPerView: 2, spaceBetween: 20 },
                        1024: { slidesPerView: 3, spaceBetween: 24 }
                      }}
                    >
                    {filteredCategories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        snippetCount={categorySnippetCounts[category.id] || 0}
                        onEdit={() => setEditingCategory(category)}
                        onDelete={() => handleDeleteCategory(category)}
                        onClick={() => {
                          const newSelectedId = showSnippetsForCategory === category.id ? null : category.id
                          setShowSnippetsForCategory(newSelectedId)
                          if (newSelectedId) {
                            fetchSnippetsForCategory(newSelectedId)
                          } else {
                            setSnippets([])
                          }
                        }}
                        isSelected={showSnippetsForCategory === category.id}
                      />
                    ))}
                    </SwiperSlider>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCategories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        snippetCount={categorySnippetCounts[category.id] || 0}
                        onEdit={() => setEditingCategory(category)}
                        onDelete={() => handleDeleteCategory(category)}
                        onClick={() => {
                          const newSelectedId = showSnippetsForCategory === category.id ? null : category.id
                          setShowSnippetsForCategory(newSelectedId)
                          if (newSelectedId) {
                            fetchSnippetsForCategory(newSelectedId)
                          } else {
                            setSnippets([])
                          }
                        }}
                        isSelected={showSnippetsForCategory === category.id}
                      />
                    ))}
                  </div>
                )
              ) : categorySearchTerm ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories found</h3>
                  <p className="text-gray-500">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories yet</h3>
                  <p className="text-gray-500 mb-6">Create your first category to organize your snippets</p>
                  <button
                    onClick={() => setShowCreateCategory(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium cursor-pointer"
                  >
                    Create Your First Category
                  </button>
                </div>
              )}

              {/* Snippet List for Selected Category */}
              {showSnippetsForCategory && snippets.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Snippets in {categories.find(c => c.id === showSnippetsForCategory)?.name || 'Category'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {snippets.length} snippet{snippets.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSnippetsForCategory(null)
                        setSelectedCategoryId(null)
                        setSnippets([])
                      }}
                      className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                      title="Close snippet list"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Snippet Grid - 3 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {snippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className="bg-gray-800/50 rounded-xl border border-gray-600/50 p-4 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 group cursor-pointer"
                        onClick={() => handleViewSnippet(snippet)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Code Icon */}
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </div>
                          
                          {/* Snippet Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors" title={snippet.title}>
                              {snippet.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                                {snippet.language}
                              </span>
                              <span className="text-xs text-gray-500">
                                {snippet.code.split('\n').length} lines
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Snippets Message for Selected Category */}
              {showSnippetsForCategory && snippets.length === 0 && (categorySnippetCounts[showSnippetsForCategory] || 0) === 0 && (
                <div className="mt-8">
                  <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-700/50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.636M15 6.343A7.962 7.962 0 0112 5c-2.34 0-4.29 1.009-5.824 2.636" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No snippets in this category
                    </h3>
                    <p className="text-gray-400">
                      This category doesn&apos;t have any snippets yet
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSubmit={(data) => handleCreateFolder(data as CreateFolderData)}
      />

      <CreateFolderModal
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        onSubmit={(data) => handleUpdateFolder(data as UpdateFolderData)}
        editingFolder={editingFolder}
      />

      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onSubmit={(data) => handleCreateCategory(data as CreateCategoryData)}
      />

      <CreateCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={(data) => handleUpdateCategory(data as UpdateCategoryData)}
        editingCategory={editingCategory}
      />

      <ConfirmDeleteFolderModal
        isOpen={showDeleteFolder}
        onClose={() => setShowDeleteFolder(false)}
        onConfirm={confirmDeleteFolder}
        folder={folderToDelete}
      />

      <AlertModal
        isOpen={showAlert.open}
        onClose={() => setShowAlert({ open: false, title: '', message: '' })}
        title={showAlert.title}
        message={showAlert.message}
        variant={showAlert.variant}
      />

      <CreateSnippetModal
        isOpen={showCreateSnippet}
        onClose={() => {
          setShowCreateSnippet(false)
          setEditingSnippet(null)
        }}
        onSubmit={editingSnippet ? handleUpdateSnippet : handleCreateSnippet}
        folders={folders}
        categories={categories}
        selectedFolderId={selectedFolderId}
        selectedCategoryId={selectedCategoryId}
        editingSnippet={editingSnippet}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

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

      {/* Delete Category Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm.open && showDeleteConfirm.category && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm({ open: false, category: null })}
          >
            <motion.div
              className="bg-gray-800 rounded-2xl border border-gray-600 shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${showDeleteConfirm.category.color}20`,
                      borderColor: showDeleteConfirm.category.color,
                      borderWidth: '2px'
                    }}
                  >
                    <svg className="w-6 h-6" style={{ color: showDeleteConfirm.category.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3h10a2 2 0 012 2v14l-7-3-7 3V5a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      Delete Category
                    </h3>
                    <p className="text-sm text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                {/* Category Info */}
                <div className="bg-gray-700/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${showDeleteConfirm.category.color}20`,
                        borderColor: showDeleteConfirm.category.color,
                        borderWidth: '1px'
                      }}
                    >
                      <svg className="w-4 h-4" style={{ color: showDeleteConfirm.category.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3h10a2 2 0 012 2v14l-7-3-7 3V5a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">
                        {showDeleteConfirm.category.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {categorySnippetCounts[showDeleteConfirm.category.id] || 0} snippet{(categorySnippetCounts[showDeleteConfirm.category.id] || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-red-400 font-medium text-sm mb-1">
                        Warning: Irreversible Action
                      </h5>
                      <p className="text-red-300/80 text-sm leading-relaxed">
                        All snippets in this category will be moved to uncategorized. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setShowDeleteConfirm({ open: false, category: null })}
                  className="flex-1 px-4 cursor-pointer py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="flex-1 cursor-pointer px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
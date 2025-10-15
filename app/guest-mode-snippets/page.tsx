'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toast, ToastContainer } from '../components/Toast'
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { isGuestMode, getGuestSnippets, saveGuestSnippets, type GuestSnippet } from '@/lib/guestMode'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PROGRAMMING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SCSS', 'SQL', 'Bash', 'PowerShell', 'JSON',
  'YAML', 'XML', 'Markdown', 'Vue', 'React', 'Angular', 'Node.js', 'Express', 'Next.js',
  'Liquid', 'GraphQL', 'Dockerfile', 'Shell', 'Zsh', 'Fish', 'Vim', 'Emacs', 'Makefile'
]

export default function GuestModeSnippets() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [snippets, setSnippets] = useState<GuestSnippet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<GuestSnippet | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showRecentSnippets, setShowRecentSnippets] = useState(true)
  const [showAllSnippets, setShowAllSnippets] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewingSnippet, setViewingSnippet] = useState<GuestSnippet | null>(null)
  const [guestUsername, setGuestUsername] = useState<string | null>(null)
  
  // Lock body scroll when modals are open
  useBodyScrollLock(showCreateForm || viewingSnippet !== null)
  
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([])
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [snippetToDelete, setSnippetToDelete] = useState<GuestSnippet | null>(null)
  
  // Copy state for toast feedback
  const [modalCopyClicked, setModalCopyClicked] = useState(false)
  
  
  // Form validation states
  const [titleError, setTitleError] = useState('')
  
  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchSnippets = useCallback(async () => {
    const guestSnippets = getGuestSnippets()
    setSnippets(guestSnippets)
    setLoading(false)
  }, [])

  // Check if user is in guest mode
  useEffect(() => {
    setIsClient(true)
    
    if (!isGuestMode()) {
      router.push('/choose-username')
      return
    }
    
    setGuestUsername(localStorage.getItem('guestUsername'))
    fetchSnippets()
    
    // Add guest mode header for middleware
    if (typeof window !== 'undefined') {
      // This will be handled by the middleware
    }
  }, [router, fetchSnippets])

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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: '',
    tags: [] as string[],
    isFavorite: false
  })

  useEffect(() => {
    if (isClient) {
      fetchSnippets()
    }
  }, [isClient, fetchSnippets])

  // Load accordion state from localStorage
  useEffect(() => {
    const savedRecentState = localStorage.getItem('guest-snippets-recent-open')
    const savedAllState = localStorage.getItem('guest-snippets-all-open')
    
    if (savedRecentState !== null) {
      setShowRecentSnippets(JSON.parse(savedRecentState))
    }
    if (savedAllState !== null) {
      setShowAllSnippets(JSON.parse(savedAllState))
    }
  }, [])

  // Save accordion state to localStorage
  useEffect(() => {
    localStorage.setItem('guest-snippets-recent-open', JSON.stringify(showRecentSnippets))
  }, [showRecentSnippets])

  useEffect(() => {
    localStorage.setItem('guest-snippets-all-open', JSON.stringify(showAllSnippets))
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

    // Validate form
    if (!validateForm()) return

    try {
      const guestSnippets = getGuestSnippets()
      const now = new Date().toISOString()
      const newSnippet: GuestSnippet = {
        id: `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title: formData.title,
        description: formData.description || '',
        code: formData.code,
        language: formData.language,
        tags: formData.tags || [],
        isFavorite: formData.isFavorite,
        createdAt: now,
        updatedAt: now,
      }
      guestSnippets.push(newSnippet)
      saveGuestSnippets(guestSnippets)

      setFormData({
        title: '',
        description: '',
        code: '',
        language: '',
        tags: [],
        isFavorite: false
      })
      setShowCreateForm(false)
      fetchSnippets()
      
      addToast({
        message: 'Snippet created successfully',
        type: 'success'
      })
    } catch (_error) {
      console.error('Error creating snippet:', _error)
      addToast({
        message: 'Failed to create snippet',
        type: 'error'
      })
    }
  }

  const handleUpdateSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSnippet) return

    // Validate form
    if (!validateForm()) return

    try {
      const guestSnippets = getGuestSnippets()
      const index = guestSnippets.findIndex(s => s.id === editingSnippet.id)
      if (index !== -1) {
        guestSnippets[index] = {
          ...guestSnippets[index],
          title: formData.title,
          description: formData.description || '',
          code: formData.code,
          language: formData.language,
          tags: formData.tags || [],
          isFavorite: formData.isFavorite,
          updatedAt: new Date().toISOString(),
        }
        saveGuestSnippets(guestSnippets)
      }

      setEditingSnippet(null)
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        code: '',
        language: '',
        tags: [],
        isFavorite: false
      })
      fetchSnippets()
      
      addToast({
        message: 'Snippet updated successfully',
        type: 'success'
      })
    } catch (_error) {
      console.error('Error updating snippet:', _error)
      addToast({
        message: 'Failed to update snippet',
        type: 'error'
      })
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
  const handleDeleteClick = (snippet: GuestSnippet) => {
    setSnippetToDelete(snippet)
    setShowDeleteConfirm(true)
  }

  // Delete snippet
  const handleDeleteSnippet = useCallback(async (id: string) => {
    try {
      const guestSnippets = getGuestSnippets()
      const filtered = guestSnippets.filter(s => s.id !== id)
      saveGuestSnippets(filtered)
      
      addToast({
        message: 'Snippet permanently deleted',
        type: 'info'
      })
      
      fetchSnippets()
    } catch (_error) {
      console.error('Error deleting snippet:', _error)
      addToast({
        message: 'Failed to delete snippet',
        type: 'error'
      })
    }
  }, [fetchSnippets, addToast])



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

  const startEditing = (snippet: GuestSnippet) => {
    setEditingSnippet(snippet)
    setFormData({
      title: snippet.title,
      description: snippet.description || '',
      code: snippet.code,
      language: snippet.language,
      tags: snippet.tags || [],
      isFavorite: snippet.isFavorite
    })
    setShowCreateForm(true)
  }

  const startViewing = (snippet: GuestSnippet) => {
    setViewingSnippet(snippet)
  }

  const toggleFavorite = (snippet: GuestSnippet) => {
    const guestSnippets = getGuestSnippets()
    const index = guestSnippets.findIndex(s => s.id === snippet.id)
    if (index !== -1) {
      guestSnippets[index].isFavorite = !guestSnippets[index].isFavorite
      guestSnippets[index].updatedAt = new Date().toISOString()
      saveGuestSnippets(guestSnippets)
      fetchSnippets()
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addToast({
        message: 'Code copied to clipboard',
        type: 'success'
      })
    } catch {
      addToast({
        message: 'Failed to copy code',
        type: 'error'
      })
    }
  }

  const exportSnippets = () => {
    try {
      const dataStr = JSON.stringify(snippets, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `guest-snippets-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      addToast({
        message: 'Snippets exported successfully',
        type: 'success'
      })
    } catch {
      addToast({
        message: 'Failed to export snippets',
        type: 'error'
      })
    }
  }

  const importSnippets = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedSnippets = JSON.parse(e.target?.result as string) as GuestSnippet[]
            const currentSnippets = getGuestSnippets()
            const mergedSnippets = [...currentSnippets, ...importedSnippets]
            saveGuestSnippets(mergedSnippets)
            fetchSnippets()
            
            addToast({
              message: `Imported ${importedSnippets.length} snippets successfully`,
              type: 'success'
            })
          } catch {
            addToast({
              message: 'Failed to import snippets. Invalid file format.',
              type: 'error'
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading guest snippets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading your guest snippets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get recent snippets (3 most recent)
  const recentSnippets = [...snippets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  // Filter and sort all snippets
  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLanguage = !selectedLanguage || snippet.language === selectedLanguage
    const matchesFavorites = !showFavoritesOnly || snippet.isFavorite
    return matchesSearch && matchesLanguage && matchesFavorites
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'name-az':
        return a.title.localeCompare(b.title)
      case 'name-za':
        return b.title.localeCompare(a.title)
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12">
      <div className="max-w-[1800px] mx-auto">
        {/* Warning Message */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-amber-400 font-semibold text-sm mb-1">Guest Mode - Limited Access</h3>
                <p className="text-zinc-300 text-sm">
                  For full access to all features, cloud sync, and data backup, please{' '}
                  <Link 
                    href="/sign-in" 
                    className="text-amber-400 hover:text-amber-300 underline font-medium transition-colors"
                  >
                    login
                  </Link>
                  {' '}or{' '}
                  <Link 
                    href="/sign-up" 
                    className="text-amber-400 hover:text-amber-300 underline font-medium transition-colors"
                  >
                    create an account
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
                Guest Mode Snippets
              </h1>
              <p className="text-zinc-400 text-lg">
                Welcome back, <span className="text-indigo-400 font-semibold">{guestUsername}</span>
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                Your snippets are saved locally in your browser
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={importSnippets}
                className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                </svg>
                Import
              </button>
              
              <button
                onClick={exportSnippets}
                className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export
              </button>
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                New Snippet
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search snippets... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
            
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="cursor-pointer px-4 py-3 pr-10 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUw5IDZMMTIgOU0xMiAxNUw5IDE4TDYgMTUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
            >
              <option value="">All Languages</option>
              {PROGRAMMING_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            
            <select
              value={showFavoritesOnly ? 'favorites' : 'all'}
              onChange={(e) => setShowFavoritesOnly(e.target.value === 'favorites')}
              className="cursor-pointer px-4 py-3 pr-10 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUw5IDZMMTIgOU0xMiAxNUw5IDE4TDYgMTUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
            >
              <option value="all">All Snippets</option>
              <option value="favorites">⭐ Favorites Only</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer px-4 py-3 pr-10 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUw5IDZMMTIgOU0xMiAxNUw5IDE4TDYgMTUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-az">Name A-Z</option>
              <option value="name-za">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Recent Snippets */}
        {recentSnippets.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 backdrop-blur-sm rounded-2xl border border-zinc-700/50 shadow-lg">
              <button
                onClick={() => setShowRecentSnippets(!showRecentSnippets)}
                className="cursor-pointer w-full flex items-center justify-between p-6 text-left hover:bg-zinc-700/20 transition-all duration-300 rounded-2xl group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                      Recent Snippets
                    </h2>
                    <p className="text-zinc-400 text-sm">Your latest {recentSnippets.length} snippets</p>
                  </div>
                </div>
                <svg 
                  className={`w-6 h-6 transition-transform duration-300 ${showRecentSnippets ? 'rotate-90' : ''} text-zinc-400 group-hover:text-indigo-400`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            
              <AnimatePresence>
                {showRecentSnippets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6 pt-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentSnippets.map((snippet) => (
                    <motion.div
                      key={snippet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-2xl p-6 border border-zinc-700/50 shadow-2xl shadow-black/20 hover:shadow-indigo-500/10 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 flex-1">
                          {snippet.title}
                        </h3>
                        <button
                          onClick={() => toggleFavorite(snippet)}
                          className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors ml-2 flex-shrink-0 cursor-pointer"
                        >
                          <svg 
                            className={`w-5 h-5 ${snippet.isFavorite ? 'text-yellow-400 fill-current' : 'text-zinc-400'}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                          </svg>
                        </button>
                      </div>
                      
                      {snippet.description && (
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
                          {snippet.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs font-medium rounded-full border border-indigo-500/30">
                          {snippet.language || 'Unknown'}
                        </span>
                        <span className="text-zinc-500 text-xs">
                          {new Date(snippet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startViewing(snippet)}
                          className="cursor-pointer flex-1 px-4 py-2 bg-zinc-700/50 text-zinc-300 rounded-lg hover:bg-zinc-600/50 transition-colors text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => copyToClipboard(snippet.code)}
                          className="cursor-pointer px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                          title="Copy code"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => startEditing(snippet)}
                          className="cursor-pointer px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(snippet)}
                          className="cursor-pointer px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* All Snippets */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 backdrop-blur-sm rounded-2xl border border-zinc-700/50 shadow-lg">
            <button
              onClick={() => setShowAllSnippets(!showAllSnippets)}
              className="cursor-pointer w-full flex items-center justify-between p-6 text-left hover:bg-zinc-700/20 transition-all duration-300 rounded-2xl group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    All Snippets
                  </h2>
                  <p className="text-zinc-400 text-sm">{filteredSnippets.length} snippets total</p>
                </div>
              </div>
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${showAllSnippets ? 'rotate-90' : ''} text-zinc-400 group-hover:text-purple-400`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          
            <AnimatePresence>
              {showAllSnippets && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-6 pt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSnippets.map((snippet) => (
                  <motion.div
                    key={snippet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-2xl p-6 border border-zinc-700/50 shadow-2xl shadow-black/20 hover:shadow-indigo-500/10 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 flex-1">
                        {snippet.title}
                      </h3>
                      <button
                        onClick={() => toggleFavorite(snippet)}
                        className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors ml-2 flex-shrink-0 cursor-pointer"
                      >
                        <svg 
                          className={`w-5 h-5 ${snippet.isFavorite ? 'text-yellow-400 fill-current' : 'text-zinc-400'}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                      </button>
                    </div>
                    
                    {snippet.description && (
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
                        {snippet.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs font-medium rounded-full border border-indigo-500/30">
                        {snippet.language || 'Unknown'}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {new Date(snippet.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startViewing(snippet)}
                        className="cursor-pointer flex-1 px-4 py-2 bg-zinc-700/50 text-zinc-300 rounded-lg hover:bg-zinc-600/50 transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => copyToClipboard(snippet.code)}
                        className="cursor-pointer px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                        title="Copy code"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => startEditing(snippet)}
                        className="cursor-pointer px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(snippet)}
                        className="cursor-pointer px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Empty State */}
        {snippets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No snippets yet</h3>
            <p className="text-zinc-400 mb-6">Create your first code snippet to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-semibold cursor-pointer"
            >
              Create Snippet
            </button>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-700">
                <h2 className="text-2xl font-bold text-white">
                  {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
                </h2>
              </div>
              
              <form onSubmit={editingSnippet ? handleUpdateSnippet : handleCreateSnippet} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-zinc-300 text-sm font-medium mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="Enter snippet title"
                    />
                    {titleError && (
                      <p className="text-red-400 text-sm mt-1">{titleError}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-zinc-300 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                      rows={3}
                      placeholder="Enter snippet description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-zinc-300 text-sm font-medium mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    >
                      <option value="">Select language</option>
                      {PROGRAMMING_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-zinc-300 text-sm font-medium mb-2">
                      Code *
                    </label>
                    <textarea
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono text-sm resize-none"
                      rows={10}
                      placeholder="Enter your code here"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFavorite}
                        onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 bg-zinc-800 border-zinc-700 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <span className="text-zinc-300 text-sm">Mark as favorite</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-8">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-semibold cursor-pointer"
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
                        isFavorite: false
                      })
                    }}
                    className="px-6 py-3 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 transition-all duration-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewingSnippet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl m-3"
            >
              <div className="p-6 border-b border-zinc-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">{viewingSnippet.title}</h2>
                  <button
                    onClick={() => setViewingSnippet(null)}
                    className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                {viewingSnippet.description && (
                  <p className="text-zinc-400 mt-2">{viewingSnippet.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-full">
                    {viewingSnippet.language}
                  </span>
                  <span className="text-zinc-500 text-sm">
                    Created {new Date(viewingSnippet.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700" style={{ maxHeight: '500px', overflowY: 'scroll' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Code</h3>
                    <button
                      onClick={() => handleModalCopy(viewingSnippet.code)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        modalCopyClicked
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50'
                      }`}
                    >
                      {modalCopyClicked ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-zinc-300 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                    {viewingSnippet.code}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (snippetToDelete) {
            handleDeleteSnippet(snippetToDelete.id)
            setShowDeleteConfirm(false)
            setSnippetToDelete(null)
          }
        }}
        snippetTitle={snippetToDelete?.title || ''}
        isPermanent={true}
      />


    </div>
  )
}

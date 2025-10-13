'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type Snippet, type CreateSnippetData } from '../../lib/supabase'
import { Toast, ToastContainer } from './Toast'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { RecycleBinModal } from './RecycleBinModal'
import { ExportModal } from './ExportModal'
import { ImportModal } from './ImportModal'

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
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
          const [searchTerm, setSearchTerm] = useState('')
          const [selectedLanguage, setSelectedLanguage] = useState('')
          const [sortBy, setSortBy] = useState('newest')
          const [showRecentSnippets, setShowRecentSnippets] = useState(true)
          const [showAllSnippets, setShowAllSnippets] = useState(false)
          const [viewingSnippet, setViewingSnippet] = useState<Snippet | null>(null)
          
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
          
          // Check if new schema is available
          const [hasNewSchema, setHasNewSchema] = useState<boolean | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateSnippetData>({
    title: '',
    description: '',
    code: '',
    language: '',
    tags: [],
    is_public: false
  })

  const fetchSnippets = useCallback(async () => {
    if (!user) return
    
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

  useEffect(() => {
    if (user) {
      fetchSnippets()
    }
  }, [user, fetchSnippets])

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
    if (!user) return

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
        is_public: false
      })
      setShowCreateForm(false)
      fetchSnippets()
    } catch (error) {
      console.error('Error creating snippet:', error)
    }
  }

  const handleUpdateSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSnippet) return

    try {
      const { error } = await supabase
        .from('snippets')
        .update(formData)
        .eq('id', editingSnippet.id)

      if (error) throw error

      setEditingSnippet(null)
      setFormData({
        title: '',
        description: '',
        code: '',
        language: '',
        tags: [],
        is_public: false
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

  // Soft delete (move to recycle bin) or hard delete (fallback)
  const handleDeleteSnippet = useCallback(async (id: string) => {
    try {
      // First try soft delete (new schema)
      const { error } = await supabase
        .from('snippets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      // If error (column doesn't exist), try hard delete (old schema)
      if (error && (error.code === '42703' || error.code === 'PGRST204')) {
        console.log('deleted_at column not found, using hard delete')
        setHasNewSchema(false)
        const { error: deleteError } = await supabase
          .from('snippets')
          .delete()
          .eq('id', id)
        
        if (deleteError) throw deleteError
        
        addToast({
          message: 'Snippet moved to recycle bin',
          type: 'info'
        })
      } else if (error) {
        throw error
      } else {
        setHasNewSchema(true)
        addToast({
          message: 'Snippet moved to recycle bin',
          type: 'info'
        })
      }
      
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
    if (!user) return

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

  const startEditing = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setFormData({
      title: snippet.title,
      description: snippet.description || '',
      code: snippet.code,
      language: snippet.language,
      tags: snippet.tags || [],
      is_public: snippet.is_public
    })
    setShowCreateForm(true)
  }

          // Get recent snippets (3 most recent)
          const recentSnippets = [...snippets]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)

          // Filter and sort all snippets
          const filteredSnippets = snippets.filter(snippet => {
            const matchesSearch = snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 snippet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 snippet.code.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesLanguage = !selectedLanguage || snippet.language === selectedLanguage
            return matchesSearch && matchesLanguage
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

          return (
            <div className="min-h-[calc(100vh-5rem)] py-12">
              <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8 mx-5">
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
            border: '1px solid #0f172a'
          }} className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Code Snippets
                </h1>
                <p className="text-gray-300 text-lg">
                  Save, organize, and manage your code snippets
                </p>
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
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5v14m7-7H5"/>
                  </svg>
                  New Snippet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <motion.div 
          className="mb-8 mx-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
            border: '1px solid #0f172a'
          }} className="backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search snippets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pl-12 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 shadow-sm transition-all duration-200"
                    />
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </motion.div>
              </div>
              <div className="flex gap-3">
                {/* Language Filter */}
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-48 px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm"
                  >
                    <option value="">All Languages</option>
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
                
                {/* Sort Filter */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-40 px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 cursor-pointer appearance-none pr-10 shadow-sm"
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

        {/* Recent Snippets Accordion */}
        {recentSnippets.length > 0 && (
          <div className="mb-8 mx-5">
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
              border: '1px solid #0f172a'
            }} className="backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl">
              {/* Accordion Header */}
              <button
                onClick={() => setShowRecentSnippets(!showRecentSnippets)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Recent Snippets
                  </h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {recentSnippets.length} recent
                  </span>
                </div>
                <svg 
                  className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${showRecentSnippets ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {/* Accordion Content */}
              <div className={`transition-all duration-300 overflow-hidden ${showRecentSnippets ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-0">
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {recentSnippets.map((snippet) => {
                  const createdDate = new Date(snippet.created_at)
                  const updatedDate = new Date(snippet.updated_at)
                  const isUpdated = updatedDate.getTime() - createdDate.getTime() > 1000
                  
                  return (
                    <motion.div
                      key={snippet.id}
                      className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-600/60 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden hover:border-blue-300/50 h-full flex flex-col"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Header Section with Beautiful Partition */}
                      <div className="relative p-3 border-b border-gray-600/50">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-2xl"></div>
                        <div className="ml-4">
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate" title={snippet.title}>
                            {snippet.title.length > 20 ? snippet.title.substring(0, 20) + '...' : snippet.title}
                          </h3>
                          
                          {snippet.description && (
                            <>
                              <div className="h-px bg-gradient-to-r from-gray-600/40 to-transparent my-2"></div>
                              <p className="text-gray-300 text-sm leading-relaxed" title={snippet.description}>
                                {snippet.description.length > 50 ? snippet.description.substring(0, 50) + '...' : snippet.description}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Language and Tags Section */}
                      <div className="px-3 py-1.5 bg-gray-900/30 border-b border-gray-600/30">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            {snippet.language}
                          </span>
                          {snippet.is_public && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              Public
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Code Section */}
                      <div className="p-4 flex-1">
                        <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-700/50 h-full">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Code Preview</span>
                            <span className="text-xs text-gray-500">{snippet.code.split('\n').length} lines</span>
                          </div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-hidden font-mono leading-relaxed max-h-32">
                            <code>{snippet.code}</code>
                          </pre>
                        </div>
                      </div>

                      {/* Action Icons Section */}
                      <div className="px-3 pb-3">
                        <div className="flex justify-center gap-2 p-2 bg-gray-900/40 border border-gray-700/50 rounded-xl">
                          <motion.button
                            onClick={() => setViewingSnippet(snippet)}
                            className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all duration-300 cursor-pointer group/view border border-transparent hover:border-blue-500/30"
                            title="View Snippet"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg className="w-5 h-5 group-hover/view:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </motion.button>
                          <motion.button
                            onClick={() => handleCopySnippet(snippet.code, snippet.id)}
                            className={`p-2.5 rounded-lg transition-all duration-300 cursor-pointer group/copy border ${
                              copiedSnippetId === snippet.id
                                ? 'text-green-500 bg-green-500/10 border-green-500/30'
                                : 'text-gray-400 hover:text-green-500 hover:bg-green-500/10 border-transparent hover:border-green-500/30'
                            }`}
                            title="Copy Code"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {copiedSnippetId === snippet.id ? (
                              <svg className="w-5 h-5 group-hover/copy:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 group-hover/copy:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                              </svg>
                            )}
                          </motion.button>
                          <motion.button
                            onClick={() => startEditing(snippet)}
                            className="p-2.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all duration-300 cursor-pointer group/edit border border-transparent hover:border-yellow-500/30"
                            title="Edit Snippet"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg className="w-5 h-5 group-hover/edit:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteClick(snippet)}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-300 cursor-pointer group/delete border border-transparent hover:border-red-500/30"
                            title="Delete Snippet"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg className="w-5 h-5 group-hover/delete:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </motion.button>
                        </div>
                      </div>

                      {/* Footer Section */}
                      <div className="px-3 py-2 bg-gray-900/50 border-t border-gray-600/50">
                        <div className="text-xs text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z"/>
                              <path d="M12 6V18M6 12H18"/>
                            </svg>
                            <span>Created {createdDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {isUpdated && (
                            <div className="flex items-center gap-1.5 mt-1 text-blue-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21Z"/>
                              </svg>
                              <span>Updated {updatedDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Snippets Accordion */}
        <div className="mb-8 mx-5">
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid #0f172a'
          }} className="backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl">
            {/* Accordion Header */}
            <button
              onClick={() => setShowAllSnippets(!showAllSnippets)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  All Snippets
                </h2>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                  {filteredSnippets.length} total
                </span>
              </div>
              <svg 
                className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${showAllSnippets ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {/* Accordion Content */}
            <div className={`transition-all duration-300 overflow-hidden ${showAllSnippets ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 pt-0">
                {filteredSnippets.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredSnippets.map((snippet) => {
            const createdDate = new Date(snippet.created_at)
            const updatedDate = new Date(snippet.updated_at)
            // Check if updated time is more than 1 second after created time (more accurate than exact equality)
            const isUpdated = updatedDate.getTime() - createdDate.getTime() > 1000
            
            return (
              <motion.div
                key={snippet.id}
                className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-600/60 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden hover:border-blue-300/50 h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Header Section with Beautiful Partition */}
                <div className="relative p-3 border-b border-gray-600/50">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-2xl"></div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate" title={snippet.title}>
                      {snippet.title.length > 20 ? snippet.title.substring(0, 20) + '...' : snippet.title}
                    </h3>
                    
                    {snippet.description && (
                      <>
                        <div className="h-px bg-gradient-to-r from-gray-600/40 to-transparent my-2"></div>
                        <p className="text-gray-300 text-sm leading-relaxed" title={snippet.description}>
                          {snippet.description.length > 50 ? snippet.description.substring(0, 50) + '...' : snippet.description}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Language and Tags Section */}
                <div className="px-3 py-1.5 bg-gray-900/30 border-b border-gray-600/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      {snippet.language}
                    </span>
                    {snippet.is_public && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Public
                      </span>
                    )}
                  </div>
                </div>

                {/* Code Section */}
                <div className="p-4 flex-1">
                  <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-700/50 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Code Preview</span>
                      <span className="text-xs text-gray-500">{snippet.code.split('\n').length} lines</span>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-hidden font-mono leading-relaxed max-h-32">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                </div>

                {/* Tags Section */}
                {snippet.tags && snippet.tags.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {snippet.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.5 2C6.5 2 2 6.5 2 12.5S6.5 23 12.5 23 23 18.5 23 12.5 18.5 2 12.5 2M12.5 20C8.4 20 5 16.6 5 12.5S8.4 5 12.5 5 20 8.4 20 12.5 16.6 20 12.5 20M12.5 8C10.6 8 9 9.6 9 11.5S10.6 15 12.5 15 16 13.4 16 11.5 14.4 8 12.5 8Z"/>
                          </svg>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Icons Section */}
                <div className="px-3 pb-3">
                  <div className="flex justify-center gap-2 p-2 bg-gray-900/40 border border-gray-700/50 rounded-xl">
                    <motion.button
                      onClick={() => setViewingSnippet(snippet)}
                      className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all duration-300 cursor-pointer group/view border border-transparent hover:border-blue-500/30"
                      title="View Snippet"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5 group-hover/view:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => handleCopySnippet(snippet.code, snippet.id)}
                      className={`p-2.5 rounded-lg transition-all duration-300 cursor-pointer group/copy border ${
                        copiedSnippetId === snippet.id
                          ? 'text-green-500 bg-green-500/10 border-green-500/30'
                          : 'text-gray-400 hover:text-green-500 hover:bg-green-500/10 border-transparent hover:border-green-500/30'
                      }`}
                      title="Copy Code"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {copiedSnippetId === snippet.id ? (
                        <svg className="w-5 h-5 group-hover/copy:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 group-hover/copy:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => startEditing(snippet)}
                      className="p-2.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all duration-300 cursor-pointer group/edit border border-transparent hover:border-yellow-500/30"
                      title="Edit Snippet"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5 group-hover/edit:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteClick(snippet)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-300 cursor-pointer group/delete border border-transparent hover:border-red-500/30"
                      title="Delete Snippet"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5 group-hover/delete:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="px-3 py-2 bg-gray-900/50 border-t border-gray-600/50">
                  <div className="text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z"/>
                        <path d="M12 6V18M6 12H18"/>
                      </svg>
                      <span>Created {createdDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    {isUpdated && (
                      <div className="flex items-center gap-1.5 mt-1 text-blue-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21Z"/>
                        </svg>
                        <span>Updated {updatedDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    )}
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
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
              className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold text-white mb-2 break-words">{viewingSnippet.title}</h2>
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
              <div className="mb-6">
                <p className="text-gray-300 text-lg leading-relaxed break-words">{viewingSnippet.description}</p>
              </div>
            )}

            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
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
              <pre className="text-gray-300 text-sm leading-relaxed overflow-x-auto">
                <code>{viewingSnippet.code}</code>
              </pre>
            </div>

            {viewingSnippet.tags && viewingSnippet.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
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
                    is_public: false
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
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 shadow-sm transition-all duration-200"
                    placeholder="Enter snippet title"
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
                      is_public: false
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

      {/* Recycle Bin Modal */}
      <RecycleBinModal
        isOpen={showRecycleBin}
        onClose={() => setShowRecycleBin(false)}
        onRestore={handleRestoreSnippet}
        onPermanentDelete={handlePermanentDelete}
        userId={user.id}
        onShowToast={(message, type) => addToast({ message, type })}
      />
    </div>
  )
}

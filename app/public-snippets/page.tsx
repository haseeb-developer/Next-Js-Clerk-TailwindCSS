'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ToastContainer } from '../components/Toast'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import Link from 'next/link'

interface PublicSnippet {
  id: string
  title: string
  description?: string
  code: string
  language: string
  tags?: string[]
  is_public: boolean
  is_favorite: boolean
  created_at: string
  updated_at: string
  user_id: string
  folder_id?: string | null
  category_id?: string | null
  // User attribution
  user_name?: string
  user_id_number?: number
  user_email?: string
}

const PROGRAMMING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SCSS', 'SQL', 'Bash', 'PowerShell', 'JSON',
  'YAML', 'XML', 'Markdown', 'Vue', 'React', 'Angular', 'Node.js', 'Express', 'Next.js',
  'Liquid', 'GraphQL', 'Dockerfile', 'Shell', 'Zsh', 'Fish', 'Vim', 'Emacs', 'Makefile'
]

export default function PublicSnippetsPage() {
  const [snippets, setSnippets] = useState<PublicSnippet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewingSnippet, setViewingSnippet] = useState<PublicSnippet | null>(null)
  const [modalCopyClicked, setModalCopyClicked] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([])
  const [totalUsers, setTotalUsers] = useState<number>(0)

  // Lock body scroll when modal is open
  useBodyScrollLock(viewingSnippet !== null)

  // Fetch total users count
  const fetchTotalUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/total-users')
      if (response.ok) {
        const data = await response.json()
        setTotalUsers(data.totalUsers || 0)
      }
    } catch (error) {
      console.error('Error fetching total users:', error)
    }
  }, [])

  // Fetch public snippets
  const fetchPublicSnippets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public-snippets')
      
      if (!response.ok) {
        throw new Error('Failed to fetch public snippets')
      }
      
      const data = await response.json()
      setSnippets(data.snippets || [])
    } catch (error) {
      console.error('Error fetching public snippets:', error)
      addToast({
        message: 'Failed to load public snippets',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Load snippets and total users on mount
  useEffect(() => {
    fetchPublicSnippets()
    fetchTotalUsers()
  }, [fetchPublicSnippets, fetchTotalUsers])

  // Toast management
  const addToast = useCallback((toast: { message: string; type: 'success' | 'error' | 'info' }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

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

  // Handle copy snippet
  const handleCopySnippet = async (snippet: PublicSnippet) => {
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

  // Handle view snippet
  const handleViewSnippet = (snippet: PublicSnippet) => {
    setViewingSnippet(snippet)
    setModalCopyClicked(false)
  }

  // Filter and sort snippets
  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading public snippets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '100%' }}>
        {/* Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent mb-4">
                Public Code Snippets
              </h1>
              <p className="text-gray-300 text-xl md:text-2xl mb-6 max-w-3xl mx-auto leading-relaxed">
                Discover, share, and learn from amazing code snippets created by developers worldwide
              </p>
              {totalUsers > 0 && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full border border-indigo-500/30">
                    <span className="text-indigo-300 text-sm font-semibold">
                      Total users: <span className="text-white font-bold">{totalUsers}</span>
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-semibold">
                    {filteredSnippets.length} public snippet{filteredSnippets.length !== 1 ? 's' : ''} available
                  </span>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-lg font-semibold">Free to browse</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/sign-in"
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transform hover:scale-105"
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </span>
            </Link>
            <Link
              href="/sign-up"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold text-lg shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transform hover:scale-105"
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search snippets by title, description, code, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-6 py-4 pl-14 bg-gray-800/60 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 group-hover:border-gray-500/50"
                  />
                  <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Custom Language Dropdown */}
                <div className="relative group">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="appearance-none px-6 py-4 pr-12 bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-indigo-500/50 hover:from-gray-700/60 hover:to-gray-800/60 min-w-[180px] cursor-pointer shadow-lg hover:shadow-xl hover:shadow-indigo-500/10"
                  >
                    <option value="">All Languages</option>
                    {PROGRAMMING_LANGUAGES.map(lang => (
                      <option key={lang} value={lang} className="bg-gray-800 text-white">{lang}</option>
                    ))}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg 
                      className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 group-focus-within:text-indigo-400 transition-colors duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Custom Sort Dropdown */}
                <div className="relative group">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none px-6 py-4 pr-12 bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-indigo-500/50 hover:from-gray-700/60 hover:to-gray-800/60 min-w-[160px] cursor-pointer shadow-lg hover:shadow-xl hover:shadow-indigo-500/10"
                  >
                    <option value="newest" className="bg-gray-800 text-white">Newest First</option>
                    <option value="oldest" className="bg-gray-800 text-white">Oldest First</option>
                    <option value="name-az" className="bg-gray-800 text-white">Name A-Z</option>
                    <option value="name-za" className="bg-gray-800 text-white">Name Z-A</option>
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg 
                      className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 group-focus-within:text-indigo-400 transition-colors duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Snippets Grid */}
        {filteredSnippets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSnippets.map((snippet, index) => (
              <motion.div
                key={snippet.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-600/30 p-6 hover:from-gray-700/60 hover:to-gray-800/60 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
                onClick={() => handleViewSnippet(snippet)}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 flex-1 leading-tight break-words" title={snippet.title}>
                          {snippet.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                          <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30 backdrop-blur-sm">
                            Public
                          </span>
                        </div>
                      </div>
                      
                      {snippet.description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed group-hover:text-gray-200 transition-colors break-words" title={snippet.description}>
                          {snippet.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Code preview */}
                  <div className="bg-gray-900/50 rounded-xl p-3 mb-4 border border-gray-700/50 group-hover:border-gray-600/50 transition-colors overflow-hidden">
                    <pre className="text-gray-400 text-xs leading-relaxed line-clamp-3 font-mono whitespace-pre-wrap break-words">
                      <code className="block">{snippet.code}</code>
                    </pre>
                  </div>

                  {/* Tags and metadata */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
                        {snippet.language}
                      </span>
                      {snippet.tags && snippet.tags.length > 0 && (
                        <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                          {snippet.tags.length} tag{snippet.tags.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs font-medium">
                      {new Date(snippet.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  {/* User Attribution */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {snippet.user_name?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <Link 
                      href={`/${snippet.user_id_number || '1'}/public-snippets`}
                      className="font-medium hover:text-indigo-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      by {snippet.user_name}
                    </Link>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewSnippet(snippet)
                      }}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 rounded-xl hover:from-indigo-600/30 hover:to-purple-600/30 transition-all duration-300 text-sm font-semibold border border-indigo-500/30 group-hover:border-indigo-400/50 cursor-pointer"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopySnippet(snippet)
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-400 rounded-xl hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-300 text-sm font-semibold border border-green-500/30 group-hover:border-green-400/50 cursor-pointer"
                      title="Copy code"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.636M15 6.343A7.962 7.962 0 0112 5c-2.34 0-4.29 1.009-5.824 2.636" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {searchTerm || selectedLanguage ? 'No snippets found' : 'No public snippets yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedLanguage 
                ? 'Try adjusting your search terms or filters' 
                : 'Be the first to share a public snippet!'
              }
            </p>
          </div>
        )}
      </div>

      {/* Toast Container */}
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
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Public
                    </span>
                    {viewingSnippet.user_name && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                        by {viewingSnippet.user_name}
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
    </div>
  )
}

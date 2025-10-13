'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Snippet } from '@/lib/supabase'

interface RecycleBinModalProps {
  isOpen: boolean
  onClose: () => void
  onRestore: (snippetId: string) => Promise<void>
  onPermanentDelete: (snippetId: string) => Promise<void>
  userId: string
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
}

interface DeletedSnippet extends Snippet {
  deleted_at: string
}

export function RecycleBinModal({
  isOpen,
  onClose,
  onRestore,
  onPermanentDelete,
  userId,
  onShowToast
}: RecycleBinModalProps) {
  const [deletedSnippets, setDeletedSnippets] = useState<DeletedSnippet[]>([])
  const [selectedSnippets, setSelectedSnippets] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [snippetToDelete, setSnippetToDelete] = useState<DeletedSnippet | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDeletedSnippets()
    }
  }, [isOpen, userId])

  const fetchDeletedSnippets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/snippets/deleted')
      if (response.ok) {
        const data = await response.json()
        setDeletedSnippets(data)
      }
    } catch (error) {
      console.error('Error fetching deleted snippets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedSnippets.size === deletedSnippets.length) {
      setSelectedSnippets(new Set())
    } else {
      setSelectedSnippets(new Set(deletedSnippets.map(s => s.id)))
    }
  }

  const handleSelectSnippet = (snippetId: string) => {
    const newSelected = new Set(selectedSnippets)
    if (newSelected.has(snippetId)) {
      newSelected.delete(snippetId)
    } else {
      newSelected.add(snippetId)
    }
    setSelectedSnippets(newSelected)
  }

  const handleRestoreSelected = async () => {
    try {
      for (const snippetId of selectedSnippets) {
        await onRestore(snippetId)
      }
      setSelectedSnippets(new Set())
      fetchDeletedSnippets()
      onShowToast(`Restored ${selectedSnippets.size} snippet(s)`, 'success')
    } catch {
      onShowToast('Failed to restore snippets', 'error')
    }
  }

  const handleClearAll = async () => {
    try {
      for (const snippet of deletedSnippets) {
        await onPermanentDelete(snippet.id)
      }
      setDeletedSnippets([])
      setSelectedSnippets(new Set())
      onShowToast(`Permanently deleted ${deletedSnippets.length} snippet(s)`, 'success')
    } catch {
      onShowToast('Failed to clear all snippets', 'error')
    }
  }

  const handleRestoreSingle = async (snippetId: string) => {
    try {
      await onRestore(snippetId)
      fetchDeletedSnippets()
      onShowToast('Snippet restored successfully', 'success')
    } catch {
      onShowToast('Failed to restore snippet', 'error')
    }
  }

  const handleDeleteSingle = async (snippetId: string) => {
    try {
      await onPermanentDelete(snippetId)
      fetchDeletedSnippets()
      onShowToast('Snippet permanently deleted', 'success')
    } catch {
      onShowToast('Failed to delete snippet', 'error')
    }
  }

  const handleDeleteClick = (snippet: DeletedSnippet) => {
    setSnippetToDelete(snippet)
    setShowDeleteConfirm(true)
  }

  const handleClearAllClick = () => {
    setShowClearAllConfirm(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
            className="backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
        
        {/* Header */}
        <div className="p-6 border-b border-gray-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Recycle Bin</h2>
                <p className="text-gray-400 text-sm">
                  Deleted snippets are kept here for 30 days. You can restore them or permanently delete them.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        {deletedSnippets.length > 0 && (
          <div className="p-6 border-b border-gray-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    selectedSnippets.size === deletedSnippets.length
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Select All
                </button>
                
                {selectedSnippets.size > 0 && (
                  <button
                    onClick={handleRestoreSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                    </svg>
                    Restore Selected ({selectedSnippets.size})
                  </button>
                )}
              </div>
              
              <button
                onClick={handleClearAllClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 cursor-pointer hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading deleted snippets...</div>
            </div>
          ) : deletedSnippets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Recycle Bin is Empty</h3>
              <p className="text-gray-400">No deleted snippets found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSnippets.has(snippet.id)}
                    onChange={() => handleSelectSnippet(snippet.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{snippet.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded border border-blue-200">
                        {snippet.language}
                      </span>
                      <span className="text-gray-400 text-xs">
                        Deleted: {new Date(snippet.deleted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestoreSingle(snippet.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-all duration-300 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                      </svg>
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteClick(snippet)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all duration-300 cursor-pointer hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Confirmation Modal */}
        {showClearAllConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              border: '1px solid #0f172a'
            }} className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Clear All Snippets</h2>
                    <p className="text-gray-400 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Are you sure you want to permanently delete all {deletedSnippets.length} snippet(s) in the recycle bin? This action cannot be undone and all snippets will be lost forever.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-all duration-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleClearAll()
                    setShowClearAllConfirm(false)
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 font-semibold cursor-pointer"
                >
                  Delete All Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Single Delete Confirmation Modal */}
        {showDeleteConfirm && snippetToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              border: '1px solid #0f172a'
            }} className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Permanent Delete</h2>
                    <p className="text-gray-400 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Are you sure you want to permanently delete &quot;{snippetToDelete.title}&quot;? This action cannot be undone and the snippet will be lost forever.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-all duration-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteSingle(snippetToDelete.id)
                    setShowDeleteConfirm(false)
                    setSnippetToDelete(null)
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 font-semibold cursor-pointer"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { Snippet } from '@/lib/supabase'

interface ComprehensiveRecycleBinModalProps {
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

interface DeletedFolder {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  created_at: string
  updated_at: string
  deleted_at: string
  snippet_count: number
}

interface DeletedCategory {
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
  deleted_at: string
  snippet_count: number
}

interface RecycleBinData {
  snippets: DeletedSnippet[]
  folders: DeletedFolder[]
  categories: DeletedCategory[]
}

export function ComprehensiveRecycleBinModal({
  isOpen,
  onClose,
  onRestore,
  onPermanentDelete,
  userId,
  onShowToast
}: ComprehensiveRecycleBinModalProps) {
  const [recycleBinData, setRecycleBinData] = useState<RecycleBinData>({
    snippets: [],
    folders: [],
    categories: []
  })
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'snippets' | 'folders' | 'categories'>('all')
  
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: string, id: string, name: string} | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRecycleBinData()
    }
  }, [isOpen, userId])

  const fetchRecycleBinData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recycle-bin')
      if (response.ok) {
        const data = await response.json()
        setRecycleBinData(data)
      }
    } catch (error) {
      console.error('Error fetching recycle bin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAllItems = () => {
    return [
      ...recycleBinData.snippets.map(s => ({ ...s, type: 'snippet' as const })),
      ...recycleBinData.folders.map(f => ({ ...f, type: 'folder' as const })),
      ...recycleBinData.categories.map(c => ({ ...c, type: 'category' as const }))
    ]
  }

  const getFilteredItems = () => {
    const allItems = getAllItems()
    if (activeTab === 'all') return allItems
    return allItems.filter(item => item.type === activeTab.slice(0, -1)) // Remove 's' from end
  }

  const handleSelectAll = () => {
    const filteredItems = getFilteredItems()
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => `${item.type}-${item.id}`)))
    }
  }

  const handleSelectItem = (itemId: string, itemType: string) => {
    const key = `${itemType}-${itemId}`
    const newSelected = new Set(selectedItems)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedItems(newSelected)
  }

  const handleRestoreItem = async (itemId: string, itemType: string) => {
    try {
      const response = await fetch('/api/recycle-bin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: itemType, id: itemId })
      })

      if (response.ok) {
        onShowToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} restored successfully`, 'success')
        fetchRecycleBinData()
      } else {
        onShowToast(`Failed to restore ${itemType}`, 'error')
      }
    } catch (error) {
      onShowToast(`Failed to restore ${itemType}`, 'error')
    }
  }

  const handlePermanentDeleteItem = async (itemId: string, itemType: string) => {
    try {
      const response = await fetch('/api/recycle-bin/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: itemType, id: itemId })
      })

      if (response.ok) {
        onShowToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} permanently deleted`, 'success')
        fetchRecycleBinData()
      } else {
        onShowToast(`Failed to permanently delete ${itemType}`, 'error')
      }
    } catch (error) {
      onShowToast(`Failed to permanently delete ${itemType}`, 'error')
    }
  }

  const handleRestoreSelected = async () => {
    try {
      const restorePromises = Array.from(selectedItems).map(async (key) => {
        const [itemType, itemId] = key.split('-')
        return handleRestoreItem(itemId, itemType)
      })

      await Promise.all(restorePromises)
      setSelectedItems(new Set())
      fetchRecycleBinData()
      onShowToast(`Restored ${selectedItems.size} item(s)`, 'success')
    } catch {
      onShowToast('Failed to restore selected items', 'error')
    }
  }

  const handleClearAll = async () => {
    try {
      const allItems = getAllItems()
      const deletePromises = allItems.map(item => 
        handlePermanentDeleteItem(item.id, item.type)
      )

      await Promise.all(deletePromises)
      setSelectedItems(new Set())
      onShowToast(`Permanently deleted ${allItems.length} item(s)`, 'success')
    } catch {
      onShowToast('Failed to clear all items', 'error')
    }
  }

  const handleDeleteClick = (item: DeletedSnippet | DeletedFolder | DeletedCategory, itemType: string) => {
    setItemToDelete({ type: itemType, id: item.id, name: 'title' in item ? item.title : item.name })
    setShowDeleteConfirm(true)
  }

  const getTotalItems = () => {
    return recycleBinData.snippets.length + recycleBinData.folders.length + recycleBinData.categories.length
  }

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'snippets': return recycleBinData.snippets.length
      case 'folders': return recycleBinData.folders.length
      case 'categories': return recycleBinData.categories.length
      default: return getTotalItems()
    }
  }

  const renderItem = (item: DeletedSnippet | DeletedFolder | DeletedCategory, itemType: string) => {
    const key = `${itemType}-${item.id}`
    const isSelected = selectedItems.has(key)

    return (
      <div
        key={key}
        className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleSelectItem(item.id, itemType)}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Icon based on type */}
            {itemType === 'snippet' && (
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
              </div>
            )}
            {itemType === 'folder' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${(item as DeletedFolder).color}20` }}>
                <svg className="w-4 h-4" style={{ color: (item as DeletedFolder).color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </div>
            )}
            {itemType === 'category' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${(item as DeletedCategory).color}20` }}>
                <svg className="w-4 h-4" style={{ color: (item as DeletedCategory).color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
            )}
            
            <h3 className="text-white font-medium truncate">
              {'title' in item ? item.title : item.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs font-medium rounded border ${
              itemType === 'snippet' ? 'bg-blue-100 text-blue-700 border-blue-200' :
              itemType === 'folder' ? 'bg-purple-100 text-purple-700 border-purple-200' :
              'bg-green-100 text-green-700 border-green-200'
            }`}>
              {itemType === 'snippet' && (item as DeletedSnippet).language}
              {itemType === 'folder' && `${(item as DeletedFolder).snippet_count} snippet${(item as DeletedFolder).snippet_count !== 1 ? 's' : ''}`}
              {itemType === 'category' && `${(item as DeletedCategory).snippet_count} snippet${(item as DeletedCategory).snippet_count !== 1 ? 's' : ''}`}
            </span>
            <span className="text-gray-400 text-xs">
              Deleted: {new Date(item.deleted_at).toLocaleDateString('en-US', {
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
            onClick={() => handleRestoreItem(item.id, itemType)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-all duration-300 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
            Restore
          </button>
          <button
            onClick={() => handleDeleteClick(item, itemType)}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    )
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
            className="backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
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
                  Deleted items are kept here for 30 days. You can restore them or permanently delete them.
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

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-600/50">
          <div className="flex gap-4">
            {[
              { key: 'all', label: 'All Items', icon: '🗑️' },
              { key: 'snippets', label: 'Snippets', icon: '💻' },
              { key: 'folders', label: 'Folders', icon: '📁' },
              { key: 'categories', label: 'Categories', icon: '🏷️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'all' | 'snippets' | 'folders' | 'categories')}
                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="px-2 py-1 bg-gray-700/50 text-xs rounded-full">
                  {getTabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {getFilteredItems().length > 0 && (
          <div className="p-6 border-b border-gray-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    selectedItems.size === getFilteredItems().length
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Select All
                </button>
                
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleRestoreSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                    </svg>
                    Restore Selected ({selectedItems.size})
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowClearAllConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 cursor-pointer hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto modal-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading deleted items...</div>
            </div>
          ) : getFilteredItems().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Recycle Bin is Empty</h3>
              <p className="text-gray-400">No deleted items found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredItems().map((item) => renderItem(item, item.type))}
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
                    <h2 className="text-2xl font-bold text-white">Clear All Items</h2>
                    <p className="text-gray-400 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Are you sure you want to permanently delete all {getTotalItems()} item(s) in the recycle bin? This action cannot be undone and all items will be lost forever.
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
        {showDeleteConfirm && itemToDelete && (
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
                  Are you sure you want to permanently delete &quot;{itemToDelete.name}&quot;? This action cannot be undone and the {itemToDelete.type} will be lost forever.
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
                    handlePermanentDeleteItem(itemToDelete.id, itemToDelete.type)
                    setShowDeleteConfirm(false)
                    setItemToDelete(null)
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

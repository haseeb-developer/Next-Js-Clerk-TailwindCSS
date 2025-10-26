'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import toast from 'react-hot-toast'

interface MediaRecycleBinModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onRefresh: () => void
}

interface DeletedMediaFile {
  id: string
  user_id: string
  file_name: string
  title?: string
  file_type: string
  file_url: string
  file_size: number
  media_folder_id: string | null
  created_at: string
  deleted_at: string
}

interface DeletedMediaFolder {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  deleted_at: string
}

export function MediaRecycleBinModal({
  isOpen,
  onClose,
  userId,
  onRefresh
}: MediaRecycleBinModalProps) {
  const [mediaFiles, setMediaFiles] = useState<DeletedMediaFile[]>([])
  const [folders, setFolders] = useState<DeletedMediaFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'folders'>('images')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      fetchRecycleBinData()
      
      // Disable right-click when modal is open
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
        
        // Console warning
        console.clear()
        console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 50px; font-weight: bold;')
        console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 50px; font-weight: bold;')
        console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 50px; font-weight: bold;')
        console.log('%cHEY HEY HEY!', 'color: yellow; font-size: 30px; font-weight: bold;')
        console.log('%cWhat are you trying to do?', 'color: yellow; font-size: 20px;')
        console.log('%cThis is a restricted area!', 'color: red; font-size: 25px; font-weight: bold;')
        console.log('%cStay away from the recycle bin!', 'color: orange; font-size: 20px;')
        console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 50px; font-weight: bold;')
        console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 50px; font-weight: bold;')
        console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 50px; font-weight: bold;')
        console.log('%c🚫 Unauthorized access detected!', 'color: red; font-size: 20px; font-weight: bold;')
        console.log('%c🚫 Unauthorized access detected!', 'color: red; font-size: 20px; font-weight: bold;')
        console.log('%c🚫 Unauthorized access detected!', 'color: red; font-size: 20px; font-weight: bold;')
      }
      
      document.addEventListener('contextmenu', handleContextMenu)
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [isOpen, userId])

  const fetchRecycleBinData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recycle-bin')
      
      if (!response.ok) {
        console.error('Failed to fetch recycle bin data:', response.status, response.statusText)
        toast.error('Failed to load recycle bin')
        return
      }
      
      const data = await response.json()
      console.log('Recycle bin data:', data) // Debug log
      console.log('Media files count:', (data.media || []).length)
      console.log('Folders count:', (data.mediaFolders || []).length)
      
      setMediaFiles(data.media || [])
      setFolders(data.mediaFolders || [])
    } catch (error) {
      console.error('Error fetching recycle bin data:', error)
      toast.error('Failed to load recycle bin')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (itemId: string, type: 'media' | 'mediaFolder') => {
    try {
      const response = await fetch('/api/recycle-bin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: itemId })
      })

      if (response.ok) {
        toast.success(`${type === 'media' ? 'Media' : 'Folder'} restored successfully`)
        fetchRecycleBinData()
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to restore')
      }
    } catch (error) {
      console.error('Restore error:', error)
      toast.error('Failed to restore item')
    }
  }

  const handleDelete = async (itemId: string, type: 'media' | 'mediaFolder') => {
    try {
      const response = await fetch('/api/recycle-bin/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: itemId })
      })

      if (response.ok) {
        toast.success(`${type === 'media' ? 'Media' : 'Folder'} permanently deleted`)
        fetchRecycleBinData()
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete item')
    }
  }

  const filteredMedia = mediaFiles.filter(file => {
    // Handle both "image" and "image/png" formats
    const fileType = file.file_type.toLowerCase()
    const isImage = fileType.startsWith('image') || fileType === 'image'
    const isVideo = fileType.startsWith('video') || fileType === 'video'
    
    if (activeTab === 'images') return isImage
    if (activeTab === 'videos') return isVideo
    return false
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full h-full flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Media Recycle Bin</h2>
                  <p className="text-sm text-gray-400">Restore or permanently delete media</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-slate-700">
              {(['images', 'videos', 'folders'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'folders' && (
                    <div className="space-y-3">
                      {folders.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No deleted folders</div>
                      ) : (
                        folders.map(folder => (
                          <div
                            key={folder.id}
                            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${folder.color}20` }}
                              >
                                <svg className="w-5 h-5" style={{ color: folder.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{folder.name}</h3>
                                <p className="text-sm text-gray-400">
                                  Deleted: {new Date(folder.deleted_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRestore(folder.id, 'mediaFolder')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handleDelete(folder.id, 'mediaFolder')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {(activeTab === 'images' || activeTab === 'videos') && (
                    <div className="space-y-3">
                      {filteredMedia.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          No deleted {activeTab === 'images' ? 'images' : 'videos'}
                        </div>
                      ) : (
                                                 filteredMedia.map(file => {
                           const fileType = file.file_type.toLowerCase()
                           const isImage = fileType.startsWith('image')
                           const isVideo = fileType.startsWith('video')
                           
                           return (
                             <div
                               key={file.id}
                               className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                             >
                                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                 {isImage ? (
                                   <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                                     <img 
                                       src={file.file_url} 
                                       alt={file.file_name}
                                       className="w-full h-full object-cover"
                                     />
                                   </div>
                                 ) : isVideo ? (
                                   <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0 group">
                                     <video 
                                       src={file.file_url}
                                       className="w-full h-full object-cover"
                                       muted
                                       playsInline
                                       onMouseEnter={(e) => e.currentTarget.play()}
                                       onMouseLeave={(e) => e.currentTarget.pause()}
                                     />
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                       <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                         <path d="M8 5v14l11-7z"/>
                                       </svg>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                     </svg>
                                   </div>
                                 )}
                                 <div className="flex-1 min-w-0">
                                   <h3 className="text-white font-medium truncate">{file.file_name}</h3>
                                   <p className="text-sm text-gray-400">
                                     Deleted: {new Date(file.deleted_at).toLocaleDateString()}
                                   </p>
                                 </div>
                               </div>
                               <div className="flex gap-2 ml-4">
                                 <button
                                   onClick={() => handleRestore(file.id, 'media')}
                                   className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                                 >
                                   Restore
                                 </button>
                                 <button
                                   onClick={() => handleDelete(file.id, 'media')}
                                   className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                                 >
                                   Delete
                                 </button>
                               </div>
                             </div>
                           )
                         })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

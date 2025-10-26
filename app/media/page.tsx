'use client'

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, MediaFile, MediaFolder, Category } from '@/lib/supabase'
import toast from 'react-hot-toast'
import CreateMediaFolderModal from '@/app/components/CreateMediaFolderModal'
import CreateMediaModal from '@/app/components/CreateMediaModal'
import MediaViewerModal from '@/app/components/MediaViewerModal'
import { MediaRecycleBinModal } from '@/app/components/MediaRecycleBinModal'
import ConfirmDeleteModal from '@/app/components/ConfirmDeleteModal'
import { DeleteMediaFolderModal } from '@/app/components/DeleteMediaFolderModal'
import MediaIcon from '@/app/components/MediaIcon'

type MediaFilter = 'all' | 'images' | 'videos' | 'favorites'
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc'

function MediaPageContent() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<MediaFolder[]>([])
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateMedia, setShowCreateMedia] = useState(false)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [editingFolder, setEditingFolder] = useState<MediaFolder | null>(null)
  const [viewingMedia, setViewingMedia] = useState<MediaFile | null>(null)
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<MediaFolder | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ open: boolean; type: 'media' | 'folder' | null; item: MediaFile | MediaFolder | null }>({ open: false, type: null, item: null })
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'tag' | null>(null)
  const [verifying, setVerifying] = useState(true)
  
  // Session timeout state
  const [sessionTimeout, setSessionTimeout] = useState(5 * 60 * 1000) // 5 minutes default
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeout)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const [isActive, setIsActive] = useState(true)

  // Memoize hasMediaPin to prevent dependency array issues 
  const hasMediaPin = useMemo(() => {
    if (!user) return false
    const metadata = user.unsafeMetadata as { mediaPin?: unknown }
    return !!metadata.mediaPin
  }, [user?.unsafeMetadata])

  // Fetch all media files
  const fetchMediaFiles = useCallback(async () => {
    if (!user?.id) return []

    try {
      let query = supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (selectedFolderId) {
        query = query.eq('media_folder_id', selectedFolderId)
      } else {
        query = query.is('media_folder_id', null)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setMediaFiles(data || [])
      return data || []
    } catch (error) {
      console.error('Error fetching media files:', error)
      toast.error('Failed to load media files')
      return []
    } finally {
      setLoading(false)
    }
  }, [user?.id, selectedFolderId])

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!user?.id) return

    try {
      let query = supabase
        .from('media_folders')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (selectedFolderId) {
        query = query.eq('parent_id', selectedFolderId)
      } else {
        query = query.is('parent_id', null)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
      toast.error('Failed to load folders')
    }
  }, [user?.id, selectedFolderId])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [user?.id])

  // Fetch breadcrumb path
  const fetchBreadcrumbPath = useCallback(async () => {
    if (!selectedFolderId || !user?.id) {
      setCurrentPath([])
      return
    }

    const path: MediaFolder[] = []
    let currentId: string | null = selectedFolderId

    while (currentId) {
      const { data }: { data: MediaFolder | null } = await supabase
        .from('media_folders')
        .select('*')
        .eq('id', currentId)
        .single()

      if (data) {
        path.unshift(data)
        currentId = data.parent_id || null
      } else {
        break
      }
    }

    setCurrentPath(path)
  }, [selectedFolderId, user?.id])

  // Check PIN verification and redirect if needed - MUST RUN FIRST
  useEffect(() => {
    // Start with verifying state
    setVerifying(true)
    
    const checkAndRedirect = async () => {
      if (!user) {
        setVerifying(false)
        return
      }

      const pinVerified = searchParams.get('pinVerified')
      
      if (!pinVerified && hasMediaPin) {
        // User has PIN but hasn't verified, redirect to confirmation page immediately
        router.replace('/confirm-media-auth')
        return
      }

      // PIN verified or no PIN set, allow access
      setVerifying(false)
    }

    checkAndRedirect()
  }, [user, hasMediaPin, searchParams, router])

  // Load session timeout from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const timeoutParam = urlParams.get('timeout')
      
      if (timeoutParam) {
        const timeoutMinutes = parseInt(timeoutParam)
        const timeoutMs = timeoutMinutes * 60 * 1000
        setSessionTimeout(timeoutMs)
        setTimeRemaining(timeoutMs)
      }
    }
  }, [])

  // Activity detection
  useEffect(() => {
    if (!verifying && user) {
      const inactivityThreshold = 3000 // 3 seconds of inactivity before timer starts
      
      const handleActivity = () => {
        lastActivityRef.current = Date.now()
        
        // If timer was running and user becomes active, reset it
        if (!isActive && timeRemaining < sessionTimeout) {
          setIsActive(true)
          setTimeRemaining(sessionTimeout) // Reset to full timeout
        }
      }

      // Track mouse movement, clicks, keyboard input
      const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click']
      
      events.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true })
      })

      // Check for tab visibility
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Tab is hidden, timer continues
          setIsActive(false)
        } else {
          // Tab is visible, reset timer
          handleActivity()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Check for inactivity periodically
      const inactivityCheck = setInterval(() => {
        const now = Date.now()
        const timeSinceActivity = now - lastActivityRef.current
        
        if (timeSinceActivity >= inactivityThreshold && isActive) {
          setIsActive(false)
        }
      }, 1000)

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleActivity)
        })
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        clearInterval(inactivityCheck)
      }
    }
  }, [verifying, user, isActive, sessionTimeout, timeRemaining])

  // Session timeout countdown - only countdown when inactive
  useEffect(() => {
    if (!verifying && user) {
      let expired = false
      
      // Start countdown only when inactive
      intervalRef.current = setInterval(() => {
        if (!isActive) {
          setTimeRemaining(prev => {
            const newTime = prev - 1000
            
            if (newTime <= 0 && !expired) {
              expired = true
              clearInterval(intervalRef.current!)
              setTimeout(() => {
                router.push('/dashboard')
              }, 0)
              return 0
            }
            
            return newTime
          })
        }
      }, 1000)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
  }, [verifying, user, isActive, sessionTimeout, router])

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Fetch data only if verification is complete
  useEffect(() => {
    if (verifying) return
    fetchMediaFiles()
  }, [verifying, fetchMediaFiles])

  useEffect(() => {
    if (verifying) return
    fetchFolders()
  }, [verifying, fetchFolders])

  useEffect(() => {
    if (verifying) return
    fetchCategories()
  }, [verifying, fetchCategories])

  useEffect(() => {
    if (verifying) return
    fetchBreadcrumbPath()
  }, [verifying, fetchBreadcrumbPath])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get all unique tags from media files
  const allTags = Array.from(
    new Set(
      mediaFiles
        .filter(file => file.tags && file.tags.length > 0)
        .flatMap(file => file.tags || [])
    )
  ).sort()

  // Calculate most used tags
  const mostUsedTags = useMemo(() => {
    const tagCounts: { [key: string]: number } = {}
    
    mediaFiles.forEach(file => {
      if (file.tags && file.tags.length > 0) {
        file.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 most used tags
  }, [mediaFiles])

  // Filter and sort media
  const filteredAndSortedMedia = mediaFiles
    .filter(file => {
      if (filter === 'images' && file.file_type !== 'image') return false
      if (filter === 'videos' && file.file_type !== 'video') return false
      if (filter === 'favorites' && !file.is_favorite) return false
      if (selectedTag && (!file.tags || !file.tags.includes(selectedTag))) return false
      if (searchTerm && !file.file_name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name-asc':
          return a.file_name.localeCompare(b.file_name)
        case 'name-desc':
          return b.file_name.localeCompare(a.file_name)
        case 'size-asc':
          return a.file_size - b.file_size
        case 'size-desc':
          return b.file_size - a.file_size
        default:
          return 0
      }
    })

  // Calculate total file size for filtered media
  const totalFileSize = useMemo(() => {
    const totalBytes = filteredAndSortedMedia.reduce((sum, file) => sum + file.file_size, 0)
    return totalBytes
  }, [filteredAndSortedMedia])

  // Handle folder click
  const handleFolderClick = (folder: MediaFolder) => {
    setSelectedFolderId(folder.id)
    setSelectedMedia(new Set())
    setSelectedTag(null) // Clear tag filter when changing folders
  }

  // Handle breadcrumb click
  const handleBreadcrumbClick = (folder: MediaFolder | null) => {
    setSelectedFolderId(folder?.id || null)
    setSelectedMedia(new Set())
    setSelectedTag(null) // Clear tag filter when navigating
  }

  // Handle delete folder
  const handleDeleteFolderClick = async (folder: MediaFolder) => {
    setFolderToDelete(folder)
    setShowDeleteFolderModal(true)
  }

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return

    try {
      const { error } = await supabase
        .from('media_folders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', folderToDelete.id)

      if (error) throw error

      toast.success('Folder moved to recycle bin')
      fetchFolders()
      setShowDeleteFolderModal(false)
      setFolderToDelete(null)
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Failed to delete folder')
    }
  }

  // Handle restore from recycle bin
  const handleRestore = async (itemType: 'snippet' | 'category' | 'folder' | 'media', itemId: string) => {
    if (!user?.id) return
    
    try {
      let tableName: string
      switch (itemType) {
        case 'folder':
          tableName = 'media_folders'
          break
        case 'media':
          tableName = 'media_files'
          break
        default:
          toast.error('Invalid item type')
          return
      }

      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: null })
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      // If restoring a folder, also restore its media files
      if (itemType === 'folder') {
        const { error: mediaRestoreError } = await supabase
          .from('media_files')
          .update({ deleted_at: null })
          .eq('media_folder_id', itemId)
          .eq('user_id', user.id)
        
        if (mediaRestoreError) {
          console.error('Error restoring media files:', mediaRestoreError)
        }
      }

      toast.success(`${itemType === 'folder' ? 'Folder' : 'Media'} restored successfully!`)
      fetchMediaFiles()
      fetchFolders()
    } catch (error) {
      console.error(`Error restoring ${itemType}:`, error)
      toast.error(`Failed to restore ${itemType}.`)
    }
  }

  // Handle permanent delete
  const handlePermanentDelete = async (itemType: 'snippet' | 'category' | 'folder' | 'media', itemId: string) => {
    if (!user?.id) return
    
    try {
      let tableName: string
      switch (itemType) {
        case 'folder':
          tableName = 'media_folders'
          break
        case 'media':
          tableName = 'media_files'
          break
        default:
          toast.error('Invalid item type')
          return
      }

      // First, get the item to delete from storage if it's media
      if (itemType === 'media') {
        const { data: fileToDelete, error: fetchFileError } = await supabase
          .from('media_files')
          .select('file_url')
          .eq('id', itemId)
          .single()

        if (!fetchFileError && fileToDelete) {
          const urlParts = fileToDelete.file_url.split('/')
          const filePath = urlParts[urlParts.length - 1]
          
          const { error: storageError } = await supabase.storage
            .from('media')
            .remove([filePath])
          
          if (storageError) {
            console.error('Error deleting file from storage:', storageError)
          }
        }
      } else if (itemType === 'folder') {
        // Get all media files in this folder to delete from storage
        const { data: filesToDelete, error: fetchFilesError } = await supabase
          .from('media_files')
          .select('file_url')
          .eq('media_folder_id', itemId)
          .eq('user_id', user.id)

        if (!fetchFilesError && filesToDelete && filesToDelete.length > 0) {
          const filePaths = filesToDelete.map(file => {
            const urlParts = file.file_url.split('/')
            return urlParts[urlParts.length - 1]
          })

          const { error: storageError } = await supabase.storage
            .from('media')
            .remove(filePaths)

          if (storageError) {
            console.error('Error deleting files from storage:', storageError)
          }
        }

        // Delete media file records from the database
        const { error: mediaDeleteError } = await supabase
          .from('media_files')
          .delete()
          .eq('media_folder_id', itemId)
          .eq('user_id', user.id)
        
        if (mediaDeleteError) {
          console.error('Error deleting media files:', mediaDeleteError)
        }
      }

      // Delete the main item from the database
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success(`${itemType === 'folder' ? 'Folder' : 'Media'} permanently deleted!`)
      fetchMediaFiles()
      fetchFolders()
    } catch (error) {
      console.error(`Error permanently deleting ${itemType}:`, error)
      toast.error(`Failed to permanently delete ${itemType}.`)
    }
  }

  // Handle delete media
  const handleDeleteMedia = async () => {
    if (!showDeleteConfirm.item) return

    try {
      const { error } = await supabase
        .from('media_files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', (showDeleteConfirm.item as MediaFile).id)

      if (error) throw error

      toast.success('Media moved to recycle bin')
      fetchMediaFiles()
      setShowDeleteConfirm({ open: false, type: null, item: null })
    } catch (error) {
      console.error('Error deleting media:', error)
      toast.error('Failed to delete media')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading || verifying) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] py-8">
      <div className="max-w-[2000px] mx-auto px-5">
        {/* Session Timeout Progress Bar */}
        {!verifying && hasMediaPin && (
          <div className="mb-6 bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-300 font-semibold">Session Timeout Warning</span>
              </div>
              <span className="text-red-400 font-bold text-lg">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
            <div className="bg-red-950/50 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 transition-all duration-1000 ease-linear shadow-lg"
                style={{
                  width: `${(timeRemaining / sessionTimeout) * 100}%`
                }}
              />
            </div>
            <p className="text-red-300/70 text-xs mt-2 text-center">
              Session will expire due to inactivity
            </p>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-white">Media</h1>
            <button
              onClick={() => setShowRecycleBin(true)}
              className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Recycle Bin
            </button>
          </div>
          <p className="text-gray-400 text-lg">Manage your images and videos</p>
        </motion.div>

        {/* Breadcrumbs - Above Header */}
        {currentPath.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <nav className="flex items-center gap-3 text-base">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBreadcrumbClick(null)}
                className="flex items-center gap-2 px-4 py-2 bg-[#111B32] border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10 transition-all cursor-pointer backdrop-blur-sm group"
              >
                <svg className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-semibold">Home</span>
              </motion.button>
              {currentPath.map((folder, index) => {
                const isActive = index === currentPath.length - 1
                return (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 1) * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBreadcrumbClick(folder)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer backdrop-blur-sm group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 shadow-lg'
                          : 'bg-[#111B32] border border-gray-700 text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${folder.color}20` }}
                      >
                        <MediaIcon icon={folder.icon} className="w-4 h-4" style={{ color: folder.color }} />
                      </div>
                      <span className="font-medium">{folder.name}</span>
                    </motion.button>
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>
        )}

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center gap-2 bg-[#111B32] border border-gray-700 rounded-xl p-1">
              {(['all', 'images', 'videos', 'favorites'] as MediaFilter[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {type === 'favorites' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="relative" data-dropdown>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className="bg-[#111B32] border border-gray-700 rounded-xl px-4 py-2 text-white hover:border-blue-500 transition-all cursor-pointer flex items-center gap-2 min-w-[160px]"
              >
                <span className="flex-1 text-left">
                  {sortBy === 'newest' && 'Newest First'}
                  {sortBy === 'oldest' && 'Oldest First'}
                  {sortBy === 'name-asc' && 'Name (A-Z)'}
                  {sortBy === 'name-desc' && 'Name (Z-A)'}
                  {sortBy === 'size-asc' && 'Size (Smallest)'}
                  {sortBy === 'size-desc' && 'Size (Largest)'}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {openDropdown === 'sort' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-full bg-[#111B32] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    {(['newest', 'oldest', 'name-asc', 'name-desc', 'size-asc', 'size-desc'] as SortOption[]).map((option, index) => (
                      <motion.button
                        key={option}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSortBy(option)
                          setOpenDropdown(null)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-600/20 transition-colors cursor-pointer flex items-center justify-between ${
                          sortBy === option ? 'bg-blue-600/30 text-blue-400' : 'text-gray-300'
                        }`}
                      >
                        <span>
                          {option === 'newest' && 'Newest First'}
                          {option === 'oldest' && 'Oldest First'}
                          {option === 'name-asc' && 'Name (A-Z)'}
                          {option === 'name-desc' && 'Name (Z-A)'}
                          {option === 'size-asc' && 'Size (Smallest)'}
                          {option === 'size-desc' && 'Size (Largest)'}
                        </span>
                        {sortBy === option && (
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'tag' ? null : 'tag')}
                  className="bg-[#111B32] border border-gray-700 rounded-xl px-4 py-2 text-white hover:border-blue-500 transition-all cursor-pointer flex items-center gap-2 min-w-[150px]"
                >
                  <span className="flex-1 text-left">
                    {selectedTag || 'All Tags'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${openDropdown === 'tag' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {openDropdown === 'tag' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-full bg-[#111B32] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-[200px] overflow-y-auto"
                    >
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          setSelectedTag(null)
                          setOpenDropdown(null)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-600/20 transition-colors cursor-pointer flex items-center justify-between ${
                          !selectedTag ? 'bg-blue-600/30 text-blue-400' : 'text-gray-300'
                        }`}
                      >
                        <span>All Tags</span>
                        {!selectedTag && (
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </motion.button>
                      {allTags.map((tag, index) => (
                        <motion.button
                          key={tag}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (index + 1) * 0.05 }}
                          onClick={() => {
                            setSelectedTag(tag)
                            setOpenDropdown(null)
                          }}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-600/20 transition-colors cursor-pointer flex items-center justify-between ${
                            selectedTag === tag ? 'bg-blue-600/30 text-blue-400' : 'text-gray-300'
                          }`}
                        >
                          <span>{tag}</span>
                          {selectedTag === tag && (
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Folder
            </button>
            <button
              onClick={() => setShowCreateMedia(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload Media
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Most Used Tags */}
        {mostUsedTags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Most Used Tags</h2>
            <div className="flex flex-wrap gap-2">
              {mostUsedTags.map(({ tag, count }, index) => (
                <motion.button
                  key={tag}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    // Toggle: if already selected, clear it; otherwise, select it
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-[#111B32] border border-gray-700 text-gray-300 hover:border-blue-500 hover:text-white'
                  }`}
                >
                  <span>{tag}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedTag === tag
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-600/20 text-blue-400'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Folders Grid */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Folders</h2>
            <div className="flex flex-wrap gap-4">
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl p-5 hover:scale-105 transition-all cursor-pointer group relative backdrop-blur-md shadow-lg min-w-[200px] max-w-[250px] flex flex-col"
                  style={{
                    background: `${folder.color}15`,
                    border: `2px solid ${folder.color}50`,
                  }}
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="flex flex-row items-center gap-3 flex-1">
                    <div 
                      className="w-16 h-16 flex items-center justify-center rounded-xl backdrop-blur-sm flex-shrink-0"
                      style={{ background: `${folder.color}30` }}
                    >
                      <MediaIcon icon={folder.icon} className="w-10 h-10" style={{ color: folder.color }} />
                    </div>
                    <div className="flex flex-col items-center text-center flex-1 w-full">
                      <h3 className="text-white font-semibold truncate w-full mb-1 text-left">{folder.name}</h3>
                      {folder.description && (
                        <p className="text-gray-400 text-xs w-full text-left line-clamp-2 overflow-hidden text-ellipsis">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingFolder(folder)
                      setShowCreateFolder(true)
                    }}
                    className="absolute top-3 right-12 w-7 h-7 flex items-center justify-center bg-black/30 hover:bg-blue-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolderClick(folder)
                    }}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-black/30 hover:bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Media Grid */}
        <div>
          {/* Folder Info Section */}
          {selectedFolderId && currentPath.length > 0 && (
            <div className="mb-6 p-6 rounded-2xl backdrop-blur-md" style={{
              background: `${currentPath[currentPath.length - 1].color}15`,
              border: `2px solid ${currentPath[currentPath.length - 1].color}50`,
            }}>
              <div className="flex items-start gap-4">
                <div 
                  className="w-16 h-16 flex items-center justify-center rounded-xl backdrop-blur-sm flex-shrink-0"
                  style={{ background: `${currentPath[currentPath.length - 1].color}30` }}
                >
                  <MediaIcon icon={currentPath[currentPath.length - 1].icon} className="w-10 h-10" style={{ color: currentPath[currentPath.length - 1].color }} />
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="text-white font-bold text-xl mb-1">{currentPath[currentPath.length - 1].name}</h3>
                  {currentPath[currentPath.length - 1].description && (
                    <p className="text-gray-300 text-sm">{currentPath[currentPath.length - 1].description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">
              {selectedFolderId ? 'Media in Folder' : 'All Media'}
            </h2>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full shadow-lg">
              {filteredAndSortedMedia.length} {filteredAndSortedMedia.length === 1 ? 'item' : 'items'}
            </span>
            {filteredAndSortedMedia.length > 0 && (
              <span className="px-3 py-1 bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm font-semibold rounded-full shadow-lg">
                Total: {formatFileSize(totalFileSize)}
              </span>
            )}
          </div>

          {filteredAndSortedMedia.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No media files found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAndSortedMedia.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#111B32] border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer group relative"
                  onClick={() => setViewingMedia(file)}
                >
                  {file.file_type === 'image' ? (
                    <div className="w-full h-[200px] bg-gray-800 relative overflow-hidden group/image">
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                      />
                      {/* Fullscreen Preview Icon - Next to delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewMedia(file)
                        }}
                        className="absolute top-2 right-12 w-8 h-8 flex items-center justify-center bg-blue-500/80 hover:bg-blue-600 rounded-lg opacity-0 group-hover/image:opacity-100 transition-all cursor-pointer shadow-lg"
                        title="Fullscreen"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </button>
                      {file.is_favorite && (
                        <div className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-yellow-500 rounded-full shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-[200px] bg-transparent relative overflow-hidden group/video">
                      <video
                        src={file.file_url}
                        className="w-full h-full object-cover"
                        preload="auto"
                        playsInline
                      />
                      {/* Fullscreen Preview Icon - Next to delete button for video */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewMedia(file)
                        }}
                        className="absolute top-2 right-12 w-8 h-8 flex items-center justify-center bg-blue-500/80 hover:bg-blue-600 rounded-lg opacity-0 group-hover/video:opacity-100 transition-all cursor-pointer shadow-lg"
                        title="Fullscreen"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </button>
                      {file.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(file.duration)}
                        </div>
                      )}
                      {file.is_favorite && (
                        <div className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-yellow-500 rounded-full shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-white text-sm truncate">{file.file_name}</p>
                    <p className="text-gray-400 text-xs">{formatFileSize(file.file_size)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm({ open: true, type: 'media', item: file })
                    }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateFolder && (
          <CreateMediaFolderModal
            isOpen={showCreateFolder}
            onClose={() => {
              setShowCreateFolder(false)
              setEditingFolder(null)
            }}
            onSuccess={() => {
              fetchFolders()
              setShowCreateFolder(false)
              setEditingFolder(null)
            }}
            editingFolder={editingFolder}
            parentId={selectedFolderId}
          />
        )}

        {showCreateMedia && (
          <CreateMediaModal
            isOpen={showCreateMedia}
            onClose={() => setShowCreateMedia(false)}
            onSuccess={() => {
              fetchMediaFiles()
              setShowCreateMedia(false)
            }}
            folderId={selectedFolderId}
          />
        )}

        {viewingMedia && (
          <MediaViewerModal
            isOpen={!!viewingMedia}
            onClose={() => setViewingMedia(null)}
            media={viewingMedia}
            onUpdate={async () => {
              await fetchMediaFiles()
              // Don't set viewingMedia again - just refresh the list
            }}
          />
        )}

        {showRecycleBin && user && (
          <MediaRecycleBinModal
            isOpen={showRecycleBin}
            onClose={() => setShowRecycleBin(false)}
            onRefresh={() => {
              fetchMediaFiles()
              fetchFolders()
            }}
            userId={user.id}
          />
        )}

        {showDeleteConfirm.open && (
          <ConfirmDeleteModal
            isOpen={showDeleteConfirm.open}
            onClose={() => setShowDeleteConfirm({ open: false, type: null, item: null })}
            onConfirm={() => {
              if (showDeleteConfirm.type === 'media') {
                handleDeleteMedia()
              }
            }}
            title={showDeleteConfirm.type === 'media' ? 'Delete Media' : 'Delete Folder'}
            message={`Are you sure you want to delete this ${showDeleteConfirm.type}?`}
          />
        )}

        {/* Folder Delete Confirmation Modal */}
        {showDeleteFolderModal && folderToDelete && (
          <DeleteMediaFolderModal
            isOpen={showDeleteFolderModal}
            folder={folderToDelete}
            onClose={() => {
              setShowDeleteFolderModal(false)
              setFolderToDelete(null)
            }}
            onConfirm={confirmDeleteFolder}
          />
        )}

        {/* Fullscreen Preview Modal */}
        {previewMedia && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/90 z-[9999] cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewMedia(null)}
            />
            <motion.div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all cursor-pointer z-10"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Media Preview */}
              {previewMedia.file_type === 'image' ? (
                <img
                  src={previewMedia.file_url}
                  alt={previewMedia.file_name}
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
                  loading="lazy"
                />
              ) : (
                <video
                  src={previewMedia.file_url}
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
                  controls
                  autoPlay
                />
              )}

              {/* File Name */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-white text-sm font-medium">{previewMedia.file_name}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MediaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <MediaPageContent />
    </Suspense>
  )
}

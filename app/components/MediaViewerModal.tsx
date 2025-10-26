'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { supabase, MediaFile, Category } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock'

interface MediaViewerModalProps {
  isOpen: boolean
  onClose: () => void
  media: MediaFile
  onUpdate: () => void
}

export default function MediaViewerModal({
  isOpen,
  onClose,
  media,
  onUpdate
}: MediaViewerModalProps) {
  const { user } = useUser()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(media.file_name || '')
  const [description, setDescription] = useState(media.description || '')
  const [tags, setTags] = useState<string[]>(media.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isFavorite, setIsFavorite] = useState(media.is_favorite)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(media.category_id || null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [editingCategory, setEditingCategory] = useState(false)

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen && media) {
      fetchCategories()
      setTitle(media.file_name || '')
      setDescription(media.description || '') 
      setTags(media.tags || [])
      setIsFavorite(media.is_favorite)
      setSelectedCategory(media.category_id || null)
      setEditingTitle(false)
      setEditingDescription(false)
      setEditingTags(false)
      setEditingCategory(false)
    }
  }, [isOpen, media?.id, media?.file_name, media?.description, media?.tags, media?.is_favorite, media?.category_id])

  const fetchCategories = async () => {
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
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!user?.id) return

    setLoading(true)

    try {
      const newTitle = title || media.file_name

      // Check for duplicate name in the current folder (excluding current file)
      if (newTitle !== media.file_name) {
        const { data: existingFiles } = await supabase
          .from('media_files')
          .select('id')
          .eq('user_id', user.id)
          .eq('file_name', newTitle)
          .eq('media_folder_id', media.media_folder_id || null)
          .neq('id', media.id)
          .is('deleted_at', null)

        if (existingFiles && existingFiles.length > 0) {
          toast.error(`A file named "${newTitle}" already exists in this folder`)
          setLoading(false)
          return
        }
      }

      interface UpdateData {
        file_name: string
        description: string | null
        category_id: string | null
        updated_at: string
        tags?: string[] | null
      }

      const updateData: UpdateData = {
        file_name: newTitle,
        description: description || null,
        category_id: selectedCategory || null,
        updated_at: new Date().toISOString(),
      }

      // Only update tags if there are any
      if (tags.length > 0) {
        updateData.tags = tags
      } else {
        updateData.tags = null
      }

      const { error } = await supabase
        .from('media_files')
        .update(updateData)
        .eq('id', media.id)
        .select()
        .single()

      if (error) throw error

      toast.success('Media updated successfully')
      
      // Close the modal and update data
      onClose()
      onUpdate()
    } catch (error) {
      console.error('Error updating media:', error)
      toast.error('Failed to update media')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!user?.id) return

    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState) // Update immediately for instant UI feedback

    try {
      const { error } = await supabase
        .from('media_files')
        .update({
          is_favorite: newFavoriteState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', media.id)

      if (error) throw error

      toast.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites')
      onUpdate()
    } catch (error) {
      console.error('Error updating favorite:', error)
      setIsFavorite(!newFavoriteState) // Revert on error
      toast.error('Failed to update favorite')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = media.file_url
    link.download = media.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download started')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#0F1B2E] border border-gray-700 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Media Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Media Preview */}
              <div>
                {media.file_type === 'image' ? (
                  <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <img
                      src={media.file_url}
                      alt={media.file_name}
                      className="w-full max-h-[60vh] object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-xl p-8 flex items-center justify-center">
                    <video
                      src={media.file_url}
                      controls
                      className="w-full max-h-[60vh] rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Media Info */}
              <div className="space-y-4">
                {/* Title Section */}
                <div>
                  {editingTitle ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => setEditingTitle(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingTitle(false)
                      }}
                      className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white hover:border-blue-500 transition-colors flex items-center justify-between group">
                      <span className="font-semibold text-lg">{title || 'Untitled'}</span>
                      <button
                        onClick={() => setEditingTitle(true)}
                        className="p-1 cursor-pointer hover:bg-gray-700 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Description Section */}
                <div>
                  {editingDescription ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => setEditingDescription(false)}
                      placeholder="Add a description..."
                      rows={4}
                      className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      autoFocus
                    />
                  ) : (
                    <div className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 min-h-[100px] text-white hover:border-blue-500 transition-colors flex items-start justify-between group">
                      <span className="text-gray-300 flex-1">{description || 'Add a description...'}</span>
                      <button
                        onClick={() => setEditingDescription(true)}
                        className="p-1 cursor-pointer hover:bg-gray-700 rounded transition-colors ml-2"
                      >
                        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div>
                  {editingTags ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        onBlur={() => setEditingTags(false)}
                        placeholder="Type and press Enter to add tags"
                        className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-red-300"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 min-h-[60px] text-white hover:border-blue-500 transition-colors flex items-start justify-between group">
                      <div className="flex flex-wrap gap-2 flex-1">
                        {tags.length > 0 ? (
                          tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">Add tags...</span>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingTags(true)}
                        className="p-1 cursor-pointer hover:bg-gray-700 rounded transition-colors ml-2"
                      >
                        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  {editingCategory ? (
                    <div className="space-y-2">
                      <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                        onBlur={() => setEditingCategory(false)}
                        className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        autoFocus
                      >
                        <option value="">No Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white hover:border-blue-500 transition-colors flex items-center justify-between group">
                      <span className="text-gray-300">
                        {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Unknown' : 'No category'}
                      </span>
                      <button
                        onClick={() => setEditingCategory(true)}
                        className="p-1 cursor-pointer hover:bg-gray-700 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 p-4 bg-[#111B32] rounded-xl">
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex items-center gap-2 transition-colors cursor-pointer ${
                      isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill={isFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm font-medium">
                      {isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-sm font-medium">Download</span>
                  </button>
                </div>

                {/* File Info */}
                <div className="p-4 bg-[#111B32] rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">File Name:</span>
                    <span className="text-white font-medium">{title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white font-medium">{formatFileSize(media.file_size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white font-medium capitalize">{media.file_type}</span>
                  </div>
                  {media.width && media.height && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="text-white font-medium">{media.width} × {media.height}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all cursor-pointer font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

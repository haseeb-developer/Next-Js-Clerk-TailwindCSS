'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { supabase, MediaCategory, CreateMediaCategoryData, UpdateMediaCategoryData } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock'

interface MediaCategoryManagerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories: MediaCategory[]
}

interface CategoryCounts {
  [categoryId: string]: { images: number; videos: number }
}

export default function MediaCategoryManager({ isOpen, onClose, onSuccess, categories }: MediaCategoryManagerProps) {
  const { user } = useUser()
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#6366f1')
  const [editingCategory, setEditingCategory] = useState<MediaCategory | null>(null)
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({})
  
  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      setCategoryName('')
      setCategoryColor('#6366f1')
      setEditingCategory(null)
      fetchCategoryCounts()
    }
  }, [isOpen])

  const fetchCategoryCounts = async () => {
    if (!user?.id) return

    try {
      const counts: CategoryCounts = {}
      
      for (const category of categories) {
        const { data: mediaFiles } = await supabase
          .from('media_files')
          .select('file_type')
          .eq('user_id', user.id)
          .eq('category_id', category.id)
          .is('deleted_at', null)

        if (mediaFiles) {
          const images = mediaFiles.filter(f => f.file_type === 'image').length
          const videos = mediaFiles.filter(f => f.file_type === 'video').length
          counts[category.id] = { images, videos }
        }
      }

      setCategoryCounts(counts)
    } catch (error) {
      console.error('Error fetching category counts:', error)
    }
  }

  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name)
      setCategoryColor(editingCategory.color)
    }
  }, [editingCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !categoryName.trim()) return

    try {
      // Check for duplicate category name
      const trimmedName = categoryName.trim().toLowerCase()
      const existingCategory = categories.find(c => c.name.toLowerCase() === trimmedName)
      
      if (editingCategory) {
        // Update existing category
        // Allow update if name hasn't changed OR if new name is unique
        if (existingCategory && existingCategory.id !== editingCategory.id) {
          toast.error('A category with this name already exists')
          return
        }

        const updateData: UpdateMediaCategoryData = {
          name: categoryName.trim(),
          color: categoryColor,
        }

        const { error } = await supabase
          .from('media_categories')
          .update(updateData)
          .eq('id', editingCategory.id)
          .eq('user_id', user.id)

        if (error) throw error
        toast.success('Category updated successfully')
      } else {
        // Create new category
        if (existingCategory) {
          toast.error('A category with this name already exists')
          return
        }

        const createData: CreateMediaCategoryData = {
          name: categoryName.trim(),
          color: categoryColor,
        }

        const { error } = await supabase
          .from('media_categories')
          .insert([{
            ...createData,
            user_id: user.id,
          }])

        if (error) throw error
        toast.success('Category created successfully')
      }

      setCategoryName('')
      setCategoryColor('#6366f1')
      setEditingCategory(null)
      onSuccess()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(`Failed to ${editingCategory ? 'update' : 'create'} category`)
    }
  }

  const handleEdit = (category: MediaCategory) => {
    setEditingCategory(category)
  }

  const handleDelete = async (category: MediaCategory) => {
    if (!user?.id) return

    const confirmDelete = window.confirm(`Are you sure you want to delete "${category.name}"?`)
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('media_categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', category.id)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Category deleted successfully')
      onSuccess()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-[#0A0E27] border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Category Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <input
                  type="color"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                  className="w-full h-12 rounded-xl cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer font-semibold"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryName('')
                      setCategoryColor('#6366f1')
                    }}
                    className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Categories List */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Your Categories</h3>
            {categories.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No categories yet</p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-4 bg-[#111B32] border border-gray-700 rounded-xl hover:border-blue-500/50 transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{category.name}</h4>
                      {categoryCounts[category.id] && (
                        <p className="text-gray-400 text-sm mt-1">
                          {categoryCounts[category.id].images > 0 && `${categoryCounts[category.id].images} image${categoryCounts[category.id].images !== 1 ? 's' : ''}`}
                          {categoryCounts[category.id].images > 0 && categoryCounts[category.id].videos > 0 && ' - '}
                          {categoryCounts[category.id].videos > 0 && `${categoryCounts[category.id].videos} video${categoryCounts[category.id].videos !== 1 ? 's' : ''}`}
                          {categoryCounts[category.id].images === 0 && categoryCounts[category.id].videos === 0 && 'No media assigned'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

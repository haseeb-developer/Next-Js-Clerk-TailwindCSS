'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { supabase, MediaFolder } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock'

interface CreateMediaFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingFolder?: MediaFolder | null
  parentId?: string | null
}

const icons = [
  { name: 'folder', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/></svg> },
  { name: 'image', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg> },
  { name: 'video', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-7 4V7z"/></svg> },
  { name: 'camera', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg> },
  { name: 'film', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg> },
  { name: 'archive', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/></svg> },
  { name: 'star', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> },
  { name: 'heart', svg: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zM12.1 18.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg> },
]
const colors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
]

export default function CreateMediaFolderModal({
  isOpen,
  onClose,
  onSuccess,
  editingFolder,
  parentId
}: CreateMediaFolderModalProps) {
  const { user } = useUser()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('folder')
  const [color, setColor] = useState('#6366f1')
  const [loading, setLoading] = useState(false)

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name)
      setDescription(editingFolder.description || '')
      setIcon(editingFolder.icon)
      setColor(editingFolder.color)
    } else {
      setName('')
      setDescription('')
      setIcon('folder')
      setColor('#6366f1')
    }
  }, [editingFolder, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Folder name is required')
      return
    }

    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    setLoading(true)

    try {
      if (editingFolder) {
        const { error } = await supabase
          .from('media_folders')
          .update({
            name,
            description: description || null,
            icon,
            color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFolder.id)

        if (error) throw error
        toast.success('Folder updated successfully')
      } else {
        const { error } = await supabase
          .from('media_folders')
          .insert({
            user_id: user.id,
            name,
            description: description || null,
            icon,
            color,
            parent_id: parentId || null,
          })

        if (error) throw error
        toast.success('Folder created successfully')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving folder:', error)
      toast.error('Failed to save folder')
    } finally {
      setLoading(false)
    }
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
            className="relative bg-[#0F1B2E] border border-gray-700 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingFolder ? 'Edit Folder' : 'Create Folder'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter folder description (optional)"
                  rows={3}
                  className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Icon
                </label>
                <div className="flex flex-wrap gap-3">
                  {icons.map((iconItem) => (
                    <button
                      key={iconItem.name}
                      type="button"
                      onClick={() => setIcon(iconItem.name)}
                      className={`w-12 h-12 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        icon === iconItem.name
                          ? 'bg-blue-600 scale-110'
                          : 'bg-[#111B32] border border-gray-700 hover:border-blue-500'
                      }`}
                    >
                      {iconItem.svg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setColor(colorOption.value)}
                      className={`w-12 h-12 rounded-xl transition-all cursor-pointer border-2 ${
                        color === colorOption.value
                          ? 'border-white scale-110'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: colorOption.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingFolder ? 'Update Folder' : 'Create Folder'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all cursor-pointer font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

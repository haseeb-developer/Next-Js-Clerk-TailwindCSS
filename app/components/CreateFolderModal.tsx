'use client'

import { useState } from 'react'
import { CreateFolderData, Folder } from '../../lib/supabase'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateFolderData) => Promise<void>
  editingFolder?: Folder | null
}

const FOLDER_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Slate', value: '#64748B' },
]

const FOLDER_ICONS = [
  { name: 'Folder', value: 'folder' },
  { name: 'Code', value: 'code' },
  { name: 'Star', value: 'star' },
  { name: 'Heart', value: 'heart' },
  { name: 'Briefcase', value: 'briefcase' },
  { name: 'Book', value: 'book' },
  { name: 'Bookmark', value: 'bookmark' },
  { name: 'Archive', value: 'archive' },
  { name: 'Database', value: 'database' },
  { name: 'Cloud', value: 'cloud' },
  { name: 'Lock', value: 'lock' },
  { name: 'Key', value: 'key' },
]

const renderIcon = (iconName: string, className: string = 'w-5 h-5') => {
  const icons: { [key: string]: React.JSX.Element } = {
    folder: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
    ),
    code: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>
    ),
    star: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    heart: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
    briefcase: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z"/>
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
      </svg>
    ),
    book: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    ),
    bookmark: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
      </svg>
    ),
    archive: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
      </svg>
    ),
    database: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
      </svg>
    ),
    cloud: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
      </svg>
    ),
    lock: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
    ),
    key: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
      </svg>
    ),
  }
  return icons[iconName] || icons.folder
}

export function CreateFolderModal({ isOpen, onClose, onSubmit, editingFolder }: CreateFolderModalProps) {
  const [formData, setFormData] = useState<CreateFolderData>({
    name: editingFolder?.name || '',
    description: editingFolder?.description || '',
    color: editingFolder?.color || '#3B82F6',
    icon: editingFolder?.icon || 'folder',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'folder',
      })
      onClose()
    } catch (error) {
      console.error('Error submitting folder:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300">
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1px solid #0f172a'
      }} className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {editingFolder ? 'Edit Folder' : 'Create New Folder'}
          </h2>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Folder Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Folder Name *</label>
            <input
              type="text"
              required
              maxLength={30}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 shadow-sm transition-all duration-200"
              placeholder="Enter folder name (max 30 characters)"
            />
            <p className="text-xs text-gray-400 mt-1">{formData.name.length}/30 characters</p>
          </div>

          {/* Folder Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 shadow-sm transition-all duration-200"
              placeholder="What's this folder for? (max 100 characters)"
            />
            <p className="text-xs text-gray-400 mt-1">{formData.description?.length || 0}/100 characters</p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Folder Color</label>
            <div className="grid grid-cols-6 gap-3">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`relative h-12 rounded-xl transition-all duration-200 cursor-pointer group ${
                    formData.color === color.value
                      ? 'scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: color.value
                  }}
                  title={color.name}
                >
                  {formData.color === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Folder Icon</label>
            <div className="grid grid-cols-6 gap-3">
              {FOLDER_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: icon.value })}
                  className={`h-14 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    formData.icon === icon.value
                      ? 'bg-blue-500/20 border-2 border-blue-400 scale-110'
                      : 'bg-gray-800/50 border border-gray-600/40 hover:bg-gray-700/50 hover:scale-105'
                  }`}
                  title={icon.name}
                  style={formData.icon === icon.value ? { color: formData.color } : { color: '#9CA3AF' }}
                >
                  {renderIcon(icon.value, 'w-6 h-6')}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Preview</label>
            <div 
              className="p-6 rounded-2xl border-2 transition-all duration-300"
              style={{
                backgroundColor: `${formData.color}15`,
                borderColor: formData.color
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: formData.color }}
                >
                  {renderIcon(formData.icon || 'folder', 'w-8 h-8 text-white')}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {formData.name || 'Folder Name'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {formData.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (editingFolder ? 'Update Folder' : 'Create Folder')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-all duration-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


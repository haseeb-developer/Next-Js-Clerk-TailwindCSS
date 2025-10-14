'use client'

import { useState, useEffect } from 'react'
import type { CreateCategoryData, UpdateCategoryData } from '../../lib/supabase'

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => void
  editingCategory?: {
    id: string
    name: string
    description?: string
    color: string
    background: string
    icon: string
    is_default: boolean
    sort_order: number
  } | null
}

const icons = [
  { name: 'web', label: 'Web Development' },
  { name: 'mobile', label: 'Mobile Development' },
  { name: 'backend', label: 'Backend Development' },
  { name: 'database', label: 'Database' },
  { name: 'ai', label: 'AI & Machine Learning' },
  { name: 'design', label: 'Design & UI/UX' },
  { name: 'devops', label: 'DevOps & Infrastructure' },
  { name: 'game', label: 'Game Development' },
  { name: 'other', label: 'Other' }
]

const colors = [
  { name: 'Blue', value: '#3B82F6', bg: '#1E3A8A' },
  { name: 'Green', value: '#10B981', bg: '#064E3B' },
  { name: 'Purple', value: '#8B5CF6', bg: '#4C1D95' },
  { name: 'Red', value: '#EF4444', bg: '#7F1D1D' },
  { name: 'Orange', value: '#F59E0B', bg: '#78350F' },
  { name: 'Pink', value: '#EC4899', bg: '#831843' },
  { name: 'Indigo', value: '#6366F1', bg: '#312E81' },
  { name: 'Teal', value: '#14B8A6', bg: '#134E4A' },
  { name: 'Yellow', value: '#EAB308', bg: '#713F12' },
  { name: 'Emerald', value: '#059669', bg: '#022C22' },
  { name: 'Violet', value: '#7C3AED', bg: '#4C1D95' },
  { name: 'Rose', value: '#F43F5E', bg: '#881337' }
]


export default function CreateCategoryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingCategory 
}: CreateCategoryModalProps) {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    description: '',
    color: '#3B82F6',
    background: '#1E3A8A',
    icon: 'web',
    is_default: false,
    sort_order: 0
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || '',
        color: editingCategory.color,
        background: editingCategory.background,
        icon: editingCategory.icon,
        is_default: editingCategory.is_default,
        sort_order: editingCategory.sort_order
      })
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        background: '#1E3A8A',
        icon: 'web',
        is_default: false,
        sort_order: 0
      })
    }
    setErrors({})
  }, [editingCategory, isOpen])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters'
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined
    }

    onSubmit(submitData)
    onClose()
  }

  const handleColorChange = (colorValue: string, bgValue: string) => {
    setFormData(prev => ({
      ...prev,
      color: colorValue,
      background: bgValue
    }))
  }

  const renderIcon = (iconName: string, size: 'sm' | 'md' = 'md') => {
    const iconMap: { [key: string]: React.JSX.Element } = {
      'web': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
        </svg>
      ),
      'mobile': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      ),
      'backend': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
        </svg>
      ),
      'database': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
        </svg>
      ),
      'ai': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      ),
      'design': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
        </svg>
      ),
      'devops': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>
      ),
      'game': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      'other': (
        <svg className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      )
    }
    return iconMap[iconName] || iconMap['other']
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#111B32] border border-gray-700 rounded-3xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <p className="text-gray-400 mt-1">
              {editingCategory ? 'Update your category details' : 'Organize your snippets with custom categories'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Preview */}
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            <div 
              className="rounded-2xl border-2 p-6 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${formData.background}15, ${formData.background}25)`,
                borderColor: `${formData.background}40`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${formData.color}20`,
                    borderColor: formData.color,
                    borderWidth: '2px'
                  }}
                >
                  <div style={{ color: formData.color }}>
                    {renderIcon(formData.icon || 'web')}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {formData.name || 'Category Name'}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {formData.description || 'Category description'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="Enter category name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                {icons.map(icon => (
                  <option key={icon.name} value={icon.name}>
                    {icon.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter category description (optional)"
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Color Theme
            </label>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {colors.map(color => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleColorChange(color.value, color.bg)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    formData.color === color.value 
                      ? 'border-white scale-105' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  <div className="text-white text-xs font-medium text-center">
                    {color.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

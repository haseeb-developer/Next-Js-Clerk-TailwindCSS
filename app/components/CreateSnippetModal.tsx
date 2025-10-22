'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CreateSnippetData, Folder, Category, Snippet } from '../../lib/supabase'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface CreateSnippetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSnippetData) => void
  folders: Folder[]
  categories: Category[]
  selectedFolderId?: string | null
  selectedCategoryId?: string | null
  editingSnippet?: Snippet | null
}

export default function CreateSnippetModal({
  isOpen,
  onClose,
  onSubmit,
  folders,
  categories,
  selectedFolderId,
  selectedCategoryId,
  editingSnippet
}: CreateSnippetModalProps) {
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen)

  const [formData, setFormData] = useState<CreateSnippetData>({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    tags: [],
    is_public: false,
    is_favorite: false,
    folder_id: selectedFolderId,
    category_id: selectedCategoryId
  })

  const [tagInput, setTagInput] = useState('')

  // Populate form when editing or when modal opens with pre-selected values
  useEffect(() => {
    if (editingSnippet) {
      setFormData({
        title: editingSnippet.title,
        description: editingSnippet.description || '',
        code: editingSnippet.code,
        language: editingSnippet.language,
        tags: editingSnippet.tags || [],
        is_public: editingSnippet.is_public,
        is_favorite: editingSnippet.is_favorite,
        folder_id: editingSnippet.folder_id,
        category_id: editingSnippet.category_id
      })
    } else if (isOpen && !editingSnippet) {
      // Only reset form data when modal opens for creation, not when selectedCategoryId changes
      setFormData({
        title: '',
        description: '',
        code: '',
        language: 'javascript',
        tags: [],
        is_public: false,
        is_favorite: false,
        folder_id: selectedFolderId,
        category_id: selectedCategoryId
      })
    }
  }, [editingSnippet, isOpen, selectedFolderId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    // Reset form data with current selected values
    setFormData({
      title: '',
      description: '',
      code: '',
      language: 'javascript',
      tags: [],
      is_public: false,
      is_favorite: false,
      folder_id: selectedFolderId,
      category_id: selectedCategoryId
    })
    setTagInput('')
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="bg-[#111B32] border border-gray-700 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50"
                placeholder="Enter snippet title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Language *
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50 cursor-pointer"
                required
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="yaml">YAML</option>
                <option value="markdown">Markdown</option>
                <option value="bash">Bash</option>
                <option value="powershell">PowerShell</option>
                <option value="liquid">Liquid</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50 resize-none"
              rows={3}
              placeholder="Enter snippet description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Code *
            </label>
            <textarea
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/90 border border-gray-600/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50 font-mono text-sm resize-none"
              rows={8}
              placeholder="Enter your code here"
              required
            />
          </div>

          {/* Category (Optional) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category (Optional)
            </label>
            <select
              value={formData.category_id ?? ''}
              onChange={(e) => {
                const value = e.target.value
                setFormData({ ...formData, category_id: value === '' ? null : value })
              }}
              className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50 cursor-pointer"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 bg-gray-800/90 border border-gray-600/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-purple-400 hover:text-purple-200 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_favorite}
                onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
              />
              <span className="text-white">Mark as favorite</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
              />
              <span className="text-white">Make public</span>
            </label>
          </div>

          {formData.is_public && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-green-400 font-medium text-sm mb-1">
                    Public Snippet
                  </h5>
                  <p className="text-green-300/80 text-sm leading-relaxed">
                    This snippet will be visible to everyone on the public snippets page. Others can view, copy, and learn from your code.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium cursor-pointer"
            >
              {editingSnippet ? 'Update Snippet' : 'Create Snippet'}
            </button>
          </div>
        </motion.form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

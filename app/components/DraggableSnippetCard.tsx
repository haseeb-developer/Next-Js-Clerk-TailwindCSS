'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Snippet, Category } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface DraggableSnippetCardProps {
  snippet: Snippet
  categories: Category[]
  onEdit: (snippet: Snippet) => void
  onDelete: (snippetId: string) => void
  onView: (snippet: Snippet) => void
  activeTabs: { [snippetId: string]: 'code' | 'tags' | 'category' | 'info' }
  setSnippetActiveTab: (snippetId: string, tab: 'code' | 'tags' | 'category' | 'info') => void
  getActiveTab: (snippetId: string) => 'code' | 'tags' | 'category' | 'info'
  modalCopyClicked: boolean
  handleModalCopy: (code: string) => void
}

export function DraggableSnippetCard({
  snippet,
  categories,
  onEdit,
  onDelete,
  onView,
  activeTabs,
  setSnippetActiveTab,
  getActiveTab,
  modalCopyClicked,
  handleModalCopy
}: DraggableSnippetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: snippet.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing !important' : 'grab !important',
    zIndex: isDragging ? 1000 : 'auto',
  }

  const getCategoryInfo = (categoryId: string | null | undefined) => {
    if (!categoryId) return { name: 'No category assigned', color: '#6B7280', icon: 'tag' }
    const category = categories.find(c => c.id === categoryId)
    if (!category) return { name: 'No category found', color: '#EF4444', icon: 'tag' }
    return { name: category.name, color: category.color, icon: category.icon }
  }

  const categoryInfo = getCategoryInfo(snippet.category_id)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? 'scale-110 shadow-2xl rotate-2' : ''} transition-all duration-200 touch-none cursor-grab`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 overflow-hidden group">
        {/* Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
              {snippet.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                snippet.language === 'javascript' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                snippet.language === 'python' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                snippet.language === 'typescript' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                snippet.language === 'html' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                snippet.language === 'css' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {snippet.language}
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm line-clamp-2">
            {snippet.description || 'No description provided'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3">
          <div className="flex space-x-1 bg-gray-900/50 rounded-lg p-1">
            {[
              { key: 'code', label: 'Code', icon: '💻' },
              { key: 'tags', label: 'Tags', icon: '🏷️' },
              { key: 'category', label: 'Category', icon: '📁' },
              { key: 'info', label: 'Info', icon: 'ℹ️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={(e) => {
                  e.stopPropagation()
                  setSnippetActiveTab(snippet.id, tab.key as 'code' | 'tags' | 'category' | 'info')
                }}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  getActiveTab(snippet.id) === tab.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 h-[140px] overflow-hidden">
          {getActiveTab(snippet.id) === 'code' && (
            <div className="h-full bg-gray-900/50 rounded-lg p-3 overflow-hidden">
              <pre className="text-gray-300 text-sm leading-6 h-full overflow-hidden">
                <code className="language-{snippet.language}">
                  {snippet.code}
                </code>
              </pre>
            </div>
          )}
          
          {getActiveTab(snippet.id) === 'tags' && (
            <div className="h-full flex flex-wrap gap-2 content-start">
              {snippet.tags && snippet.tags.length > 0 ? (
                snippet.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No tags added</span>
              )}
            </div>
          )}
          
          {getActiveTab(snippet.id) === 'category' && (
            <div className="h-full flex items-center">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${categoryInfo.color}20` }}
                >
                  <svg className="w-4 h-4" style={{ color: categoryInfo.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                </div>
                <span className="text-gray-300">{categoryInfo.name}</span>
              </div>
            </div>
          )}
          
          {getActiveTab(snippet.id) === 'info' && (
            <div className="h-full flex flex-col justify-center space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Created:</span>
                <span className="text-gray-300">
                  {new Date(snippet.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Updated:</span>
                <span className="text-gray-300">
                  {new Date(snippet.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Language:</span>
                <span className="text-gray-300 capitalize">{snippet.language}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView(snippet)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(snippet)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(snippet.id)
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

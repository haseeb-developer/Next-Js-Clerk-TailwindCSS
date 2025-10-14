'use client'

import type { Category } from '../../lib/supabase'

interface CategoryCardProps {
  category: Category
  snippetCount: number
  isSelected?: boolean
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

const icons: { [key: string]: React.JSX.Element } = {
  'web': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
    </svg>
  ),
  'mobile': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
  ),
  'backend': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
    </svg>
  ),
  'database': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
    </svg>
  ),
  'ai': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
    </svg>
  ),
  'design': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
    </svg>
  ),
  'devops': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
    </svg>
  ),
  'game': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  'other': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>
  )
}

export default function CategoryCard({ 
  category, 
  snippetCount, 
  isSelected = false, 
  onClick, 
  onEdit, 
  onDelete, 
  showActions = true 
}: CategoryCardProps) {

  const renderIcon = () => {
    return icons[category.icon] || icons['other']
  }

  const getCategoryStyle = () => {
    const baseStyle = {
      background: `linear-gradient(135deg, ${category.background}15, ${category.background}25)`,
      borderColor: `${category.background}40`,
    }
    
    if (isSelected) {
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, ${category.background}30, ${category.background}40)`,
        borderColor: category.background,
        boxShadow: `0 0 0 2px ${category.background}20, 0 8px 32px ${category.background}15`,
      }
    }
    
    return baseStyle
  }

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 p-6 hover:scale-[1.02] hover:shadow-xl ${
        isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''
      }`}
      style={getCategoryStyle()}
      onClick={onClick}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{ 
              backgroundColor: `${category.color}20`,
              borderColor: category.color,
              borderWidth: '2px'
            }}
          >
            <div style={{ color: category.color }}>
              {renderIcon()}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
              {category.name}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">
              {category.description || 'No description'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
          <span className="text-sm text-gray-300">
            {snippetCount} snippet{snippetCount !== 1 ? 's' : ''}
          </span>
        </div>
        {category.is_default && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-700/50 text-gray-300 rounded-full">
            Default
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700/30 rounded-full h-1.5 mb-4">
        <div 
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(100, (snippetCount / 20) * 100)}%`,
            backgroundColor: category.color 
          }}
        ></div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors cursor-pointer"
          >
            Edit
          </button>
          {!category.is_default && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="flex-1 px-3 py-2 text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ 
          background: `linear-gradient(135deg, ${category.background}05, ${category.background}10)`
        }}
      ></div>
    </div>
  )
}

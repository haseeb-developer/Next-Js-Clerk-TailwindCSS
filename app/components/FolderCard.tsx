'use client'

import { Folder } from '../../lib/supabase'

interface FolderCardProps {
  folder: Folder
  snippetCount: number
  onSelect: (folderId: string) => void
  onEdit: (folder: Folder) => void
  onDelete: (folder: Folder) => void
  isSelected?: boolean
}

const renderIcon = (iconName: string, className: string = 'w-6 h-6') => {
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

export function FolderCard({ folder, snippetCount, onSelect, onEdit, onDelete, isSelected }: FolderCardProps) {
  return (
    <div
      onClick={() => onSelect(folder.id)}
      className={`group relative rounded-2xl p-4 border-2 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-xl`}
      style={{
        backgroundColor: `${folder.color}08`,
        borderColor: isSelected ? folder.color : `${folder.color}30`,
      }}
    >
      {/* Premium gradient overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${folder.color}20 0%, transparent 50%)`
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Icon and Title */}
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ 
              backgroundColor: folder.color,
              boxShadow: `0 8px 32px ${folder.color}40`
            }}
          >
            {renderIcon(folder.icon, 'w-7 h-7 text-white')}
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              className="text-base font-semibold leading-5 line-clamp-2 break-words mb-1"
              style={{ color: isSelected ? folder.color : '#F8FAFC' }}
            >
              {folder.name}
            </h3>
            <div className="text-xs text-gray-500">
              Created {new Date(folder.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Description below icon and title (always reserve space) */}
        <div className="mb-4 flex-1">
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 break-words">
            {folder.description && folder.description.trim().length > 0 ? folder.description : 'No description Added'}
          </p>
        </div>

        {/* Footer: Snippet count and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md"
              style={{ 
                backgroundColor: folder.color,
                boxShadow: `0 4px 16px ${folder.color}30`
              }}
            >
              {snippetCount}
            </div>
            <div>
              <div className="text-gray-300 text-sm font-medium">
                {snippetCount === 1 ? 'snippet' : 'snippets'}
              </div>
              {isSelected && (
                <div className="absolute top-[-5px] right-[0px] flex items-center gap-1.5 text-xs font-medium" style={{ color: folder.color }}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                  Selected
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(folder) }}
              className="cursor-pointer px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(folder) }}
              className="cursor-pointer px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg text-xs font-medium transition-all duration-200 border border-red-500/30 hover:border-red-400/50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


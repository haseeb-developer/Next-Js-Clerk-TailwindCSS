'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TimeFilterOption {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  count?: number
}

interface TimeFilterDropdownProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  className?: string
}

const timeFilterOptions: TimeFilterOption[] = [
  {
    id: 'all',
    name: 'All Passwords',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    description: 'Show all passwords'
  },
  {
    id: 'favorites',
    name: 'Favorites',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    description: 'Starred passwords only'
  },
  {
    id: 'recent',
    name: 'Recent',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Recently created or updated'
  },
  {
    id: 'older',
    name: 'Older',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    description: 'Created more than 30 days ago'
  }
]

export function TimeFilterDropdown({
  selectedId,
  onSelect,
  className = ""
}: TimeFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = timeFilterOptions.find(option => option.id === selectedId) || timeFilterOptions[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: string | null) => {
    onSelect(id)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 rounded-xl transition-all duration-200 min-w-[200px]"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            {selectedOption.icon}
          </div>
          <span className="text-gray-300 text-sm font-medium">Filter</span>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">{selectedOption.name}</span>
            {selectedOption.count !== undefined && (
              <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                {selectedOption.count}
              </span>
            )}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50"
          >
            {timeFilterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                  selectedId === option.id ? 'bg-gray-700/30' : ''
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{option.name}</div>
                  <div className="text-gray-400 text-xs">{option.description}</div>
                </div>
                {option.count !== undefined && (
                  <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

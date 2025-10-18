'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FilterOption {
  id: string
  name: string
  color?: string
  icon?: string
  count?: number
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  icon: React.ReactNode
  placeholder?: string
  showCount?: boolean
  className?: string
}

export function FilterDropdown({
  label,
  options,
  selectedId,
  onSelect,
  icon,
  placeholder = "Select an option",
  showCount = true,
  className = ""
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.id === selectedId)

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
        className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 rounded-xl transition-all duration-200 min-w-[200px] cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-gray-300 text-sm font-medium">{label}</span>
        </div>
        <div className="flex-1 text-left">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.color && (
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedOption.color }}
                ></div>
              )}
              <span className="text-white text-sm">{selectedOption.name}</span>
              {showCount && selectedOption.count !== undefined && (
                <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                  {selectedOption.count}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}
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
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto"
          >
            {/* All option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer ${
                !selectedId ? 'bg-gray-700/30' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-white text-sm">All {label}</span>
              {showCount && (
                <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300 ml-auto">
                  {options.reduce((sum, option) => sum + (option.count || 0), 0)}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-700/50 mx-4"></div>

            {/* Options */}
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer ${
                  selectedId === option.id ? 'bg-gray-700/30' : ''
                }`}
              >
                {option.color && (
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: option.color }}
                  ></div>
                )}
                <span className="text-white text-sm">{option.name}</span>
                {showCount && option.count !== undefined && (
                  <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300 ml-auto">
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

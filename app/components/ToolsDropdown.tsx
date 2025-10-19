'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProtectedLink } from './ProtectedLink'

interface ToolsDropdownProps {
  isActive: (path: string) => boolean
  onItemClick?: () => void
}

export default function ToolsDropdown({ isActive, onItemClick }: ToolsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleItemClick = () => {
    setIsOpen(false)
    if (onItemClick) {
      onItemClick()
    }
  }

  const toolsItems = [
    {
      href: '/organize',
      label: 'Organize Page',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      href: '/snippets',
      label: 'Snippets Page',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      href: '/confirm-auth',
      label: 'Password Save',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ]

  const isAnyToolActive = toolsItems.some(item => isActive(item.href))

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Desktop Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer transition-colors duration-150 rounded-lg ${
          isAnyToolActive 
            ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
            : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Tools
        <motion.svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Mobile Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden flex items-center gap-2 px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 w-full cursor-pointer ${
          isAnyToolActive
            ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
            : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Tools
        <motion.svg 
          className="w-5 h-5 ml-auto" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Desktop Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ 
              duration: 0.2, 
              ease: [0.4, 0, 0.2, 1],
              staggerChildren: 0.05
            }}
            className="hidden lg:block absolute top-full left-0 mt-2 w-56 bg-zinc-800/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="py-2">
              {toolsItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <ProtectedLink
                      href={item.href}
                      prefetch={true}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-150 w-full ${
                        isActive(item.href)
                          ? 'text-white bg-indigo-500/20 border-r-2 border-indigo-500'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                      }`}
                      onClick={handleItemClick}
                    >
                      {item.icon}
                      {item.label}
                    </ProtectedLink>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0, 0.2, 1],
              staggerChildren: 0.08
            }}
            className="lg:hidden mt-2 space-y-2 overflow-hidden"
          >
            {toolsItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.08 }}
                className="w-full"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <ProtectedLink
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center gap-3 px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 w-full ${
                      isActive(item.href)
                        ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                    }`}
                    onClick={handleItemClick}
                  >
                    {item.icon}
                    {item.label}
                  </ProtectedLink>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

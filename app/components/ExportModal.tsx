'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Snippet } from '@/lib/supabase'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  snippets: Snippet[]
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function ExportModal({ isOpen, onClose, snippets, onShowToast }: ExportModalProps) {
  const [selectedSnippets, setSelectedSnippets] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'md'>('json')
  
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      setSelectedSnippets(new Set())
      setSelectAll(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (selectAll) {
      setSelectedSnippets(new Set(snippets.map(s => s.id)))
    } else {
      setSelectedSnippets(new Set())
    }
  }, [selectAll, snippets])

  const handleSelectAll = () => {
    setSelectAll(!selectAll)
  }

  const handleSnippetSelect = (snippetId: string) => {
    const newSelected = new Set(selectedSnippets)
    if (newSelected.has(snippetId)) {
      newSelected.delete(snippetId)
    } else {
      newSelected.add(snippetId)
    }
    setSelectedSnippets(newSelected)
    
    // Update select all state
    if (newSelected.size === snippets.length) {
      setSelectAll(true)
    } else if (newSelected.size === 0) {
      setSelectAll(false)
    }
  }

  const handleExport = () => {
    if (selectedSnippets.size === 0) {
      onShowToast('Please select at least one snippet to export', 'error')
      return
    }

    const selectedSnippetsData = snippets.filter(s => selectedSnippets.has(s.id))
    
    let content = ''
    let filename = ''
    let mimeType = ''

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(selectedSnippetsData, null, 2)
        filename = `snippets-export-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
        break
      case 'txt':
        content = selectedSnippetsData.map(snippet => 
          `=== ${snippet.title} ===\n` +
          `Language: ${snippet.language}\n` +
          `Created: ${new Date(snippet.created_at).toLocaleDateString()}\n` +
          `Public: ${snippet.is_public ? 'Yes' : 'No'}\n` +
          `${snippet.description ? `Description: ${snippet.description}\n` : ''}` +
          `${snippet.tags && snippet.tags.length > 0 ? `Tags: ${snippet.tags.join(', ')}\n` : ''}` +
          `\nCode:\n${snippet.code}\n\n${'='.repeat(50)}\n\n`
        ).join('')
        filename = `snippets-export-${new Date().toISOString().split('T')[0]}.txt`
        mimeType = 'text/plain'
        break
      case 'md':
        content = selectedSnippetsData.map(snippet => 
          `# ${snippet.title}\n\n` +
          `**Language:** ${snippet.language}\n` +
          `**Created:** ${new Date(snippet.created_at).toLocaleDateString()}\n` +
          `**Public:** ${snippet.is_public ? 'Yes' : 'No'}\n` +
          `${snippet.description ? `**Description:** ${snippet.description}\n` : ''}` +
          `${snippet.tags && snippet.tags.length > 0 ? `**Tags:** ${snippet.tags.join(', ')}\n` : ''}` +
          `\n\`\`\`${snippet.language.toLowerCase()}\n${snippet.code}\n\`\`\`\n\n---\n\n`
        ).join('')
        filename = `snippets-export-${new Date().toISOString().split('T')[0]}.md`
        mimeType = 'text/markdown'
        break
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onShowToast(`Successfully exported ${selectedSnippets.size} snippet(s) as ${exportFormat.toUpperCase()}`, 'success')
    onClose()
  }

  const formatOptions = [
    { 
      value: 'json', 
      label: 'JSON', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ), 
      description: 'Structured data format' 
    },
    { 
      value: 'txt', 
      label: 'Text', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          <path d="M12 6.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h1z"/>
        </svg>
      ), 
      description: 'Plain text format' 
    },
    { 
      value: 'md', 
      label: 'Markdown', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          <path d="M8 8h8m-8 4h8m-8 4h5"/>
        </svg>
      ), 
      description: 'Markdown format' 
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div 
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              border: '1px solid #0f172a'
            }} 
            className="backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
              <h2 className="text-2xl font-bold text-white">Export Snippets</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Select All */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                    Select All Snippets
                  </span>
                </label>
              </div>

              {/* Export Format Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Export Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formatOptions.map((option) => (
                    <motion.label
                      key={option.value}
                      className="relative cursor-pointer group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={option.value}
                        checked={exportFormat === option.value}
                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'txt' | 'md')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        exportFormat === option.value
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:border-gray-500/70 hover:bg-gray-700/50'
                      }`}>
                        <div className="mb-2 text-blue-400">{option.icon}</div>
                        <div className="font-semibold text-white mb-1">{option.label}</div>
                        <div className="text-sm opacity-75">{option.description}</div>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Snippets List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Select Snippets ({selectedSnippets.size} selected)
                </h3>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2 modal-scroll">
                  {snippets.map((snippet) => (
                    <motion.label
                      key={snippet.id}
                      className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl cursor-pointer group hover:border-gray-500/70 hover:bg-gray-700/50 transition-all duration-300"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedSnippets.has(snippet.id)}
                          onChange={() => handleSnippetSelect(snippet.id)}
                          className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                            {snippet.title}
                          </h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                            {snippet.language}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Created: {new Date(snippet.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <motion.button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700/80 text-gray-200 rounded-xl border border-gray-600/50 hover:bg-gray-600/80 hover:border-gray-500/70 transition-all duration-300 font-semibold cursor-pointer flex items-center gap-1.5"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleExport}
                  disabled={selectedSnippets.size === 0}
                  className={`px-4 py-2 text-white rounded-xl border transition-all duration-300 font-semibold cursor-pointer flex items-center gap-1.5 ${
                    selectedSnippets.size === 0
                      ? 'bg-gray-600/50 border-gray-500/30 cursor-not-allowed opacity-50'
                      : 'bg-blue-600/90 border-blue-500/50 hover:bg-blue-600 hover:border-blue-400/70 hover:shadow-blue-500/25'
                  }`}
                  whileHover={selectedSnippets.size > 0 ? { scale: 1.02 } : {}}
                  whileTap={selectedSnippets.size > 0 ? { scale: 0.98 } : {}}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Export
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

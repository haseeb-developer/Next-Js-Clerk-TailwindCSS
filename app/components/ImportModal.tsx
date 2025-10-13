'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Snippet } from '@/lib/supabase'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSnippets: (snippets: Omit<Snippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => Promise<void>
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function ImportModal({ isOpen, onClose, onImportSnippets, onShowToast }: ImportModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<Omit<Snippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]>([])
  const [importFormat, setImportFormat] = useState<'json' | 'txt' | 'md'>('json')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const fileName = file.name.toLowerCase()
    
    // Determine format based on file extension
    if (fileName.endsWith('.json')) {
      setImportFormat('json')
    } else if (fileName.endsWith('.md')) {
      setImportFormat('md')
    } else if (fileName.endsWith('.txt')) {
      setImportFormat('txt')
    }

    setSelectedFile(file)
    parseFile(file)
  }

  const parseFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      try {
        let parsedData: Omit<Snippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = []
        
        if (importFormat === 'json') {
          parsedData = JSON.parse(content)
        } else if (importFormat === 'txt') {
          parsedData = parseTextFile(content)
        } else if (importFormat === 'md') {
          parsedData = parseMarkdownFile(content)
        }
        
        setPreviewData(Array.isArray(parsedData) ? parsedData : [])
      } catch {
        onShowToast('Error parsing file. Please check the format.', 'error')
        setPreviewData([])
      }
    }
    reader.readAsText(file)
  }

  const parseTextFile = (content: string) => {
    const snippets = []
    const sections = content.split('='.repeat(50))
    
    for (const section of sections) {
      if (section.trim()) {
        const lines = section.trim().split('\n')
        const title = lines[0]?.replace('=== ', '').replace(' ===', '') || 'Untitled'
        const language = lines[1]?.replace('Language: ', '') || 'Text'
        // const created = lines[2]?.replace('Created: ', '') || new Date().toLocaleDateString()
        const isPublic = lines[3]?.includes('Yes') || false
        
        let description = ''
        let tags: string[] = []
        let code = ''
        
        let codeStart = false
        for (let i = 4; i < lines.length; i++) {
          const line = lines[i]
          if (line.startsWith('Description: ')) {
            description = line.replace('Description: ', '')
          } else if (line.startsWith('Tags: ')) {
            tags = line.replace('Tags: ', '').split(', ').filter(Boolean)
          } else if (line === 'Code:') {
            codeStart = true
          } else if (codeStart) {
            code += line + '\n'
          }
        }
        
        snippets.push({
          title,
          description: description || undefined,
          code: code.trim(),
          language,
          tags: tags.length > 0 ? tags : undefined,
          is_public: isPublic
        })
      }
    }
    
    return snippets
  }

  const parseMarkdownFile = (content: string) => {
    const snippets = []
    const sections = content.split('---')
    
    for (const section of sections) {
      if (section.trim()) {
        const lines = section.trim().split('\n')
        const title = lines[0]?.replace('# ', '') || 'Untitled'
        
        let description = ''
        let language = 'Text'
        let isPublic = false
        let tags: string[] = []
        let code = ''
        let codeStart = false
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          if (line.startsWith('**Language:**')) {
            language = line.replace('**Language:** ', '')
          } else if (line.startsWith('**Description:**')) {
            description = line.replace('**Description:** ', '')
          } else if (line.startsWith('**Public:**')) {
            isPublic = line.includes('Yes')
          } else if (line.startsWith('**Tags:**')) {
            tags = line.replace('**Tags:** ', '').split(', ').filter(Boolean)
          } else if (line.startsWith('```')) {
            if (!codeStart) {
              language = line.replace('```', '') || language
              codeStart = true
            } else {
              codeStart = false
            }
          } else if (codeStart) {
            code += line + '\n'
          }
        }
        
        snippets.push({
          title,
          description: description || undefined,
          code: code.trim(),
          language,
          tags: tags.length > 0 ? tags : undefined,
          is_public: isPublic
        })
      }
    }
    
    return snippets
  }

  const handleImport = async () => {
    if (previewData.length === 0) {
      onShowToast('No valid snippets found to import', 'error')
      return
    }

    try {
      await onImportSnippets(previewData)
      onShowToast(`Successfully imported ${previewData.length} snippet(s)`, 'success')
      onClose()
    } catch {
      onShowToast('Error importing snippets', 'error')
    }
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
              <h2 className="text-2xl font-bold text-white">Import Snippets</h2>
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
              {/* Import Format Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Import Format</h3>
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
                        name="importFormat"
                        value={option.value}
                        checked={importFormat === option.value}
                        onChange={(e) => setImportFormat(e.target.value as 'json' | 'txt' | 'md')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        importFormat === option.value
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

              {/* File Upload Area */}
              <div className="mb-6">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-700/30'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.txt,.md"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                        <path d="M13 2v7h7"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-2">
                        {selectedFile ? selectedFile.name : 'Drop your file here or click to browse'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Supports JSON, TXT, and Markdown formats
                      </p>
                    </div>
                    
                    {selectedFile && (
                      <motion.button
                        onClick={() => {
                          setSelectedFile(null)
                          setPreviewData([])
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Remove File
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Preview ({previewData.length} snippets found)
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                    {previewData.slice(0, 5).map((snippet, index) => (
                      <div key={index} className="p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-semibold truncate">
                            {snippet.title || 'Untitled'}
                          </h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {snippet.language || 'Text'}
                          </span>
                        </div>
                        {snippet.description && (
                          <p className="text-gray-400 text-sm mb-2">{snippet.description}</p>
                        )}
                        <p className="text-gray-500 text-xs">
                          Code preview: {(snippet.code || '').substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                    {previewData.length > 5 && (
                      <p className="text-gray-400 text-sm text-center py-2">
                        ... and {previewData.length - 5} more snippets
                      </p>
                    )}
                  </div>
                </div>
              )}

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
                  onClick={handleImport}
                  disabled={previewData.length === 0}
                  className={`px-4 py-2 text-white rounded-xl border transition-all duration-300 font-semibold cursor-pointer flex items-center gap-1.5 ${
                    previewData.length === 0
                      ? 'bg-gray-600/50 border-gray-500/30 cursor-not-allowed opacity-50'
                      : 'bg-green-600/90 border-green-500/50 hover:bg-green-600 hover:border-green-400/70 hover:shadow-green-500/25'
                  }`}
                  whileHover={previewData.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={previewData.length > 0 ? { scale: 0.98 } : {}}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Import
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

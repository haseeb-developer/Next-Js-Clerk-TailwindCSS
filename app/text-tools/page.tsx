'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { Filter } from 'bad-words'

type TransformType = 
  | 'normal'
  | 'normal-advanced'
  | 'censor'
  | 'uppercase' 
  | 'lowercase' 
  | 'capitalize' 
  | 'sentence' 
  | 'title'
  | 'alternating'
  | 'inverse'
  | 'reverse'
  | 'remove-spaces'
  | 'add-spaces'
  | 'remove-linebreaks'
  | 'add-linebreaks'
  | 'remove-punctuation'
  | 'base64-encode'
  | 'base64-decode'
  | 'url-encode'
  | 'url-decode'
  | 'remove-duplicates'
  | 'sort-lines'
  | 'reverse-lines'
  | 'count-words'
  | 'count-characters'
  | 'count-lines'

export default function TextToolsPage() {
  const { user } = useUser()
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [selectedTransform, setSelectedTransform] = useState<TransformType>('normal')
  const [copied, setCopied] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [censoredCount, setCensoredCount] = useState(0)
  const [stats, setStats] = useState({
    characters: 0,
    words: 0,
    lines: 0,
    paragraphs: 0
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    updateStats()
    
    // Update censored count when text changes and censor is selected
    if (selectedTransform === 'censor' && outputText) {
      const censoredBlocks = outputText.match(/\*+/g) || []
      setCensoredCount(censoredBlocks.length)
    } else {
      setCensoredCount(0)
    }
  }, [inputText, outputText, selectedTransform])

  const updateStats = () => {
    setStats({
      characters: inputText.length,
      words: inputText.trim() ? inputText.trim().split(/\s+/).length : 0,
      lines: inputText.split('\n').length,
      paragraphs: inputText.trim() ? inputText.split(/\n\s*\n/).filter(p => p.trim()).length : 0
    })
  }

  const transformText = (text: string, transform: TransformType): string => {
    if (!text) return ''
    
    switch (transform) {
      case 'normal':
        // Simple text normalization: lowercase everything, capitalize after periods
        let simple = text.toLowerCase()
        // Capitalize first letter and letters after periods/exclamation/question marks
        simple = simple.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
        // Clean up extra spaces
        simple = simple.replace(/\s+/g, ' ').trim()
        return simple
      
      case 'normal-advanced':
        // Smart text normalization
        let normalized = text.toLowerCase()
        
        // Fix common contractions first
        normalized = normalized.replace(/\b(yk)\b/gi, "you know")
        normalized = normalized.replace(/\b(yeah)\b/gi, "yes")
        normalized = normalized.replace(/\b(yea)\b/gi, "yes")
        
        // Add spaces around punctuation if missing
        normalized = normalized.replace(/([.!?])([a-z])/g, '$1 $2')
        normalized = normalized.replace(/([a-z])([,;:])/g, '$1$2 ')
        
        // Detect question sentences and add question marks
        normalized = normalized.replace(/\b(what|where|when|why|how|who|which|whose|is|are|do|does|did|can|could|will|would|should)\b\s+([^.!?]+)(\.|$)/gi, (match, questionWord, rest, punctuation) => {
          // If it ends with a period and is a question, replace with ?
          if (rest.length > 0 && !rest.match(/^(a|an|the)\s/i)) {
            return questionWord + ' ' + rest.trim() + '?'
          }
          return match
        })
        
        // Capitalize first letter of sentences
        normalized = normalized.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
        
        // Add commas before conjunctions
        normalized = normalized.replace(/\s+(because|but|and|or|so)\s+/gi, ', $1 ')
        
        // Ensure proper spacing
        normalized = normalized.replace(/\s+/g, ' ').trim()
        
        return normalized
      
      case 'censor':
        // Use bad-words package to detect and censor profanity
        const filter = new Filter()
        return filter.clean(text)
      
      case 'uppercase':
        return text.toUpperCase()
      
      case 'lowercase':
        return text.toLowerCase()
      
      case 'capitalize':
        return text.replace(/\b\w/g, char => char.toUpperCase())
      
      case 'sentence':
        return text.replace(/([.!?]\s*|^)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
      
      case 'title':
        return text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
      
      case 'alternating':
        return text.split('').map((char, i) => 
          i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
        ).join('')
      
      case 'inverse':
        return text.split('').map(char => 
          char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
        ).join('')
      
      case 'reverse':
        return text.split('').reverse().join('')
      
      case 'remove-spaces':
        return text.replace(/\s+/g, '')
      
      case 'add-spaces':
        return text.replace(/(.)/g, '$1 ')
      
      case 'remove-linebreaks':
        return text.replace(/\n/g, ' ')
      
      case 'add-linebreaks':
        return text.replace(/([.!?])\s+/g, '$1\n')
      
      case 'remove-punctuation':
        return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      
      case 'base64-encode':
        try {
          return btoa(unescape(encodeURIComponent(text)))
        } catch {
          return 'Error encoding'
        }
      
      case 'base64-decode':
        try {
          return decodeURIComponent(escape(atob(text)))
        } catch {
          return 'Error decoding'
        }
      
      case 'url-encode':
        return encodeURIComponent(text)
      
      case 'url-decode':
        try {
          return decodeURIComponent(text)
        } catch {
          return 'Error decoding'
        }
      
      case 'remove-duplicates':
        return [...new Set(text.split('\n'))].join('\n')
      
      case 'sort-lines':
        return text.split('\n').sort().join('\n')
      
      case 'reverse-lines':
        return text.split('\n').reverse().join('\n')
      
      case 'count-words':
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
        return `Word count: ${wordCount}`
      
      case 'count-characters':
        return `Character count: ${text.length}`
      
      case 'count-lines':
        return `Line count: ${text.split('\n').length}`
      
      default:
        return text
    }
  }

  const handleTransform = () => {
    const transformed = transformText(inputText, selectedTransform)
    setOutputText(transformed)
  }

  const handleClear = () => {
    setInputText('')
    setOutputText('')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleRemoveCensored = () => {
    if (selectedTransform === 'censor' && outputText) {
      // Remove all words that contain asterisks (censored words)
      const cleaned = outputText.replace(/\S*\*+\S*/g, '').replace(/\s+/g, ' ').trim()
      setOutputText(cleaned)
    }
  }

  const transformOptions: { value: TransformType; label: string; icon: React.ReactElement }[] = [
    { 
      value: 'normal', 
      label: 'Normal', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    { 
      value: 'normal-advanced', 
      label: 'Normal Text (Advanced)', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    { 
      value: 'censor', 
      label: 'Censor Text', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    },
    { 
      value: 'uppercase', 
      label: 'Uppercase', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
    },
    { 
      value: 'lowercase', 
      label: 'Lowercase', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    },
    { 
      value: 'capitalize', 
      label: 'Capitalize', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
    },
    { 
      value: 'sentence', 
      label: 'Sentence Case', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    { 
      value: 'title', 
      label: 'Title Case', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
    },
    { 
      value: 'alternating', 
      label: 'Alternating Case', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    },
    { 
      value: 'inverse', 
      label: 'Inverse Case', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
    },
    { 
      value: 'reverse', 
      label: 'Reverse Text', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
    },
    { 
      value: 'remove-spaces', 
      label: 'Remove Spaces', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    },
    { 
      value: 'add-spaces', 
      label: 'Add Spaces', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
    },
    { 
      value: 'remove-linebreaks', 
      label: 'Remove Line Breaks', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
    },
    { 
      value: 'add-linebreaks', 
      label: 'Add Line Breaks', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    },
    { 
      value: 'remove-punctuation', 
      label: 'Remove Punctuation', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    },
    { 
      value: 'base64-encode', 
      label: 'Base64 Encode', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    },
    { 
      value: 'base64-decode', 
      label: 'Base64 Decode', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
    },
    { 
      value: 'url-encode', 
      label: 'URL Encode', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
    },
    { 
      value: 'url-decode', 
      label: 'URL Decode', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    },
    { 
      value: 'remove-duplicates', 
      label: 'Remove Duplicates', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
    },
    { 
      value: 'sort-lines', 
      label: 'Sort Lines', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
    },
    { 
      value: 'reverse-lines', 
      label: 'Reverse Lines', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
    },
    { 
      value: 'count-words', 
      label: 'Count Words', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
    },
    { 
      value: 'count-characters', 
      label: 'Count Characters', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    },
    { 
      value: 'count-lines', 
      label: 'Count Lines', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
    },
  ]

  const selectedOption = transformOptions.find(opt => opt.value === selectedTransform)

  return (
    <div className="min-h-[calc(100vh-5rem)] py-8">
      <div className="max-w-[2000px] mx-auto px-5">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Text Tools
          </h1>
          <p className="text-gray-400 text-lg">
            Transform your text with powerful utilities
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Characters</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.characters}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Words</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.words}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Lines</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.lines}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm font-medium">Paragraphs</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.paragraphs}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transform Dropdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative mb-8"
          ref={dropdownRef}
        >
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-[#111B32] border border-gray-700 rounded-3xl p-6 flex items-center justify-between hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                {selectedOption?.icon}
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-400">Select Transformation</p>
                <p className="text-lg font-bold text-white">{selectedOption?.label}</p>
              </div>
            </div>
            <motion.svg 
              className="w-6 h-6 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  duration: 0.2, 
                  ease: [0.4, 0, 0.2, 1],
                  staggerChildren: 0.05
                }}
                className="absolute top-full left-0 right-0 mt-3 bg-[#111B32] border border-gray-700 rounded-3xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto"
              >
                <div className="p-4 space-y-1">
                  {transformOptions.map((option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <motion.button
                        onClick={() => {
                          setSelectedTransform(option.value)
                          const transformed = transformText(inputText, option.value)
                          setOutputText(transformed)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          selectedTransform === option.value
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'hover:bg-gray-700/30 border border-transparent'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                          selectedTransform === option.value
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-700/30 text-gray-400'
                        }`}>
                          {option.icon}
                        </div>
                        <span className={`font-medium ${
                          selectedTransform === option.value ? 'text-blue-400' : 'text-gray-300'
                        }`}>
                          {option.label}
                        </span>
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Input and Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-gray-600/30 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Input Text</h3>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value)
                  const transformed = transformText(e.target.value, selectedTransform)
                  setOutputText(transformed)
                }}
                placeholder="Enter your text here..."
                className="w-full h-80 bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono"
              />
            </div>
          </motion.div>

          {/* Output Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-gray-600/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-white">Output Text</h3>
                {selectedTransform === 'censor' && censoredCount > 0 && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    Censored detected: {censoredCount} word{censoredCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedTransform === 'censor' && censoredCount > 0 && (
                  <button
                    onClick={handleRemoveCensored}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all duration-300 cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Remove Censored
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                      Copied to clipboard!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={outputText}
                readOnly
                placeholder="Transformed text will appear here..."
                className="w-full h-80 bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-gray-200 placeholder-gray-500 resize-none font-mono"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

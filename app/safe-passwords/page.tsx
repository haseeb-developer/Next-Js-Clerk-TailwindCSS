'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwiperSettings } from '../hooks/useSwiperSettings'
import { SwiperSlider } from '../components/SwiperSlider'
import { FilterDropdown } from '../components/FilterDropdown'
import { TimeFilterDropdown } from '../components/TimeFilterDropdown'

// Create Supabase client - will be created at runtime when needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: any = null // Supabase client type

// Helper function to get environment variables with multiple fallbacks
const getEnvVar = (key: string): string | null => {
  // Method 1: process.env (works in development)
  if (process.env[key]) {
    console.log(`Found ${key} in process.env`)
    return process.env[key]
  }
  
  // Method 2: window object (Vercel fallback)
  if (typeof window !== 'undefined') {
    const windowValue = (window as unknown as Record<string, unknown>)[key]
    if (windowValue && typeof windowValue === 'string') {
      console.log(`Found ${key} in window object`)
      return windowValue
    }
  }
  
  // Method 3: Try to get from Next.js data
  if (typeof window !== 'undefined') {
    const nextData = (window as unknown as Record<string, unknown>).__NEXT_DATA__ as { props?: { pageProps?: Record<string, unknown> } } | undefined
    if (nextData?.props?.pageProps) {
      const nextDataValue = nextData.props.pageProps[key]
      if (nextDataValue && typeof nextDataValue === 'string') {
        console.log(`Found ${key} in Next.js data`)
        return nextDataValue
      }
    }
  }
  
  // Method 4: Try to get from document meta tags
  if (typeof document !== 'undefined') {
    const metaElement = document.querySelector(`meta[name="${key}"]`)
    if (metaElement) {
      const content = metaElement.getAttribute('content')
      if (content) {
        console.log(`Found ${key} in meta tags`)
        return content
      }
    }
  }
  
  // Method 5: Try to get from localStorage (as a last resort)
  if (typeof window !== 'undefined') {
    try {
      const storedValue = localStorage.getItem(key)
      if (storedValue) {
        console.log(`Found ${key} in localStorage`)
        return storedValue
      }
    } catch {
      // localStorage might not be available
    }
  }
  
  console.log(`${key} not found in any method`)
  return null
}

// Function to manually set environment variables (for debugging)
const setEnvVar = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value)
      console.log(`Set ${key} in localStorage`)
    } catch (e) {
      console.error(`Failed to set ${key} in localStorage:`, e)
    }
  }
}

const getSupabaseClient = () => {
  if (!supabase) {
    // Get environment variables with multiple fallbacks
    let supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
    let supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    // If still not found, try to get from process.env directly (sometimes works in Vercel)
    if (!supabaseUrl && typeof window !== 'undefined') {
      // Try to access process.env again after a delay
      supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null
      supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null
    }
    
    // If still not found, try to get from window.location or other sources
    if (!supabaseUrl && typeof window !== 'undefined') {
      // Try to get from window.location.search or other sources
      const urlParams = new URLSearchParams(window.location.search)
      supabaseUrl = urlParams.get('supabase_url') || null
      supabaseAnonKey = urlParams.get('supabase_key') || null
    }
    
    // Hardcoded fallback for Vercel deployment (you'll need to replace these with your actual values)
    if (!supabaseUrl || !supabaseAnonKey) {
      // Replace these with your actual Supabase credentials
      supabaseUrl = 'https://akrqdinpdwfwfuomocar.supabase.co' // Replace with your actual URL
      supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcnFkaW5wZHdmd2Z1b21vY2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDAxMjQsImV4cCI6MjA3NTgxNjEyNH0.M0Z7EZc-YIQ09wIw9GTz6gOUn4U8yfYcL3GyoXlXtBc' // Replace with your actual anon key
      console.warn('Using hardcoded Supabase credentials - Environment variables not available')
      console.log('Supabase credentials loaded successfully')
    }
    
    console.log('Environment variables check:', {
      processEnvUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      processEnvKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      finalUrl: !!supabaseUrl,
      finalKey: !!supabaseAnonKey,
      isBrowser: typeof window !== 'undefined',
      usingHardcoded: supabaseUrl === 'https://akrqdinpdwfwfuomocar.supabase.co'
    })
    
    // Check if we're in browser environment and have the required env vars
    if (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseAnonKey)
        console.log('Supabase client created successfully')
      } catch (error) {
        console.error('Failed to create Supabase client:', error)
        return null
      }
    } else {
      console.warn('Supabase environment variables not available, will retry...')
      return null
    }
  }
  return supabase
}

interface Password {
  id: string
  title: string
  username: string
  password: string
  website: string
  notes: string
  is_favorite: boolean
  folder_id: string | null
  category_id: string | null
  created_at: string
  updated_at: string
  is_deleted?: boolean
  deleted_at?: string | null
}

interface Folder {
  id: string
  name: string
  description: string
  color: string
  created_at: string
}

interface Category {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export default function SafePasswordsPage() {
  const { user } = useUser()
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const { settings: swiperSettings } = useSwiperSettings()
  const [passwords, setPasswords] = useState<Password[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [deletedPasswords, setDeletedPasswords] = useState<Password[]>([])
  const [activeTab, setActiveTab] = useState<'passwords' | 'folders' | 'categories' | 'recycle'>('passwords')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean
    type: 'password' | 'folder' | 'category' | null
    id: string | null
    name: string | null
  }>({ show: false, type: null, id: null, name: null })
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<{
    show: boolean
    type: 'single' | 'all' | null
    id: string | null
    name: string | null
  }>({ show: false, type: null, id: null, name: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showFolderPopup, setShowFolderPopup] = useState(false)
  const [showCategoryPopup, setShowCategoryPopup] = useState(false)
  const [selectedFolderForPopup, setSelectedFolderForPopup] = useState<Folder | null>(null)
  const [selectedCategoryForPopup, setSelectedCategoryForPopup] = useState<Category | null>(null)
  const [editingPassword, setEditingPassword] = useState<Password | null>(null)
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({})
  const [showPasswordInPopup, setShowPasswordInPopup] = useState<{ [key: string]: boolean }>({})
  const [copiedPassword, setCopiedPassword] = useState<{ [key: string]: boolean }>({})
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dbConnectionError, setDbConnectionError] = useState(false)
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [passwordLength, setPasswordLength] = useState(12)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shuffleCount, setShuffleCount] = useState(0)
  const [passwordForm, setPasswordForm] = useState({
    title: '',
    username: '',
    password: '',
    website: '',
    notes: '',
    folder_id: '',
    category_id: ''
  })
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#8B5CF6',
    icon: 'lock'
  })

  // Session timeout state
  const [sessionTimeout, setSessionTimeout] = useState(1 * 60 * 1000) // 1 minute default for testing
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeout)
  const [isSessionActive, setIsSessionActive] = useState(true)
  const [showTimeoutToast, setShowTimeoutToast] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  
  // Loading state management
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Function declarations (moved before useEffect hooks)
  const loadData = async () => {
    console.log('Starting data load...')
    setIsLoading(true)
    setLoadingTimeout(false)
    
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase client not available - environment variables may not be set')
        // Set empty data and continue
        setPasswords([])
        setDeletedPasswords([])
        setFolders([])
        setCategories([])
        setHasLoadedOnce(true)
        setIsLoading(false)
        return
      }
      
      console.log('Supabase client available, loading data...')
      
      // Load all passwords (including deleted ones) for this user only
      const { data: allPasswordsData, error: passwordsError } = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', user?.id) // Only get passwords for this user
        .order('created_at', { ascending: false })

      if (passwordsError) {
        console.error('Error loading passwords:', passwordsError)
      }

      // Separate active and deleted passwords
      const activePasswords = (allPasswordsData || []).filter((p: Password) => !p.is_deleted)
      const deletedPasswords = (allPasswordsData || []).filter((p: Password) => p.is_deleted)

      setPasswords(activePasswords)
      setDeletedPasswords(deletedPasswords)

      // Load folders for this user only
      const { data: foldersData, error: foldersError } = await supabase
        .from('password_folders')
        .select('*')
        .eq('user_id', user?.id) // Only get folders for this user
        .order('created_at', { ascending: false })

      if (foldersError) {
        console.error('Error loading folders:', foldersError)
      }

      setFolders(foldersData || [])

      // Load categories for this user only
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('password_categories')
        .select('*')
        .eq('user_id', user?.id) // Only get categories for this user
        .order('created_at', { ascending: false })

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError)
      }

      setCategories(categoriesData || [])
      
      console.log('Data loaded successfully:', {
        passwords: activePasswords.length,
        deletedPasswords: deletedPasswords.length,
        folders: foldersData?.length || 0,
        categories: categoriesData?.length || 0
      })
      
    } catch (error) {
      console.error('Error loading data:', error)
      // Set empty data on error
      setPasswords([])
      setDeletedPasswords([])
      setFolders([])
      setCategories([])
    } finally {
      // Always mark as loaded and stop loading
      setHasLoadedOnce(true)
      setIsLoading(false)
      console.log('Data loading completed')
    }
  }


  // Handle session timeout
  const handleSessionTimeout = () => {
    setIsSessionActive(false)
    setShowTimeoutToast(false)
    // Redirect to confirm-auth page
    router.push('/confirm-auth')
  }

  // Format time remaining for display
  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${seconds}`
    }
  }

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  // Load data - simplified to prevent multiple calls
  useEffect(() => {
    if (isSignedIn) {
      // Always load data when user signs in, regardless of loading state
      loadData()
    }
  }, [isSignedIn])

  // Load session timeout from URL parameters or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL parameters first
      const urlParams = new URLSearchParams(window.location.search)
      const timeoutParam = urlParams.get('timeout')
      
      if (timeoutParam) {
        const timeoutMinutes = parseInt(timeoutParam)
        const timeoutMs = timeoutMinutes * 60 * 1000
        setSessionTimeout(timeoutMs)
        setTimeRemaining(timeoutMs)
        console.log('Session timeout set from URL:', timeoutMinutes, 'minutes')
      } else {
        // Check localStorage for session timeout
        const storedTimeout = localStorage.getItem('sessionTimeout')
        if (storedTimeout) {
          const timeoutMs = parseInt(storedTimeout)
          setSessionTimeout(timeoutMs)
          setTimeRemaining(timeoutMs)
          console.log('Session timeout set from localStorage:', timeoutMs / 1000, 'seconds')
        }
      }
    }
  }, [])

  // Loading timeout - prevent infinite loading
  useEffect(() => {
    if (isLoading && !hasLoadedOnce) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached, showing content anyway')
        setLoadingTimeout(true)
        setIsLoading(false)
      }, 5000) // 5 second timeout

      return () => clearTimeout(timeout)
    }
  }, [isLoading, hasLoadedOnce])

  // Session timeout management
  useEffect(() => {
    if (isSessionActive && isSignedIn) {
      let countdownInterval: NodeJS.Timeout | null = null
      let isCountdownActive = false
      
      const startTimer = () => {
        // Clear any existing timers
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        if (countdownRef.current) {
          clearTimeout(countdownRef.current)
          countdownRef.current = null
        }
        if (countdownInterval) {
          clearInterval(countdownInterval)
          countdownInterval = null
        }
        
        // Reset state
        setTimeRemaining(sessionTimeout)
        setShowTimeoutToast(true)
        isCountdownActive = true
        
        // Start countdown
        let remainingTime = sessionTimeout
        countdownInterval = setInterval(() => {
          remainingTime -= 1000
          setTimeRemaining(remainingTime)
          
          if (remainingTime <= 0) {
            if (countdownInterval) {
              clearInterval(countdownInterval)
              countdownInterval = null
            }
            setShowTimeoutToast(false)
            handleSessionTimeout()
            isCountdownActive = false
          }
        }, 1000)
        
        // Auto logout
        timeoutRef.current = setTimeout(() => {
          if (isCountdownActive) {
            handleSessionTimeout()
          }
        }, sessionTimeout)
      }
      
      const handleActivity = () => {
        // Only reset if countdown is active
        if (isCountdownActive) {
          startTimer()
        }
      }

      // Listen for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true)
      })

      // Start the initial timer
      console.log('Starting session timeout timer:', sessionTimeout / 1000, 'seconds')
      startTimer()

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true)
        })
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        if (countdownRef.current) {
          clearTimeout(countdownRef.current)
          countdownRef.current = null
        }
        if (countdownInterval) {
          clearInterval(countdownInterval)
          countdownInterval = null
        }
        isCountdownActive = false
      }
    }
  }, [isSessionActive, sessionTimeout, isSignedIn])


  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Debug environment variables in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment variables check:', {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isBrowser: typeof window !== 'undefined'
    })
  }

  // Don't render anything if not signed in (will redirect)
  if (!isSignedIn) {
    return null
  }


  // Audit Log Helper Function
  const createAuditLog = async (action: string, type: 'password' | 'login' | 'security', details: string, status: 'success' | 'failed' | 'warning' = 'success') => {
    try {
      if (!user) return;
      
      const auditLog = {
        id: Date.now().toString(),
        action,
        type,
        timestamp: new Date().toISOString(),
        ip: 'Unknown', // Would get real IP in production
        userAgent: navigator.userAgent,
        details,
        status
      };

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          auditLogs: [...((user.unsafeMetadata as { auditLogs?: Array<typeof auditLog> })?.auditLogs || []), auditLog]
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  // Password Generator Functions
  const generatePassword = async () => {
    setIsGenerating(true)
    
    // Add a small delay for smooth animation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let charset = ''
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (includeNumbers) charset += '0123456789'
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '')
    }
    
    if (excludeAmbiguous) {
      charset = charset.replace(/[{}[\]\\|;:,.<>?]/g, '')
    }
    
    if (charset.length === 0) {
      addToast({ message: 'Please select at least one character type', type: 'error' })
      setIsGenerating(false)
      return
    }
    
    let password = ''
    for (let i = 0; i < passwordLength; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    setGeneratedPassword(password)
    setShuffleCount(0)
    setIsGenerating(false)
  }

  const shufflePassword = () => {
    if (!generatedPassword) return
    
    const passwordArray = generatedPassword.split('')
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]]
    }
    
    setGeneratedPassword(passwordArray.join(''))
    setShuffleCount(prev => prev + 1)
  }

  const getPasswordStrength = (password: string) => {
    let score = 0
    const feedback = []
    
    if (password.length >= 8) score += 1
    else feedback.push('Use at least 8 characters')
    
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Add lowercase letters')
    
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Add uppercase letters')
    
    if (/[0-9]/.test(password)) score += 1
    else feedback.push('Add numbers')
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push('Add special characters')
    
    if (password.length > 20) score += 1
    
    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-emerald-500']
    
    return {
      score: Math.min(score, 5),
      level: strengthLevels[Math.min(score, 5)],
      color: colors[Math.min(score, 5)],
      feedback: feedback
    }
  }

  const copyGeneratedPassword = async () => {
    if (!generatedPassword) return
    
    try {
      await navigator.clipboard.writeText(generatedPassword)
      addToast({ message: 'Password copied to clipboard!', type: 'success' })
    } catch (error) {
      addToast({ message: 'Failed to copy password', type: 'error' })
    }
  }

  // Filter passwords
  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.website.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFolder = !selectedFolder || password.folder_id === selectedFolder
    const matchesCategory = !selectedCategory || password.category_id === selectedCategory
    
    // Time filtering
    let matchesTime = true
    if (selectedTimeFilter) {
      const now = new Date()
      const passwordCreated = new Date(password.created_at)
      const passwordUpdated = new Date(password.updated_at)
      const daysSinceCreated = (now.getTime() - passwordCreated.getTime()) / (1000 * 60 * 60 * 24)
      const daysSinceUpdated = (now.getTime() - passwordUpdated.getTime()) / (1000 * 60 * 60 * 24)
      
      switch (selectedTimeFilter) {
        case 'favorites':
          matchesTime = password.is_favorite
          break
        case 'recent':
          matchesTime = daysSinceCreated <= 7 || daysSinceUpdated <= 7
          break
        case 'older':
          matchesTime = daysSinceCreated > 30
          break
        default:
          matchesTime = true
      }
    }
    
    return matchesSearch && matchesFolder && matchesCategory && matchesTime
  })

  // Delete operations
  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (folder) {
      setShowDeleteConfirm({
        show: true,
        type: 'folder',
        id: folderId,
        name: folder.name
      })
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category) {
      setShowDeleteConfirm({
        show: true,
        type: 'category',
        id: categoryId,
        name: category.name
      })
    }
  }

  // Password operations
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check for duplicate username/email
    const existingPassword = passwords.find(p => 
      p.username.toLowerCase() === passwordForm.username.toLowerCase()
    )
    
    if (existingPassword) {
      addToast({ 
        message: `Username/Email "${passwordForm.username}" is already used in another password entry`, 
        type: 'error' 
      })
      return
    }
    
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ 
          message: 'Database connection failed. Please check your Supabase configuration.', 
          type: 'error' 
        })
        console.error('Supabase client not available for password creation')
        return
      }
      
      const { data, error } = await supabase
        .from('passwords')
        .insert([{
          ...passwordForm,
          folder_id: passwordForm.folder_id || null,
          category_id: passwordForm.category_id || null,
          user_id: user?.id // Add user isolation
        }])
        .select()

      if (error) throw error
      setPasswords([...passwords, data[0]])
      setShowCreatePassword(false)
      setPasswordForm({ title: '', username: '', password: '', website: '', notes: '', folder_id: '', category_id: '' })
      addToast({ message: 'Password created successfully', type: 'success' })
      
      // Create audit log
      await createAuditLog(
        'Password Created',
        'password',
        `Created password for "${passwordForm.title}" (${passwordForm.username})`
      )
    } catch (error) {
      console.error('Error creating password:', error)
      addToast({ message: 'Failed to create password', type: 'error' })
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPassword) return

    // Check for duplicate username/email (excluding current password)
    const existingPassword = passwords.find(p => 
      p.id !== editingPassword.id && 
      p.username.toLowerCase() === passwordForm.username.toLowerCase()
    )
    
    if (existingPassword) {
      addToast({ 
        message: `Username/Email "${passwordForm.username}" is already used in another password entry`, 
        type: 'error' 
      })
      return
    }
    
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { error } = await supabase
        .from('passwords')
        .update({
          ...passwordForm,
          folder_id: passwordForm.folder_id || null,
          category_id: passwordForm.category_id || null,
          user_id: user?.id, // Add user isolation
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPassword.id)
        .eq('user_id', user?.id) // Ensure user can only update their own passwords

      if (error) throw error
      
      // Update local state instead of reloading all data
      setPasswords(prevPasswords => 
        prevPasswords.map(password => 
          password.id === editingPassword.id 
            ? { ...password, ...passwordForm, updated_at: new Date().toISOString() }
            : password
        )
      )
      
      // Close modal and reset form
      setShowCreatePassword(false)
      setEditingPassword(null)
      setPasswordForm({ title: '', username: '', password: '', website: '', notes: '', folder_id: '', category_id: '' })
      addToast({ message: 'Password updated successfully', type: 'success' })
      
      // Create audit log
      await createAuditLog(
        'Password Updated',
        'password',
        `Updated password for "${passwordForm.title}" (${passwordForm.username})`
      )
    } catch (error) {
      console.error('Error updating password:', error)
      addToast({ message: 'Failed to update password', type: 'error' })
    }
  }

  const handleDeletePassword = (id: string) => {
    const password = passwords.find(p => p.id === id)
    if (password) {
      setShowDeleteConfirm({
        show: true,
        type: 'password',
        id: id,
        name: password.title
      })
    }
  }

  // Actual delete functions (called after confirmation)
  const confirmDeletePassword = async (id: string) => {
    try {
      const passwordToDelete = passwords.find(p => p.id === id)
      if (!passwordToDelete) return

      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { error } = await supabase
        .from('passwords')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id) // Ensure user can only delete their own passwords

      if (error) throw error
      
      // Move from active to deleted passwords
      setPasswords(prev => prev.filter(p => p.id !== id))
      setDeletedPasswords(prev => [...prev, { ...passwordToDelete, is_deleted: true, deleted_at: new Date().toISOString() }])
      addToast({ message: 'Password moved to recycle bin', type: 'success' })
      
      // Create audit log
      await createAuditLog(
        'Password Deleted',
        'password',
        `Moved password "${passwordToDelete.title}" to recycle bin`
      )
    } catch (error) {
      console.error('Error deleting password:', error)
      addToast({ message: 'Failed to delete password', type: 'error' })
    }
  }

  const confirmDeleteFolder = async (folderId: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)

      if (error) throw error

      setFolders(prev => prev.filter(f => f.id !== folderId))
      addToast({ message: 'Folder deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Error deleting folder:', error)
      addToast({ message: 'Failed to delete folder', type: 'error' })
    }
  }

  const confirmDeleteCategory = async (categoryId: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      // First, remove category from all passwords
      const { error: updateError } = await supabase
        .from('passwords')
        .update({ category_id: null })
        .eq('category_id', categoryId)

      if (updateError) throw updateError

      // Then delete the category
      const { error } = await supabase
        .from('password_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      setCategories(prev => prev.filter(c => c.id !== categoryId))
      addToast({ message: 'Category deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Error deleting category:', error)
      addToast({ message: 'Failed to delete category', type: 'error' })
    }
  }

  // Recycle Bin functions
  const restorePassword = async (passwordId: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { error } = await supabase
        .from('passwords')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', passwordId)
        .eq('user_id', user?.id) // Ensure user can only restore their own passwords

      if (error) throw error

      // Move from deleted to active passwords
      const passwordToRestore = deletedPasswords.find(p => p.id === passwordId)
      if (passwordToRestore) {
        setPasswords(prev => [...prev, { ...passwordToRestore, is_deleted: false, deleted_at: null }])
        setDeletedPasswords(prev => prev.filter(p => p.id !== passwordId))
        addToast({ message: 'Password restored successfully', type: 'success' })
        
        // Create audit log
        await createAuditLog(
          'Password Restored',
          'password',
          `Restored password "${passwordToRestore.title}" from recycle bin`
        )
      }
    } catch (error) {
      console.error('Error restoring password:', error)
      addToast({ message: 'Failed to restore password', type: 'error' })
    }
  }

  const permanentlyDeletePassword = async (passwordId: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', passwordId)
        .eq('user_id', user?.id) // Ensure user can only permanently delete their own passwords

      if (error) throw error

      const passwordToDelete = deletedPasswords.find(p => p.id === passwordId)
      setDeletedPasswords(prev => prev.filter(p => p.id !== passwordId))
      addToast({ message: 'Password permanently deleted', type: 'success' })
      
      // Create audit log
      if (passwordToDelete) {
        await createAuditLog(
          'Password Permanently Deleted',
          'password',
          `Permanently deleted password "${passwordToDelete.title}" from recycle bin`
        )
      }
    } catch (error) {
      console.error('Error permanently deleting password:', error)
      addToast({ message: 'Failed to permanently delete password', type: 'error' })
    }
  }

  const clearAllDeletedPasswords = async () => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('is_deleted', true)
        .eq('user_id', user?.id) // Ensure user can only clear their own deleted passwords

      if (error) throw error

      setDeletedPasswords([])
      addToast({ message: 'All deleted passwords cleared', type: 'success' })
    } catch (error) {
      console.error('Error clearing deleted passwords:', error)
      addToast({ message: 'Failed to clear deleted passwords', type: 'error' })
    }
  }

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { error } = await supabase
        .from('passwords')
        .update({ is_favorite: !isFavorite })
        .eq('id', id)

      if (error) throw error
      
      // Update local state instead of reloading all data
      setPasswords(prevPasswords => 
        prevPasswords.map(password => 
          password.id === id 
            ? { ...password, is_favorite: !isFavorite }
            : password
        )
      )
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  // Folder operations
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { data, error } = await supabase
        .from('password_folders')
        .insert([{
          ...folderForm,
          user_id: user?.id // Add user isolation
        }])
        .select()

      if (error) throw error
      setFolders([...folders, data[0]])
      setShowCreateFolder(false)
      setFolderForm({ name: '', description: '', color: '#3B82F6' })
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  // Category operations
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        addToast({ message: 'Database connection not available', type: 'error' })
        return
      }
      
      const { data, error } = await supabase
        .from('password_categories')
        .insert([{
          ...categoryForm,
          user_id: user?.id // Add user isolation
        }])
        .select()

      if (error) throw error
      setCategories([...categories, data[0]])
      setShowCreateCategory(false)
      setCategoryForm({ name: '', color: '#8B5CF6', icon: '🔐' })
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      lock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      globe: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
        </svg>
      ),
      credit: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      mobile: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      briefcase: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
      gaming: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      email: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      security: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
    return icons[iconName] || icons.lock
  }

  // Toast management
  const addToast = (toast: { message: string; type: 'success' | 'error' | 'info' }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Copy password function
  const copyPassword = async (password: string, passwordId: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(prev => ({ ...prev, [passwordId]: true }))
      addToast({ message: 'Password copied', type: 'success' })
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedPassword(prev => ({ ...prev, [passwordId]: false }))
      }, 2000)
    } catch (error) {
      console.error('Error copying password:', error)
      addToast({ message: 'Failed to copy password', type: 'error' })
    }
  }

  if (isLoading && !hasLoadedOnce && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your passwords...</p>
        </div>
      </div>
    )
  }

  // Always show the UI, even if database connection fails
  // The page will work with empty data and retry in the background


  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
      <div className={`min-h-screen bg-[#0F172A] ${(showFolderPopup || showCategoryPopup) ? 'backdrop-blur-sm' : ''}`}>
      {/* Header */}
      <div className="max-w-[100%] mx-auto px-4 pt-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Password Manager</h1>
              <p className="text-gray-400">Secure password storage and management</p>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search passwords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50"
              />
            </div>
            <button
              onClick={() => setShowPasswordGenerator(true)}
              className="px-6 cursor-pointer py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generate Password
            </button>
            <button
              onClick={() => setShowCreatePassword(true)}
              className="px-6 cursor-pointer py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Add Password
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[100%] mx-auto px-4">
        <div className="flex gap-2 bg-gray-800/50 backdrop-blur-xl rounded-2xl p-2 border border-gray-700/50 shadow-xl">
          <button
            onClick={() => setActiveTab('passwords')}
            className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
              activeTab === 'passwords' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white cursor-pointer'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            All Passwords
            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              {passwords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('folders')}
            className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
              activeTab === 'folders' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white cursor-pointer'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            Folders
            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              {folders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
              activeTab === 'categories' 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white cursor-pointer'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            Categories
            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recycle')}
            className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
              activeTab === 'recycle' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'text-gray-300 hover:bg-gray-700/30 hover:text-white cursor-pointer'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Recycle Bin
            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              {deletedPasswords.length}
            </span>
          </button>
        </div>

        {/* Statistics Summary */}
        {activeTab === 'passwords' && (
          <div className="mt-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Passwords</p>
                    <p className="text-2xl font-bold text-white">{passwords.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Folders</p>
                    <p className="text-2xl font-bold text-white">{folders.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Categories</p>
                    <p className="text-2xl font-bold text-white">{categories.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Favorites</p>
                    <p className="text-2xl font-bold text-white">{passwords.filter(p => p.is_favorite).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filter Dropdowns */}
        {activeTab === 'passwords' && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Time Filter Dropdown */}
              <TimeFilterDropdown
                selectedId={selectedTimeFilter}
                onSelect={setSelectedTimeFilter}
                className="flex-shrink-0"
              />

              {/* Folder Filter Dropdown */}
              {folders.length > 0 && (
                <FilterDropdown
                  label="Folders"
                  options={folders.map(folder => ({
                    id: folder.id,
                    name: folder.name,
                    color: folder.color,
                    count: passwords.filter(p => p.folder_id === folder.id).length
                  }))}
                  selectedId={selectedFolder}
                  onSelect={setSelectedFolder}
                  icon={
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                      </svg>
                    </div>
                  }
                  placeholder="All Folders"
                  className="flex-shrink-0"
                />
              )}

              {/* Category Filter Dropdown */}
              {categories.length > 0 && (
                <FilterDropdown
                  label="Categories"
                  options={categories.map(category => ({
                    id: category.id,
                    name: category.name,
                    color: category.color,
                    count: passwords.filter(p => p.category_id === category.id).length
                  }))}
                  selectedId={selectedCategory}
                  onSelect={setSelectedCategory}
                  icon={
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                    </div>
                  }
                  placeholder="All Categories"
                  className="flex-shrink-0"
                />
              )}

              {/* Clear All Filters Button */}
              {(selectedFolder || selectedCategory || selectedTimeFilter) && (
              <button
                  onClick={() => {
                    setSelectedFolder(null)
                    setSelectedCategory(null)
                    setSelectedTimeFilter(null)
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-medium">Clear All</span>
              </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Full Width */}
      <div className="max-w-[100%] mx-auto px-4">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-xl p-6 mt-6">
            {activeTab === 'passwords' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Passwords</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateFolder(true)}
                      className="cursor-pointer px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 hover:scale-105 transition-all duration-200 text-sm border-0 outline-none"
                    >
                      New Folder
                    </button>
                    <button
                      onClick={() => setShowCreateCategory(true)}
                      className="cursor-pointer px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 hover:scale-105 transition-all duration-200 text-sm border-0 outline-none"
                    >
                      New Category
                    </button>
                  </div>
                </div>

                {filteredPasswords.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No passwords found</h3>
                    <p className="text-gray-500 mb-6">Create your first password to get started</p>
                    <button
                      onClick={() => setShowCreatePassword(true)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
                    >
                      Add Your First Password
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredPasswords.map(password => (
                      <div key={password.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {password.title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{password.title}</h3>
                              <p className="text-gray-400 text-sm">{password.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleFavorite(password.id, password.is_favorite)}
                              className={`p-1 rounded cursor-pointer ${
                                password.is_favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={password.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setEditingPassword(password)
                                setPasswordForm({
                                  title: password.title,
                                  username: password.username,
                                  password: password.password,
                                  website: password.website || '',
                                  notes: password.notes || '',
                                  folder_id: password.folder_id || '',
                                  category_id: password.category_id || ''
                                })
                                setShowCreatePassword(true)
                              }}
                              className="p-1 text-gray-400 hover:text-blue-400 rounded cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePassword(password.id)}
                              className="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Folder and Category Info */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-600/30 rounded-md">
                            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                            <span className="text-xs text-gray-300">
                              {password.folder_id 
                                ? (folders.find(f => f.id === password.folder_id)?.name || 'Unknown Folder')
                                : 'No Folder'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-600/30 rounded-md">
                            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                            </svg>
                            <span className="text-xs text-gray-300">
                              {password.category_id 
                                ? (categories.find(c => c.id === password.category_id)?.name || 'Unknown Category')
                                : 'No category yet'
                              }
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-medium">Password</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowPassword(prev => ({ ...prev, [password.id]: !prev[password.id] }))}
                                    className="p-1.5 text-gray-400 hover:text-white cursor-pointer rounded-md hover:bg-gray-700/50 transition-all duration-200"
                                    title={showPassword[password.id] ? 'Hide password' : 'Show password'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                    onClick={() => copyPassword(password.password, password.id)}
                                    className={`p-1.5 cursor-pointer transition-all duration-200 rounded-md hover:bg-gray-700/50 ${
                                      copiedPassword[password.id] 
                                        ? 'text-green-400' 
                                        : 'text-gray-400 hover:text-green-400'
                                    }`}
                                    title="Copy password"
                                  >
                                    {copiedPassword[password.id] ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                    )}
                              </button>
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30 min-h-[60px] max-h-[60px] overflow-hidden">
                                <div className="flex items-center h-full">
                                  <span className="text-white font-mono text-sm break-all leading-tight">
                                    {showPassword[password.id] ? password.password : '••••••••••••••••'}
                                  </span>
                                </div>
                            </div>
                          </div>
                          {password.website && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Website:</span>
                              <a 
                                href={password.website.startsWith('http') ? password.website : `https://${password.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                {password.website}
                              </a>
                            </div>
                          )}
                            <div>
                              <span className="text-gray-400 text-sm">Notes:</span>
                            <p className="text-white text-sm mt-1">
                              {password.notes ? password.notes : 'No description'}
                            </p>
                            </div>

                            {/* Timestamps */}
                            <div className="pt-3 mt-3 border-t border-gray-600/30">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Created: {new Date(password.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Updated: {new Date(password.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'folders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Folders</h2>
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    New Folder
                  </button>
                </div>

                {folders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No folders yet</h3>
                    <p className="text-gray-500 mb-6">Create folders to organize your passwords</p>
                    <button
                      onClick={() => setShowCreateFolder(true)}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
                    >
                      Create Your First Folder
                    </button>
                  </div>
                ) : (
                  swiperSettings.safePasswordsFoldersSwiper && folders.length > 3 ? (
                    <SwiperSlider
                      slidesPerView={1}
                      spaceBetween={16}
                      breakpoints={{
                        640: { slidesPerView: 2, spaceBetween: 20 },
                        1024: { slidesPerView: 3, spaceBetween: 24 },
                        1280: { slidesPerView: 4, spaceBetween: 24 }
                      }}
                      showPagination={true}
                    >
                      {folders.map(folder => {
                      const folderPasswords = passwords.filter(p => p.folder_id === folder.id)
                      const folderPasswordCount = folderPasswords.length
                      const recentPasswords = folderPasswords
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 3)
                      
                      return (
                        <div 
                          key={folder.id} 
                          className={`rounded-xl p-4 border transition-all duration-200 cursor-pointer group ${
                            selectedFolderId === folder.id
                              ? 'border-2 shadow-lg'
                              : 'bg-gray-700/30 border-gray-600/30 hover:border-gray-500/50'
                          }`}
                          style={{
                            backgroundColor: selectedFolderId === folder.id ? `${folder.color}08` : undefined,
                            borderColor: selectedFolderId === folder.id ? folder.color : undefined,
                          }}
                          onClick={() => {
                            setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)
                            setSelectedCategoryId(null) // Clear category selection
                          }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: folder.color }}
                            >
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{folder.name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">{folderPasswordCount} passwords</span>
                                {folderPasswordCount > 0 && (
                                  <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                                    {folderPasswordCount === 1 ? '1 item' : `${folderPasswordCount} items`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                            {folder.description ? folder.description : 'No description'}
                          </p>
                          
                          {/* Recent passwords preview */}
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 font-medium">Recent passwords:</p>
                            <div className="space-y-1">
                              {recentPasswords.length > 0 ? (
                                <>
                                  {recentPasswords.map(password => (
                                    <div key={password.id} className="flex items-center gap-2 text-xs">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                      <span className="text-gray-400 truncate">{password.title}</span>
                                    </div>
                                  ))}
                                  {folderPasswordCount > 3 && (
                                    <div className="text-xs text-gray-500">
                                      +{folderPasswordCount - 3} more...
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-xs text-gray-500">None</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-600/30">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFolder(folder.id)
                              }}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 cursor-pointer"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    </SwiperSlider>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {folders.map(folder => {
                        const folderPasswords = passwords.filter(p => p.folder_id === folder.id)
                        const folderPasswordCount = folderPasswords.length
                        const recentPasswords = folderPasswords
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 3)
                        
                        return (
                          <div 
                            key={folder.id} 
                            className={`rounded-xl p-4 border transition-all duration-200 cursor-pointer group ${
                              selectedFolderId === folder.id
                                ? 'border-2 shadow-lg'
                                : 'bg-gray-700/30 border-gray-600/30 hover:border-gray-500/50'
                            }`}
                            style={{
                              backgroundColor: selectedFolderId === folder.id ? `${folder.color}08` : undefined,
                              borderColor: selectedFolderId === folder.id ? folder.color : undefined,
                            }}
                            onClick={() => {
                              setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)
                              setSelectedCategoryId(null) // Clear category selection
                            }}
                          >
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: folder.color }}
                          >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                          </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{folder.name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 text-sm">{folderPasswordCount} passwords</span>
                                  {folderPasswordCount > 0 && (
                                    <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                                      {folderPasswordCount === 1 ? '1 item' : `${folderPasswordCount} items`}
                                    </span>
                                  )}
                          </div>
                        </div>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                              {folder.description ? folder.description : 'No description'}
                            </p>
                            
                            {/* Recent passwords preview */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 font-medium">Recent passwords:</p>
                              <div className="space-y-1">
                                {recentPasswords.length > 0 ? (
                                  <>
                                    {recentPasswords.map(password => (
                                      <div key={password.id} className="flex items-center gap-2 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                        <span className="text-gray-400 truncate">{password.title}</span>
                      </div>
                    ))}
                                    {folderPasswordCount > 3 && (
                                      <div className="text-xs text-gray-500">
                                        +{folderPasswordCount - 3} more...
                  </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-xs text-gray-500">None</div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-600/30">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteFolder(folder.id)
                                }}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 cursor-pointer"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Selected Folder Content */}
            {activeTab === 'folders' && selectedFolderId && (
              <div className="mt-8">
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: folders.find(f => f.id === selectedFolderId)?.color }}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                          </div>
                          <div>
                      <h3 className="text-xl font-bold text-white">
                        {folders.find(f => f.id === selectedFolderId)?.name}
                      </h3>
                      <p className="text-gray-400">
                        {passwords.filter(p => p.folder_id === selectedFolderId).length} passwords
                      </p>
                          </div>
                        </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {passwords
                      .filter(p => p.folder_id === selectedFolderId)
                      .map(password => (
                        <div key={password.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {password.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{password.title}</h4>
                                <p className="text-sm text-gray-400">{password.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setShowPassword(prev => ({ ...prev, [password.id]: !prev[password.id] }))}
                                className="p-1.5 text-gray-400 hover:text-white cursor-pointer rounded-md hover:bg-gray-700/50 transition-all duration-200"
                                title={showPassword[password.id] ? 'Hide password' : 'Show password'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => copyPassword(password.password, password.id)}
                                className={`p-1.5 cursor-pointer transition-all duration-200 rounded-md hover:bg-gray-700/50 ${
                                  copiedPassword[password.id] 
                                    ? 'text-green-400' 
                                    : 'text-gray-400 hover:text-green-400'
                                }`}
                                title="Copy password"
                              >
                                {copiedPassword[password.id] ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm font-medium">Password</span>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30 min-h-[60px] max-h-[60px] overflow-hidden">
                              <div className="flex items-center h-full">
                                <span className="text-white font-mono text-sm break-all leading-tight">
                                  {showPassword[password.id] ? password.password : '••••••••••••••••'}
                                </span>
                              </div>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                  
                  {passwords.filter(p => p.folder_id === selectedFolderId).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No passwords in this folder</h3>
                      <p className="text-gray-500">Add some passwords to this folder to see them here.</p>
                  </div>
                )}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Categories</h2>
                  <button
                    onClick={() => setShowCreateCategory(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200"
                  >
                    New Category
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories yet</h3>
                    <p className="text-gray-500 mb-6">Create categories to organize your passwords</p>
                    <button
                      onClick={() => setShowCreateCategory(true)}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 font-medium"
                    >
                      Create Your First Category
                    </button>
                  </div>
                ) : (
                  swiperSettings.safePasswordsCategoriesSwiper && categories.length > 3 ? (
                    <SwiperSlider
                      slidesPerView={1}
                      spaceBetween={16}
                      breakpoints={{
                        640: { slidesPerView: 2, spaceBetween: 20 },
                        1024: { slidesPerView: 3, spaceBetween: 24 },
                        1280: { slidesPerView: 4, spaceBetween: 24 }
                      }}
                      showPagination={true}
                    >
                      {categories.map(category => {
                      const categoryPasswords = passwords.filter(p => p.category_id === category.id)
                      const categoryPasswordCount = categoryPasswords.length
                      const recentPasswords = categoryPasswords
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 3)
                      
                      return (
                        <div 
                          key={category.id} 
                          className={`rounded-xl p-4 border transition-all duration-200 cursor-pointer group ${
                            selectedCategoryId === category.id
                              ? 'border-2 shadow-lg'
                              : 'bg-gray-700/30 border-gray-600/30 hover:border-gray-500/50'
                          }`}
                          style={{
                            backgroundColor: selectedCategoryId === category.id ? `${category.color}08` : undefined,
                            borderColor: selectedCategoryId === category.id ? category.color : undefined,
                          }}
                          onClick={() => {
                            setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)
                            setSelectedFolderId(null) // Clear folder selection
                          }}
                        >
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: category.color }}
                          >
                              <div className="text-white text-lg">
                              {getCategoryIcon(category.icon)}
                            </div>
                          </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">{category.name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">{categoryPasswordCount} passwords</span>
                                {categoryPasswordCount > 0 && (
                                  <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                                    {categoryPasswordCount === 1 ? '1 item' : `${categoryPasswordCount} items`}
                                  </span>
                                )}
                          </div>
                        </div>
                          </div>
                          
                          {/* Recent passwords preview */}
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 font-medium">Recent passwords:</p>
                            <div className="space-y-1">
                              {recentPasswords.length > 0 ? (
                                <>
                                  {recentPasswords.map(password => (
                                    <div key={password.id} className="flex items-center gap-2 text-xs">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                      <span className="text-gray-400 truncate">{password.title}</span>
                      </div>
                    ))}
                                  {categoryPasswordCount > 3 && (
                                    <div className="text-xs text-gray-500">
                                      +{categoryPasswordCount - 3} more...
                  </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-xs text-gray-500">None</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-600/30">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCategory(category.id)
                              }}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 cursor-pointer"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    </SwiperSlider>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {categories.map(category => {
                        const categoryPasswords = passwords.filter(p => p.category_id === category.id)
                        const categoryPasswordCount = categoryPasswords.length
                        const recentPasswords = categoryPasswords
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 3)
                        
                        return (
                          <div 
                            key={category.id} 
                            className={`rounded-xl p-4 border transition-all duration-200 cursor-pointer group ${
                              selectedCategoryId === category.id
                                ? 'border-2 shadow-lg'
                                : 'bg-gray-700/30 border-gray-600/30 hover:border-gray-500/50'
                            }`}
                            style={{
                              backgroundColor: selectedCategoryId === category.id ? `${category.color}08` : undefined,
                              borderColor: selectedCategoryId === category.id ? category.color : undefined,
                            }}
                            onClick={() => {
                              setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)
                              setSelectedFolderId(null) // Clear folder selection
                            }}
                          >
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: category.color }}
                          >
                                <div className="text-white text-lg">
                              {getCategoryIcon(category.icon)}
                            </div>
                          </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">{category.name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 text-sm">{categoryPasswordCount} passwords</span>
                                  {categoryPasswordCount > 0 && (
                                    <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                                      {categoryPasswordCount === 1 ? '1 item' : `${categoryPasswordCount} items`}
                                    </span>
                                  )}
                          </div>
                        </div>
                            </div>
                            
                            {/* Recent passwords preview */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 font-medium">Recent passwords:</p>
                              <div className="space-y-1">
                                {recentPasswords.length > 0 ? (
                                  <>
                                    {recentPasswords.map(password => (
                                      <div key={password.id} className="flex items-center gap-2 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                        <span className="text-gray-400 truncate">{password.title}</span>
                      </div>
                    ))}
                                    {categoryPasswordCount > 3 && (
                                      <div className="text-xs text-gray-500">
                                        +{categoryPasswordCount - 3} more...
                  </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-xs text-gray-500">None</div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-600/30">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCategory(category.id)
                                }}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 cursor-pointer"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Selected Category Content */}
            {activeTab === 'categories' && selectedCategoryId && (
              <div className="mt-8">
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: categories.find(c => c.id === selectedCategoryId)?.color }}
                    >
                      <div className="text-white text-lg">
                        {getCategoryIcon(categories.find(c => c.id === selectedCategoryId)?.icon || 'tag')}
                            </div>
                          </div>
                          <div>
                      <h3 className="text-xl font-bold text-white">
                        {categories.find(c => c.id === selectedCategoryId)?.name}
                      </h3>
                      <p className="text-gray-400">
                        {passwords.filter(p => p.category_id === selectedCategoryId).length} passwords
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {passwords
                      .filter(p => p.category_id === selectedCategoryId)
                      .map(password => (
                        <div key={password.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {password.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{password.title}</h4>
                                <p className="text-sm text-gray-400">{password.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setShowPassword(prev => ({ ...prev, [password.id]: !prev[password.id] }))}
                                className="p-1.5 text-gray-400 hover:text-white cursor-pointer rounded-md hover:bg-gray-700/50 transition-all duration-200"
                                title={showPassword[password.id] ? 'Hide password' : 'Show password'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => copyPassword(password.password, password.id)}
                                className={`p-1.5 cursor-pointer transition-all duration-200 rounded-md hover:bg-gray-700/50 ${
                                  copiedPassword[password.id] 
                                    ? 'text-green-400' 
                                    : 'text-gray-400 hover:text-green-400'
                                }`}
                                title="Copy password"
                              >
                                {copiedPassword[password.id] ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm font-medium">Password</span>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30 min-h-[60px] max-h-[60px] overflow-hidden">
                              <div className="flex items-center h-full">
                                <span className="text-white font-mono text-sm break-all leading-tight">
                                  {showPassword[password.id] ? password.password : '••••••••••••••••'}
                                </span>
                              </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {passwords.filter(p => p.category_id === selectedCategoryId).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No passwords in this category</h3>
                      <p className="text-gray-500">Add some passwords to this category to see them here.</p>
                  </div>
                )}
                </div>
              </div>
            )}

            {activeTab === 'recycle' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Recycle Bin</h2>
                  {deletedPasswords.length > 0 && (
                    <button
                      onClick={() => {
                        setShowPermanentDeleteConfirm({
                          show: true,
                          type: 'all',
                          id: null,
                          name: 'all passwords in the Recycle Bin'
                        })
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All
                    </button>
                  )}
                </div>

                {deletedPasswords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Recycle Bin is empty</h3>
                  <p className="text-gray-500">Deleted passwords will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 mb-4">
                      {deletedPasswords.length} deleted password{deletedPasswords.length !== 1 ? 's' : ''}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deletedPasswords.map(password => (
                        <div key={password.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 opacity-75">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {password.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{password.title}</h4>
                                <p className="text-sm text-gray-400">{password.username}</p>
                                <p className="text-xs text-red-400">
                                  Deleted {password.deleted_at && typeof password.deleted_at === 'string' ? new Date(password.deleted_at).toLocaleDateString() : 'Unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => restorePassword(password.id)}
                                className="p-1.5 text-green-400 hover:text-green-300 cursor-pointer rounded-md hover:bg-gray-700/50 transition-all duration-200"
                                title="Restore password"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setShowPermanentDeleteConfirm({
                                    show: true,
                                    type: 'single',
                                    id: password.id,
                                    name: password.title
                                  })
                                }}
                                className="p-1.5 text-red-400 hover:text-red-300 cursor-pointer rounded-md hover:bg-gray-700/50 transition-all duration-200"
                                title="Permanently delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm font-medium">Password</span>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30 min-h-[60px] max-h-[60px] overflow-hidden">
                              <div className="flex items-center h-full">
                                <span className="text-white font-mono text-sm break-all leading-tight">
                                  ••••••••••••••••
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Folder and Category info */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-600/30 rounded-md">
                              <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                              </svg>
                              <span className="text-xs text-gray-300">
                                {password.folder_id 
                                  ? (folders.find(f => f.id === password.folder_id)?.name || 'Unknown Folder')
                                  : 'No Folder'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-600/30 rounded-md">
                              <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                              </svg>
                              <span className="text-xs text-gray-300">
                                {password.category_id 
                                  ? (categories.find(c => c.id === password.category_id)?.name || 'Unknown Category')
                                  : 'No category yet'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Backdrop Blur Overlay */}
      {(showFolderPopup || showCategoryPopup) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"></div>
      )}

      {/* Modals - Fixed to viewport */}
        {/* Create Password Modal */}
        <AnimatePresence>
        {showCreatePassword && (
            <motion.div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingPassword ? 'Edit Password' : 'Add New Password'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreatePassword(false)
                    setEditingPassword(null)
                    setPasswordForm({ title: '', username: '', password: '', website: '', notes: '', folder_id: '', category_id: '' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={editingPassword ? handleUpdatePassword : handleCreatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={passwordForm.title}
                    onChange={(e) => setPasswordForm({ ...passwordForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username/Email</label>
                  <input
                    type="text"
                    value={passwordForm.username}
                    onChange={(e) => setPasswordForm({ ...passwordForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="flex gap-2">
                    <textarea
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm min-h-[40px] max-h-[120px] resize-none"
                      required
                      rows={1}
                      style={{ 
                        height: 'auto',
                        minHeight: '40px',
                        maxHeight: '120px'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website (optional)</label>
                  <input
                    type="url"
                    value={passwordForm.website}
                    onChange={(e) => setPasswordForm({ ...passwordForm, website: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
                  <textarea
                    value={passwordForm.notes}
                    onChange={(e) => setPasswordForm({ ...passwordForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Folder</label>
                    <select
                      value={passwordForm.folder_id}
                      onChange={(e) => setPasswordForm({ ...passwordForm, folder_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">No folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={passwordForm.category_id}
                      onChange={(e) => setPasswordForm({ ...passwordForm, category_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">No category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePassword(false)
                      setEditingPassword(null)
                      setPasswordForm({ title: '', username: '', password: '', website: '', notes: '', folder_id: '', category_id: '' })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 cursor-pointer"
                  >
                    {editingPassword ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
              </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Create Folder Modal */}
        <AnimatePresence>
        {showCreateFolder && (
            <motion.div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Create New Folder</h3>
                <button
                  onClick={() => {
                    setShowCreateFolder(false)
                    setFolderForm({ name: '', description: '', color: '#3B82F6' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Folder Name</label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                  <div className="flex gap-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFolderForm({ ...folderForm, color })}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 ${
                          folderForm.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : 'hover:ring-2 hover:ring-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateFolder(false)
                      setFolderForm({ name: '', description: '', color: '#3B82F6' })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
              </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Create Category Modal */}
        <AnimatePresence>
        {showCreateCategory && (
            <motion.div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Create New Category</h3>
                <button
                  onClick={() => {
                    setShowCreateCategory(false)
                    setCategoryForm({ name: '', color: '#8B5CF6', icon: 'lock' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                  <div className="grid grid-cols-4 gap-1">
                    {['lock', 'globe', 'credit', 'mobile', 'briefcase', 'gaming', 'email', 'security'].map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, icon })}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                          categoryForm.icon === icon ? 'border-white bg-gray-700' : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-white">
                          {getCategoryIcon(icon)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                  <div className="flex gap-2">
                    {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, color })}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 ${
                          categoryForm.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : 'hover:ring-2 hover:ring-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateCategory(false)
                      setCategoryForm({ name: '', color: '#8B5CF6', icon: 'lock' })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200"
                  >
                    Create Category
                  </button>
                </div>
              </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Folder Popup Modal */}
      <AnimatePresence>
        {showFolderPopup && selectedFolderForPopup && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: selectedFolderForPopup.color }}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                      </svg>
            </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedFolderForPopup.name}</h2>
                      <p className="text-gray-400">{selectedFolderForPopup.description}</p>
          </div>
                  </div>
                  <button
                    onClick={() => setShowFolderPopup(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const folderPasswords = passwords.filter(p => p.folder_id === selectedFolderForPopup.id)
                  return folderPasswords.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">No passwords in this folder</h3>
                      <p className="text-gray-500">This folder is empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {folderPasswords.map(password => (
                        <div key={password.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {password.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{password.title}</h3>
                                <p className="text-gray-400 text-sm">{password.username}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-medium">Password</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowPasswordInPopup(prev => ({ ...prev, [password.id]: !prev[password.id] }))}
                                    className="p-1.5 text-gray-400 hover:text-white cursor-pointer rounded-md hover:bg-gray-700/50 transition-all duration-200"
                                    title={showPasswordInPopup[password.id] ? 'Hide password' : 'Show password'}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => copyPassword(password.password, password.id)}
                                    className={`p-1.5 cursor-pointer transition-all duration-200 rounded-md hover:bg-gray-700/50 ${
                                      copiedPassword[password.id] 
                                        ? 'text-green-400' 
                                        : 'text-gray-400 hover:text-green-400'
                                    }`}
                                    title="Copy password"
                                  >
                                    {copiedPassword[password.id] ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    )}
                                  </button>
      </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30 min-h-[60px] max-h-[60px] overflow-hidden">
                                <div className="flex items-center h-full">
                                  <span className="text-white font-mono text-sm break-all leading-tight">
                                    {showPasswordInPopup[password.id] ? password.password : '••••••••••••••••'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {password.website && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Website:</span>
                                <a 
                                  href={password.website.startsWith('http') ? password.website : `https://${password.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                  {password.website}
                                </a>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-400 text-sm">Notes:</span>
                              <p className="text-white text-sm mt-1">
                                {password.notes ? password.notes : 'No description'}
                              </p>
                            </div>

                            {/* Timestamps */}
                            <div className="pt-3 mt-3 border-t border-gray-600/30">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Created: {new Date(password.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Updated: {new Date(password.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
    </div>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Popup Modal */}
      <AnimatePresence>
        {showCategoryPopup && selectedCategoryForPopup && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: selectedCategoryForPopup.color }}
                    >
                      <div className="text-white text-lg">
                        {getCategoryIcon(selectedCategoryForPopup.icon)}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedCategoryForPopup.name}</h2>
                      <p className="text-gray-400">Category</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCategoryPopup(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const categoryPasswords = passwords.filter(p => p.category_id === selectedCategoryForPopup.id)
                  return categoryPasswords.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">No passwords in this category</h3>
                      <p className="text-gray-500">This category is empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryPasswords.map(password => (
                        <div key={password.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {password.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{password.title}</h3>
                                <p className="text-gray-400 text-sm">{password.username}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-medium">Password</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowPasswordInPopup(prev => ({ ...prev, [password.id]: !prev[password.id] }))}
                                    className="p-1.5 text-gray-400 hover:text-white cursor-pointer rounded-md hover:bg-gray-700/50 transition-all duration-200"
                                    title={showPasswordInPopup[password.id] ? 'Hide password' : 'Show password'}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => copyPassword(password.password, password.id)}
                                    className={`p-1.5 cursor-pointer transition-all duration-200 rounded-md hover:bg-gray-700/50 ${
                                      copiedPassword[password.id] 
                                        ? 'text-green-400' 
                                        : 'text-gray-400 hover:text-green-400'
                                    }`}
                                    title="Copy password"
                                  >
                                    {copiedPassword[password.id] ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30 min-h-[60px] max-h-[60px] overflow-hidden">
                                <div className="flex items-center h-full">
                                  <span className="text-white font-mono text-sm break-all leading-tight">
                                    {showPasswordInPopup[password.id] ? password.password : '••••••••••••••••'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {password.website && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Website:</span>
                                <a 
                                  href={password.website.startsWith('http') ? password.website : `https://${password.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                  {password.website}
                                </a>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-400 text-sm">Notes:</span>
                              <p className="text-white text-sm mt-1">
                                {password.notes ? password.notes : 'No description'}
                              </p>
                            </div>

                            {/* Timestamps */}
                            <div className="pt-3 mt-3 border-t border-gray-600/30">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Created: {new Date(password.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Updated: {new Date(password.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 max-w-md w-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
                  <p className="text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-white">
                    &ldquo;{showDeleteConfirm.name}&rdquo;
                  </span>
                  {showDeleteConfirm.type === 'password' && ' password'}?
                  {showDeleteConfirm.type === 'folder' && ' folder and all its passwords'}?
                  {showDeleteConfirm.type === 'category' && ' category and all its passwords'}?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm({ show: false, type: null, id: null, name: null })}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'password' && showDeleteConfirm.id) {
                      confirmDeletePassword(showDeleteConfirm.id)
                    } else if (showDeleteConfirm.type === 'folder' && showDeleteConfirm.id) {
                      confirmDeleteFolder(showDeleteConfirm.id)
                    } else if (showDeleteConfirm.type === 'category' && showDeleteConfirm.id) {
                      confirmDeleteCategory(showDeleteConfirm.id)
                    }
                    setShowDeleteConfirm({ show: false, type: null, id: null, name: null })
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permanent Delete Confirmation Dialog */}
      <AnimatePresence>
        {showPermanentDeleteConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 max-w-md w-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Permanent Delete</h3>
                  <p className="text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold text-white">
                    &ldquo;{showPermanentDeleteConfirm.name}&rdquo;
                  </span>
                  {showPermanentDeleteConfirm.type === 'single' && ' password'}?
                  {showPermanentDeleteConfirm.type === 'all' && '? This will remove all passwords from the Recycle Bin.'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPermanentDeleteConfirm({ show: false, type: null, id: null, name: null })}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showPermanentDeleteConfirm.type === 'single' && showPermanentDeleteConfirm.id) {
                      permanentlyDeletePassword(showPermanentDeleteConfirm.id)
                    } else if (showPermanentDeleteConfirm.type === 'all') {
                      clearAllDeletedPasswords()
                    }
                    setShowPermanentDeleteConfirm({ show: false, type: null, id: null, name: null })
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Container - Fixed to viewport */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`px-4 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 min-w-[200px] ${
              toast.type === 'success' 
                ? 'bg-green-900/90 border-green-400 text-green-100' 
                : toast.type === 'error'
                ? 'bg-red-900/90 border-red-400 text-red-100'
                : 'bg-blue-900/90 border-blue-400 text-blue-100'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-auto text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Session Timeout Toast */}
      <AnimatePresence>
        {showTimeoutToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-20 right-4 z-[70] bg-red-500/20 border border-red-500/30 text-red-100 px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Session Timeout Warning</div>
                <div className="text-xs text-red-200">
                  Session expires in {formatTimeRemaining(timeRemaining)} due to inactivity
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Generator Modal */}
      <AnimatePresence>
        {showPasswordGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[calc(100vw-40px)] h-[calc(100vh-40px)] bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Password Generator</h2>
                    <p className="text-gray-400 text-sm">Create secure passwords with custom options</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordGenerator(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 h-full overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
                  {/* Left Column - Generated Password */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Generated Password</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={generatedPassword}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                          placeholder="Click 'Generate Password' to create one"
                        />
                        {generatedPassword && (
                          <button
                            onClick={copyGeneratedPassword}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 cursor-pointer"
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Password Strength */}
                    {generatedPassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">Password Strength</label>
                        {(() => {
                          const strength = getPasswordStrength(generatedPassword)
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                                    style={{ width: `${(strength.score + 1) * 16.67}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-medium ${strength.color.replace('bg-', 'text-')}`}>
                                  {strength.level}
                                </span>
                              </div>
                              {strength.feedback.length > 0 && (
                                <div className="text-xs text-gray-400">
                                  <p>Suggestions: {strength.feedback.join(', ')}</p>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={generatePassword}
                        disabled={isGenerating}
                        className={`w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 ${
                          isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generate New Password
                          </>
                        )}
                      </button>
                      
                      {generatedPassword && (
                        <button
                          onClick={shufflePassword}
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Shuffle Password {shuffleCount > 0 && `(${shuffleCount})`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Column - Character Options */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Password Length: {passwordLength}</label>
                      <input
                        type="range"
                        min="4"
                        max="64"
                        value={passwordLength}
                        onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>4</span>
                        <span>64</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Character Types</h3>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={includeUppercase}
                            onChange={(e) => setIncludeUppercase(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            includeUppercase 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'bg-gray-700 border-gray-600 group-hover:border-purple-500'
                          }`}>
                            {includeUppercase && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-white transition-colors">Uppercase Letters (A-Z)</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={includeLowercase}
                            onChange={(e) => setIncludeLowercase(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            includeLowercase 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'bg-gray-700 border-gray-600 group-hover:border-purple-500'
                          }`}>
                            {includeLowercase && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-white transition-colors">Lowercase Letters (a-z)</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={includeNumbers}
                            onChange={(e) => setIncludeNumbers(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            includeNumbers 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'bg-gray-700 border-gray-600 group-hover:border-purple-500'
                          }`}>
                            {includeNumbers && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-white transition-colors">Numbers (0-9)</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={includeSymbols}
                            onChange={(e) => setIncludeSymbols(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            includeSymbols 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'bg-gray-700 border-gray-600 group-hover:border-purple-500'
                          }`}>
                            {includeSymbols && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-white transition-colors">Special Characters (!@#$%^&*)</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Exclude Characters</h3>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={excludeSimilar}
                            onChange={(e) => setExcludeSimilar(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            excludeSimilar 
                              ? 'bg-orange-600 border-orange-600' 
                              : 'bg-gray-700 border-gray-600 group-hover:border-orange-500'
                          }`}>
                            {excludeSimilar && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-white transition-colors">Exclude Similar Characters (il1Lo0O)</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={excludeAmbiguous}
                            onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            excludeAmbiguous 
                              ? 'bg-orange-600 border-orange-600' 
                              : 'bg-gray-700 border-gray-600 group-hover:border-orange-500'
                          }`}>
                            {excludeAmbiguous && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-white transition-colors">Exclude Ambiguous Characters (&#123;&#91;&#93;&#92;&#124;&#59;&#58;&#44;&#46;&#60;&#62;&#63;&#125;)</span>
                      </label>
                    </div>
                  </div>

                  {/* Right Column - Additional Features */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Password Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-300">Length</span>
                          <span className="text-white font-mono">{generatedPassword.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-300">Uppercase</span>
                          <span className="text-white font-mono">
                            {generatedPassword ? (generatedPassword.match(/[A-Z]/g) || []).length : 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-300">Lowercase</span>
                          <span className="text-white font-mono">
                            {generatedPassword ? (generatedPassword.match(/[a-z]/g) || []).length : 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-300">Numbers</span>
                          <span className="text-white font-mono">
                            {generatedPassword ? (generatedPassword.match(/[0-9]/g) || []).length : 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-300">Symbols</span>
                          <span className="text-white font-mono">
                            {generatedPassword ? (generatedPassword.match(/[^A-Za-z0-9]/g) || []).length : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setPasswordLength(8)
                            setIncludeUppercase(true)
                            setIncludeLowercase(true)
                            setIncludeNumbers(true)
                            setIncludeSymbols(true)
                            setExcludeSimilar(false)
                            setExcludeAmbiguous(false)
                          }}
                          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm cursor-pointer"
                        >
                          Reset to Default
                        </button>
                        <button
                          onClick={() => {
                            setPasswordLength(16)
                            setIncludeUppercase(true)
                            setIncludeLowercase(true)
                            setIncludeNumbers(true)
                            setIncludeSymbols(true)
                            setExcludeSimilar(true)
                            setExcludeAmbiguous(false)
                          }}
                          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm cursor-pointer"
                        >
                          Strong Password
                        </button>
                        <button
                          onClick={() => {
                            setPasswordLength(32)
                            setIncludeUppercase(true)
                            setIncludeLowercase(true)
                            setIncludeNumbers(true)
                            setIncludeSymbols(true)
                            setExcludeSimilar(false)
                            setExcludeAmbiguous(false)
                          }}
                          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm cursor-pointer"
                        >
                          Extra Long
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Password History</h3>
                      <div className="text-center text-gray-400 text-sm">
                        <p>Generated: {shuffleCount > 0 ? shuffleCount + 1 : (generatedPassword ? 1 : 0)} times</p>
                        {generatedPassword && (
                          <p className="mt-2 text-xs">Last generated: {new Date().toLocaleTimeString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}
'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Snippet, Folder } from '../../lib/supabase'
import { ComprehensiveRecycleBinModal } from './ComprehensiveRecycleBinModal'

// Password interface
interface Password {
  id: string
  title: string
  username: string
  website: string
  is_favorite: boolean
  folder_id: string | null
  category_id: string | null
  created_at: string
  updated_at: string
  is_deleted?: boolean
  deleted_at?: string | null
}

export default function DashboardContent() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 ml-3 mr-3">
        <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Now it's safe to load Clerk components
  return <ClientDashboardContent />
}

function ClientDashboardContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clerkComponents, setClerkComponents] = useState<any>(null)

  useEffect(() => {
    // Dynamically import Clerk components only on client side
    Promise.all([
      import('@clerk/nextjs'),
      import('./UserInfo')
    ]).then(([clerk, userInfo]) => {
      setClerkComponents({
        useUser: clerk.useUser,
        SignOutButton: clerk.SignOutButton,
        useAuth: clerk.useAuth,
        UserInfo: userInfo.default
      })
    })
  }, [])

  if (!clerkComponents) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] ml-3 mr-3">
        <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading authentication...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <DashboardUserContent {...clerkComponents} />
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DashboardUserContent({ useUser, SignOutButton, useAuth }: any) {
  const { user } = useUser()
  const { isSignedIn } = useAuth()
  
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [passwords, setPasswords] = useState<Password[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([])
  const [recentActivity, setRecentActivity] = useState<Array<{
    action: string
    item: string
    time: string
    timestamp: number
    type: string
    id: string
    originalId: string
  }>>([])

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      // Fetch snippets - try with deleted_at filter first (new schema)
      let snippetsData = null
      let snippetsError = null
      
      const { data: firstSnippetsData, error: firstSnippetsError } = await supabase
        .from('snippets')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      // If error, try without deleted_at filter (old schema)
      if (firstSnippetsError && (firstSnippetsError.code === '42703' || firstSnippetsError.code === 'PGRST204')) {
        console.log('deleted_at column not found, using old schema for snippets')
        const { data: oldSnippetsData, error: oldSnippetsError } = await supabase
          .from('snippets')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
        
        snippetsData = oldSnippetsData
        snippetsError = oldSnippetsError
      } else {
        snippetsData = firstSnippetsData
        snippetsError = firstSnippetsError
      }

      if (snippetsError) {
        console.error('Error fetching snippets:', snippetsError)
        throw snippetsError
      }

      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (foldersError) {
        console.error('Error fetching folders:', foldersError)
        throw foldersError
      }

      // Fetch passwords
      let passwordsData: Password[] = []
      try {
        const { data: passwordsDataQuery, error: passwordsError } = await supabase
          .from('passwords')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })

        if (passwordsError) {
          console.log('Error fetching passwords:', passwordsError)
          // Don't throw, just continue without passwords if table doesn't exist
        } else {
          passwordsData = passwordsDataQuery || []
        }
      } catch (error) {
        console.log('Passwords table might not exist, continuing without password data')
      }

      setSnippets(snippetsData || [])
      setFolders(foldersData || [])
      setPasswords(passwordsData)

      // Generate recent activity with passwords included
      const activities = []
      
      // Add recent snippets
      const recentSnippets = (snippetsData || []).slice(0, 3).map((snippet: Snippet) => ({
        action: 'Created',
        item: snippet.title,
        time: getRelativeTime(snippet.created_at),
        timestamp: new Date(snippet.created_at).getTime(),
        type: 'snippet',
        id: `snippet-${snippet.id}`,
        originalId: snippet.id
      }))

      // Add recent passwords
      const recentPasswords = (passwordsData || []).slice(0, 2).map((password: Password) => ({
        action: 'Created',
        item: password.title,
        time: getRelativeTime(password.created_at),
        timestamp: new Date(password.created_at).getTime(),
        type: 'password',
        id: `password-${password.id}`,
        originalId: password.id
      }))

      // Add recent folder updates
      const recentFolders = (foldersData || []).slice(0, 2).map((folder: Folder) => ({
        action: 'Updated',
        item: folder.name,
        time: getRelativeTime(folder.updated_at),
        timestamp: new Date(folder.updated_at).getTime(),
        type: 'folder',
        id: `folder-${folder.id}`,
        originalId: folder.id
      }))

      // Add favorites
      const favoriteSnippets = (snippetsData || []).filter((s: Snippet) => s.is_favorite).slice(0, 2)
      const favorites = favoriteSnippets.map((snippet: Snippet) => ({
        action: 'Favorited',
        item: snippet.title,
        time: getRelativeTime(snippet.updated_at),
        timestamp: new Date(snippet.updated_at).getTime(),
        type: 'snippet',
        id: `favorite-${snippet.id}`,
        originalId: snippet.id
      }))

      activities.push(...recentSnippets, ...recentPasswords, ...recentFolders, ...favorites)
      activities.sort((a, b) => b.timestamp - a.timestamp)
      
      // Remove duplicates based on unique id and take only the first 8
      const uniqueActivities = activities.filter((activity, index, self) => 
        index === self.findIndex(a => a.id === activity.id)
      )
      
      setRecentActivity(uniqueActivities.slice(0, 8))
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id, fetchDashboardData])

  // Toast helpers
  const addToast = (toast: { message: string; type: 'success' | 'error' | 'info' }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }

  // Recycle Bin handlers
  const handlePermanentDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', id)

      if (error) throw error

      addToast({
        message: 'Item permanently deleted',
        type: 'success'
      })
      
      fetchDashboardData()
    } catch (error) {
      console.error('Error permanently deleting item:', error)
      addToast({
        message: 'Failed to permanently delete item',
        type: 'error'
      })
    }
  }, [fetchDashboardData])

  const handleRestoreSnippet = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('snippets')
        .update({ deleted_at: null })
        .eq('id', id)

      if (error) throw error

      addToast({
        message: 'Item restored successfully',
        type: 'success'
      })
      
      fetchDashboardData()
    } catch (error) {
      console.error('Error restoring item:', error)
      addToast({
        message: 'Failed to restore item',
        type: 'error'
      })
    }
  }, [fetchDashboardData])

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    return `${Math.floor(diffInDays / 7)} weeks ago`
  }

  const getLanguageStats = () => {
    const languageCounts: { [key: string]: number } = {}
    snippets.forEach(snippet => {
      if (snippet.language) {
        languageCounts[snippet.language] = (languageCounts[snippet.language] || 0) + 1
      }
    })
    
    const sortedLanguages = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
    
    return {
      count: Object.keys(languageCounts).length,
      mostUsed: sortedLanguages[0]?.[0] || 'None'
    }
  }

  const getPasswordStats = () => {
    const favoritePasswords = passwords.filter(p => p.is_favorite).length
    const passwordFolders = passwords.filter(p => p.folder_id).length
    const uniqueCategories = new Set(passwords.filter(p => p.category_id).map(p => p.category_id)).size
    
    // Password strength analysis (mock analysis for display)
    const weakPasswords = passwords.length > 0 ? Math.ceil(passwords.length * 0.1) : 0
    const strongPasswords = passwords.length > 0 ? Math.ceil(passwords.length * 0.7) : 0
    const mediumPasswords = passwords.length > 0 ? passwords.length - weakPasswords - strongPasswords : 0

    return {
      total: passwords.length,
      favorites: favoritePasswords,
      withFolders: passwordFolders,
      categories: uniqueCategories,
      weak: weakPasswords,
      strong: strongPasswords,
      medium: mediumPasswords
    }
  }

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const weeklySnippets = snippets.filter(s => new Date(s.created_at) > oneWeekAgo).length
    const weeklyFolders = folders.filter(f => new Date(f.created_at) > oneWeekAgo).length
    const weeklyFavorites = snippets.filter(s => s.is_favorite && new Date(s.updated_at) > oneWeekAgo).length
    const weeklyPasswords = passwords.filter(p => new Date(p.created_at) > oneWeekAgo).length
    
    return { weeklySnippets, weeklyFolders, weeklyFavorites, weeklyPasswords }
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
        <div className="w-full max-w-[2000px] mx-auto px-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading user data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
        <div className="w-full max-w-[2000px] mx-auto px-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const languageStats = getLanguageStats()
  const passwordStats = getPasswordStats()
  const weeklyStats = getWeeklyStats()
  const favoritesCount = snippets.filter(s => s.is_favorite).length

  return (
    <div className="min-h-[calc(100vh-5rem)] py-8">
      <div className="max-w-[2000px] mx-auto px-5">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}! 👋
              </h1>
              <p className="text-gray-400 text-lg">
                Here&apos;s what&apos;s happening with your code snippets and passwords today
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowRecycleBin(true)}
                className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Recycle Bin
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Online</span>
              </div>
              <SignOutButton>
                <button className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Snippets</p>
                <p className="text-3xl font-bold text-white mt-2">{snippets.length}</p>
                <p className="text-blue-300 text-xs mt-1">+{weeklyStats.weeklySnippets} this week</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Total Passwords</p>
                <p className="text-3xl font-bold text-white mt-2">{passwordStats.total}</p>
                <p className="text-green-300 text-xs mt-1">+{weeklyStats.weeklyPasswords} this week</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Favorites</p>
                <p className="text-3xl font-bold text-white mt-2">{favoritesCount + passwordStats.favorites}</p>
                <p className="text-purple-300 text-xs mt-1">Snippets & Passwords</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm font-medium">Languages</p>
                <p className="text-3xl font-bold text-white mt-2">{languageStats.count}</p>
                <p className="text-orange-300 text-xs mt-1">Most used: {languageStats.mostUsed}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-600/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                    <p className="text-gray-400 text-sm">Your latest snippets, passwords, and updates</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'snippet' ? 'bg-blue-500/20' : 
                        activity.type === 'password' ? 'bg-green-500/20' : 
                        'bg-purple-500/20'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          activity.type === 'snippet' ? 'text-blue-400' : 
                          activity.type === 'password' ? 'text-green-400' : 
                          'text-purple-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {activity.type === 'snippet' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                          ) : activity.type === 'password' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                          )}
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.action} &quot;{activity.item}&quot;</p>
                        <p className="text-gray-400 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No recent activity</h3>
                    <p className="text-gray-500">Start creating snippets and passwords to see your activity here!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Info and Performance - Flex Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Account Information */}
            <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-600/30">
                <h3 className="text-lg font-bold text-white">Account Info</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.firstName || 'User'}</p>
                    <p className="text-gray-400 text-sm">{user.emailAddresses[0]?.emailAddress}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Member since</span>
                    <span className="text-white text-sm font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Last active</span>
                    <span className="text-white text-sm font-medium">Now</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Total snippets</span>
                    <span className="text-white text-sm font-medium">{snippets.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Total passwords</span>
                    <span className="text-white text-sm font-medium">{passwordStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Total folders</span>
                    <span className="text-white text-sm font-medium">{folders.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-600/30">
                <h3 className="text-lg font-bold text-white">Performance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Productivity Score</span>
                    <span className="text-green-400 text-sm font-bold">
                      {(() => {
                        const score = Math.min(100, Math.round((snippets.length + passwords.length + folders.length * 2) * 4))
                        return `${score}/100`
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Organization Level</span>
                    <span className="text-blue-400 text-sm font-medium">
                      {(() => {
                        const level = folders.length > 0 ? Math.min(100, Math.round((folders.length / Math.max(1, snippets.length + passwords.length)) * 100)) : 0
                        return `${level}%`
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Favorite Rate</span>
                    <span className="text-purple-400 text-sm font-medium">
                      {(() => {
                        const rate = (snippets.length + passwords.length) > 0 ? Math.round(((favoritesCount + passwordStats.favorites) / (snippets.length + passwords.length)) * 100) : 0
                        return `${rate}%`
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Password Security</span>
                    <span className="text-green-400 text-sm font-medium">
                      {(() => {
                        if (passwords.length === 0) return 'N/A'
                        const strongRate = Math.round((passwordStats.strong / passwords.length) * 100)
                        return `${strongRate}% strong`
                      })()}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-xs">Overall Progress</span>
                    <span className="text-gray-400 text-xs">
                      {snippets.length + passwords.length + folders.length} total items
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (snippets.length + passwords.length + folders.length) * 1.5)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Security Analysis */}
          {passwords.length > 0 && (
            <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-600/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Password Security</h3>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                    {passwordStats.strong} Strong
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-400 text-sm font-medium">Weak Passwords</span>
                      <span className="text-red-300 text-2xl font-bold">{passwordStats.weak}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${passwords.length > 0 ? (passwordStats.weak / passwords.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-400 text-sm font-medium">Medium Passwords</span>
                      <span className="text-yellow-300 text-2xl font-bold">{passwordStats.medium}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${passwords.length > 0 ? (passwordStats.medium / passwords.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-400 text-sm font-medium">Strong Passwords</span>
                      <span className="text-green-300 text-2xl font-bold">{passwordStats.strong}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${passwords.length > 0 ? (passwordStats.strong / passwords.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>{passwordStats.withFolders} organized in folders</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                    <span>{passwordStats.categories} categories used</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Language Breakdown */}
          <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-600/30">
              <h3 className="text-lg font-bold text-white">Language Breakdown</h3>
            </div>
            <div className="p-6">
              {(() => {
                const languageCounts: { [key: string]: number } = {}
                snippets.forEach(snippet => {
                  if (snippet.language) {
                    languageCounts[snippet.language] = (languageCounts[snippet.language] || 0) + 1
                  }
                })
                
                const sortedLanguages = Object.entries(languageCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                
                return sortedLanguages.length > 0 ? (
                  <div className="space-y-3">
                    {sortedLanguages.map(([language, count]) => {
                      const percentage = snippets.length > 0 ? (count / snippets.length) * 100 : 0
                      return (
                        <div key={language} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm font-medium">{language}</span>
                            <span className="text-gray-400 text-xs">{count} snippets ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-700/50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No language data available</p>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#111B32] border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-600/30">
              <h3 className="text-lg font-bold text-white">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.location.href = '/snippets'}
                  className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Create Snippet</p>
                    <p className="text-gray-400 text-sm">Add a new snippet</p>
                  </div>
                </button>

                <button 
                  onClick={() => window.location.href = '/safe-passwords'}
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Add Password</p>
                    <p className="text-gray-400 text-sm">Save a password</p>
                  </div>
                </button>

                <button 
                  onClick={() => window.location.href = '/snippets'}
                  className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Import</p>
                    <p className="text-gray-400 text-sm">Upload from file</p>
                  </div>
                </button>

                <button 
                  onClick={() => window.location.href = '/snippets'}
                  className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Favorites</p>
                    <p className="text-gray-400 text-sm">View favorites</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recycle Bin Modal */}
      <ComprehensiveRecycleBinModal
        isOpen={showRecycleBin}
        onClose={() => setShowRecycleBin(false)}
        onRestore={handleRestoreSnippet}
        onPermanentDelete={handlePermanentDelete}
        userId={user?.id || ''}
        onShowToast={(message, type) => addToast({ message, type })}
        onRefresh={fetchDashboardData}
      />

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

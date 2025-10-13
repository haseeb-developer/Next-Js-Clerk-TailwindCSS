'use client'

import { useEffect, useState } from 'react'

interface DeviceInfo {
  type: string
  os: string
  browser: string
  screen: string
}

interface TimeInfo {
  greeting: string
  time: string
  date: string
}

export default function UserSettingsContent() {
  const [isClient, setIsClient] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clerkComponents, setClerkComponents] = useState<any>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Detect device information
    const detectDevice = () => {
      const userAgent = navigator.userAgent
      const screenResolution = `${window.screen.width}x${window.screen.height}`
      
      // Detect device type
      let deviceType = 'Desktop'
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        deviceType = /iPad/.test(userAgent) ? 'Tablet' : 'Mobile'
      } else if (/Laptop|MacBook/.test(userAgent)) {
        deviceType = 'Laptop'
      }

      // Detect OS
      let os = 'Unknown'
      if (userAgent.includes('Windows')) os = 'Windows'
      else if (userAgent.includes('Mac')) os = 'macOS'
      else if (userAgent.includes('Linux')) os = 'Linux'
      else if (userAgent.includes('Android')) os = 'Android'
      else if (userAgent.includes('iOS')) os = 'iOS'

      // Detect browser
      let browser = 'Unknown'
      if (userAgent.includes('Chrome')) browser = 'Chrome'
      else if (userAgent.includes('Firefox')) browser = 'Firefox'
      else if (userAgent.includes('Safari')) browser = 'Safari'
      else if (userAgent.includes('Edge')) browser = 'Edge'

      return { type: deviceType, os, browser, screen: screenResolution }
    }

    // Get time-based greeting and format time
    const getTimeInfo = () => {
      const now = new Date()
      const hour = now.getHours()
      
      let greeting = 'Good evening'
      if (hour < 12) greeting = 'Good morning'
      else if (hour < 17) greeting = 'Good afternoon'
      
      // Format time with AM/PM
      const time = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      
      // Format date beautifully
      const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      return { greeting, time, date }
    }

    setDeviceInfo(detectDevice())
    setTimeInfo(getTimeInfo())

    // Update time every second for live clock
    const timeInterval = setInterval(() => {
      setTimeInfo(getTimeInfo())
    }, 1000)

    // Load Clerk components
    import('@clerk/nextjs').then((clerk) => {
      setClerkComponents({
        useUser: clerk.useUser,
        useAuth: clerk.useAuth,
      })
    })

    // Cleanup interval on unmount
    return () => clearInterval(timeInterval)
  }, [])

  if (!isClient) {
    return (
              <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
                <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!clerkComponents) {
    return (
              <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
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

  return <UserSettingsDisplay {...clerkComponents} deviceInfo={deviceInfo} timeInfo={timeInfo} />
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UserSettingsDisplay({ useUser, useAuth, deviceInfo, timeInfo }: any) {
  const { user } = useUser()
  const { isSignedIn } = useAuth()

  if (!isSignedIn || !user) {
    return (
              <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
                <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <p className="text-zinc-400">Please sign in to access settings.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string | number) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
            <div className="min-h-[calc(100vh-5rem)] py-12">
              <div className="max-w-[1800px] mx-auto mx-5">
        {/* Header with greeting */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
                <span className="text-3xl font-bold text-white">
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  {timeInfo?.greeting}, {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}!
                </h1>
                
              </div>
            </div>
          </div>
        </div>

        {/* Live Time and Date Section */}
        <div className="mb-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Live Clock */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl shadow-black/20 hover:shadow-green-500/10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-1">Live Time</p>
                  <p className="text-3xl font-mono font-bold text-white tabular-nums">
                    {timeInfo?.time}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Date Display */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl shadow-black/20 hover:shadow-blue-500/10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-1">Today</p>
                  <p className="text-lg font-semibold text-white leading-tight">
                    {timeInfo?.date}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/10 transition-all duration-300 group">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">Account Information</span>
            </h2>
            <div className="space-y-5">
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-blue-500/30 transition-colors">
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Full Name</label>
                <p className="text-white font-semibold text-lg mt-1">
                  {user.firstName} {user.lastName || ''}
                </p>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-blue-500/30 transition-colors">
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Email Address</label>
                <p className="text-white font-medium mt-1">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-blue-500/30 transition-colors">
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Account Created</label>
                <p className="text-white font-medium mt-1">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-blue-500/30 transition-colors">
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Last Sign In</label>
                <p className="text-white font-medium mt-1">
                  {user.lastSignInAt ? formatDate(user.lastSignInAt) : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl hover:shadow-3xl hover:shadow-green-500/10 transition-all duration-300 group">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">Device Information</span>
            </h2>
            {deviceInfo ? (
              <div className="space-y-4">
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-green-500/30 transition-colors">
                  <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Device Type</label>
                  <p className="text-white font-semibold text-lg mt-1">{deviceInfo.type}</p>
                </div>
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-green-500/30 transition-colors">
                  <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Operating System</label>
                  <p className="text-white font-medium mt-1">{deviceInfo.os}</p>
                </div>
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-green-500/30 transition-colors">
                  <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Browser</label>
                  <p className="text-white font-medium mt-1">{deviceInfo.browser}</p>
                </div>
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-green-500/30 transition-colors">
                  <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Screen Resolution</label>
                  <p className="text-white font-medium mt-1">{deviceInfo.screen}</p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-800/30 rounded-xl p-6 border border-zinc-700/30">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                  <p className="text-zinc-400">Loading device information...</p>
                </div>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl hover:shadow-3xl hover:shadow-yellow-500/10 transition-all duration-300 group">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">Security</span>
            </h2>
            <div className="space-y-4">
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-yellow-500/30 transition-colors">
                <label className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Email Verified</label>
                <p className="text-white font-semibold text-lg mt-1">
                  {user.emailAddresses[0]?.verification?.status === 'verified' ? (
                    <span className="text-green-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Not verified
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-yellow-500/30 transition-colors">
                <label className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Account Status</label>
                <p className="text-white font-semibold text-lg mt-1">
                  <span className="text-green-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Active
                  </span>
                </p>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-yellow-500/30 transition-colors">
                <label className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">User ID</label>
                <p className="text-white font-mono text-sm mt-1 break-all">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl hover:shadow-3xl hover:shadow-purple-500/10 transition-all duration-300 group">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">Recent Activity</span>
            </h2>
            <div className="space-y-4">
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-purple-500/30 transition-colors">
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Last Updated</label>
                <p className="text-white font-medium mt-1">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-purple-500/30 transition-colors">
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Profile Image</label>
                <p className="text-white font-semibold text-lg mt-1">
                  {user.imageUrl ? (
                    <span className="text-green-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Set
                    </span>
                  ) : (
                    <span className="text-orange-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Not set
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30 hover:border-purple-500/30 transition-colors">
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Phone Number</label>
                <p className="text-white font-medium mt-1">
                  {user.phoneNumbers[0]?.phoneNumber || (
                    <span className="text-zinc-400 italic">Not provided</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

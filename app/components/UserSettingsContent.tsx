'use client'

import { useEffect, useState } from 'react'
import { SwiperSettings } from './SwiperSettings'
import ErrorBoundary from './ErrorBoundary'

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
  const [clerkComponents, setClerkComponents] = useState<{
    UserProfile: React.ComponentType;
    UserButton: React.ComponentType;
  } | null>(null)
  const [clerkLoadError, setClerkLoadError] = useState(false)
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

    // Simplified Clerk loading
    const loadClerkComponents = () => {
      import('@clerk/nextjs')
        .then((clerk) => {
          setClerkComponents({
            UserProfile: clerk.UserProfile,
            UserButton: clerk.UserButton,
          });
        })
        .catch((error) => {
          console.error('Failed to load Clerk components:', error);
          setClerkLoadError(true);
        });
    };

    // Load with delay to prevent race conditions
    const clerkTimeout = setTimeout(loadClerkComponents, 200);

    // Cleanup interval and timeout on unmount
    return () => {
      clearInterval(timeInterval);
      clearTimeout(clerkTimeout);
    }
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

  // Show error state if Clerk failed to load
  if (clerkLoadError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
        <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Settings Unavailable</h2>
              <p className="text-zinc-400 mb-4">Unable to load user settings. Please refresh the page.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while Clerk components are loading
  if (!clerkComponents) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
        <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading user settings...</p>
              <p className="text-zinc-500 text-sm mt-2">This may take a moment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <UserSettingsDisplay 
        clerkComponents={clerkComponents}
        deviceInfo={deviceInfo} 
        timeInfo={timeInfo}
      />
    </ErrorBoundary>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UserSettingsDisplay({ clerkComponents, deviceInfo, timeInfo }: any) {
  // Show loading if Clerk components are not available
  if (!clerkComponents) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
        <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading user data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Use the Clerk components directly
  const { UserProfile, UserButton } = clerkComponents

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12">
      <div className="max-w-[1800px] mx-auto mx-5">
        {/* Header with greeting */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
                <span className="text-3xl font-bold text-white">
                  U
                </span>
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  {timeInfo?.greeting}, Welcome!
                </h1>
                
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Account Management</h2>
            </div>
            
            <div className="text-center">
              <UserProfile />
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
      </div>
    </div>
  )
}
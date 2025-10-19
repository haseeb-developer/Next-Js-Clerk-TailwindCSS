'use client'

import { useEffect, useState } from 'react'
import { SwiperSettings } from './SwiperSettings'

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

// Device Management Section Component
interface User {
  id: string;
  unsafeMetadata?: {
    activeSessions?: Array<{
      id: string;
      device: string;
      browser: string;
      location: string;
      lastActive: string;
      current: boolean;
    }>;
    auditLogs?: Array<{
      id: string;
      action: string;
      type: 'password' | 'login' | 'security';
      timestamp: string;
      ip: string;
      userAgent: string;
      details: string;
      status: 'success' | 'failed' | 'warning';
    }>;
  };
}

function DeviceManagementSection({ user }: { user: User }) {
  const [activeSessions, setActiveSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingDevice, setRevokingDevice] = useState<string | null>(null);

  interface DeviceSession {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    current: boolean;
  }

  useEffect(() => {
    // Load active sessions from user metadata
    const loadActiveSessions = () => {
      try {
        const sessions = user?.unsafeMetadata?.activeSessions || [];
        setActiveSessions(sessions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading active sessions:', error);
        setIsLoading(false);
      }
    };

    loadActiveSessions();
  }, [user]);

  const handleRevokeDevice = async (deviceId: string) => {
    setRevokingDevice(deviceId);
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/revoke-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        // Remove the device from the list
        setActiveSessions(prev => prev.filter(session => session.id !== deviceId));
        alert('Device session revoked successfully');
      } else {
        alert('Failed to revoke device session');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out');
        alert('Request timed out. Please try again.');
      } else {
        console.error('Error revoking device:', error);
        alert('Failed to revoke device session');
      }
    } finally {
      setRevokingDevice(null);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'Mobile') {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </div>
      );
    } else if (device === 'Tablet') {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
      );
    }
  };

  const formatLastActive = (lastActive: string) => {
    const now = new Date();
    const active = new Date(lastActive);
    const diffMs = now.getTime() - active.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusColor = (lastActive: string, current: boolean) => {
    if (current) return 'text-green-400';
    const now = new Date();
    const active = new Date(lastActive);
    const diffMs = now.getTime() - active.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 1) return 'text-green-400';
    if (diffHours < 24) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusText = (lastActive: string, current: boolean) => {
    if (current) return 'Active now';
    const now = new Date();
    const active = new Date(lastActive);
    const diffMs = now.getTime() - active.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 1) return 'Recently active';
    if (diffHours < 24) return 'Active today';
    return 'Inactive';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
            Device Management
          </span>
        </h2>
        <div className="text-sm text-zinc-400">
          {activeSessions.length} device{activeSessions.length !== 1 ? 's' : ''} connected
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
            <p className="text-zinc-400">Loading devices...</p>
          </div>
        </div>
      ) : activeSessions.length > 0 ? (
        <div className="grid gap-4">
          {activeSessions.map((session, index) => (
            <div
              key={session.id}
              className={`group relative bg-zinc-800/40 rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg ${
                session.current 
                  ? 'border-cyan-500/50 shadow-cyan-500/10 bg-gradient-to-r from-cyan-500/5 to-transparent' 
                  : 'border-zinc-700/50 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center gap-4">
                {getDeviceIcon(session.device)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-lg">
                      {session.device} {session.current && '(Current)'}
                    </h3>
                    {session.current && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
                      </svg>
                      {session.browser}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {session.location}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getStatusColor(session.lastActive, session.current)}`}>
                      {getStatusText(session.lastActive, session.current)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatLastActive(session.lastActive)}
                    </span>
                  </div>
                </div>

                         {!session.current && (
                           <button 
                             onClick={() => handleRevokeDevice(session.id)}
                             disabled={revokingDevice === session.id}
                             className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {revokingDevice === session.id ? (
                               <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                             ) : (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path d="M6 18L18 6M6 6l12 12"/>
                               </svg>
                             )}
                           </button>
                         )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No devices found</h3>
          <p className="text-zinc-400">Your active devices will appear here when you sign in from different devices.</p>
        </div>
      )}

      {/* Security Note */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div>
            <h4 className="text-yellow-400 font-semibold text-sm mb-1">Security Notice</h4>
            <p className="text-yellow-300/80 text-xs leading-relaxed">
              If you see any unfamiliar devices, revoke access immediately. Each device represents an active session where your account is signed in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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

    // Load Clerk components with timeout
    const loadClerkComponents = async () => {
      try {
        const clerk = await import('@clerk/nextjs');
        setClerkComponents({
          UserProfile: clerk.UserProfile,
          UserButton: clerk.UserButton,
        });
      } catch (error) {
        console.error('Failed to load Clerk components:', error);
        setClerkLoadError(true);
      }
    };

    // Set a timeout for Clerk loading
    const clerkTimeout = setTimeout(() => {
      if (!clerkComponents) {
        console.error('Clerk components failed to load within timeout');
        setClerkLoadError(true);
      }
    }, 10000); // 10 second timeout

    loadClerkComponents();

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


      return <UserSettingsDisplay 
        {...clerkComponents} 
        deviceInfo={deviceInfo} 
        timeInfo={timeInfo}
      />
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

        {/* Display Settings */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl">
                <SwiperSettings />
          </div>
        </div>

        {/* Device Management Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl">
            <DeviceManagementSection user={user} />
          </div>
        </div>

        {/* Audit Logs Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700/50 shadow-2xl">
            <AuditLogsSection user={user} />
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

// Audit Logs Section Component
function AuditLogsSection({ user }: { user: User }) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'password' | 'login' | 'security'>('all');

  interface AuditLog {
    id: string;
    action: string;
    type: 'password' | 'login' | 'security';
    timestamp: string;
    ip: string;
    userAgent: string;
    details: string;
    status: 'success' | 'failed' | 'warning';
  }

  useEffect(() => {
    // Load audit logs from user metadata
    const loadAuditLogs = () => {
      try {
        const logs = user?.unsafeMetadata?.auditLogs || [];
        setAuditLogs(logs);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading audit logs:', error);
        setIsLoading(false);
      }
    };

    loadAuditLogs();
  }, [user]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'password':
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
        );
      case 'login':
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
          </div>
        );
      case 'security':
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredLogs = auditLogs.filter(log => filter === 'all' || log.type === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
            Audit Logs
          </span>
        </h2>
        <div className="text-sm text-zinc-400">
          {auditLogs.length} total events
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All', count: auditLogs.length },
          { key: 'password', label: 'Passwords', count: auditLogs.filter(log => log.type === 'password').length },
          { key: 'login', label: 'Login', count: auditLogs.filter(log => log.type === 'login').length },
          { key: 'security', label: 'Security', count: auditLogs.filter(log => log.type === 'security').length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as 'all' | 'password' | 'login' | 'security')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === key
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            <p className="text-zinc-400">Loading audit logs...</p>
          </div>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50 hover:border-purple-500/30 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                {getActionIcon(log.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm">{log.action}</h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(log.status)}
                      <span className={`text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 text-xs mb-2">{log.details}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {log.ip}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No audit logs found</h3>
          <p className="text-zinc-400">Your security events will appear here as they occur.</p>
        </div>
      )}
    </div>
  );
}

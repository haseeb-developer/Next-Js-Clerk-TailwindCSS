'use client'

import { useEffect, useState } from 'react'

export default function DashboardContent() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
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

  return <DashboardUserContent {...clerkComponents} />
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DashboardUserContent({ useUser, SignOutButton, useAuth }: any) {
  const { user } = useUser()
  const { isSignedIn } = useAuth()

  if (!isSignedIn || !user) {
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

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
      <div className="w-full max-w-[1800px] mx-auto mx-5">
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-3xl font-bold text-white">
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}!
              </h1>
              <p className="text-zinc-400 text-base">
                You&apos;re successfully logged in to your dashboard
              </p>
            </div>
            
            <div className="space-y-4 mt-8">
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h2 className="text-sm font-medium text-zinc-400 mb-2">Email</h2>
                <p className="text-white font-medium">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h2 className="text-sm font-medium text-zinc-400 mb-2">Account Status</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-white font-medium">Active</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800">
              <SignOutButton>
                <button className="w-full sm:w-auto px-8 py-3 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

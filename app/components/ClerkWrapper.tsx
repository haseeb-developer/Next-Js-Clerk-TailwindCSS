'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ProtectedLink } from './ProtectedLink'
import { UnsavedChangesAlert } from './UnsavedChangesAlert'
import { useNavigation } from '../contexts/NavigationContext'
import ToolsDropdown from './ToolsDropdown'

export default function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    // Server-side rendering fallback
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-zinc-900/95 via-zinc-800/90 to-zinc-900/95 border-b border-zinc-700/30 shadow-2xl shadow-black/20">
          <div className="max-w-[1700px] mx-auto px-4 py-6">
            <div className="flex justify-between items-center h-20">
              <ProtectedLink 
                href="/dashboard" 
                className="flex items-center gap-3 text-xl font-bold text-white hover:text-indigo-400 transition-all duration-300 group"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50">
                    <span className="text-lg font-bold text-white font-montserrat">CS</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
                </div>
                <div className="hidden sm:block">
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent font-extrabold text-2xl font-montserrat">
                    Code Snippet V1
                  </span>
                  <div className="text-xs text-zinc-400 font-normal font-poppins">Professional Code Management</div>
                </div>
              </ProtectedLink>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    )
  }

  // Client-side only - import Clerk components dynamically
  return <ClientClerkWrapper>{children}</ClientClerkWrapper>
}

function ClientClerkWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    showUnsavedAlert, 
    handleUnsavedAlertConfirm, 
    handleUnsavedAlertCancel, 
    handleAlertSave 
  } = useNavigation()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ClerkProvider, setClerkProvider] = useState<React.ComponentType<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [SignInButton, setSignInButton] = useState<React.ComponentType<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [SignUpButton, setSignUpButton] = useState<React.ComponentType<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [SignedIn, setSignedIn] = useState<React.ComponentType<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [SignedOut, setSignedOut] = useState<React.ComponentType<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [UserButton, setUserButton] = useState<React.ComponentType<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [UserInfo, setUserInfo] = useState<React.ComponentType<any> | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  // Helper function to check if a link is active
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  useEffect(() => {
    // Dynamically import Clerk components only on client side
    import('@clerk/nextjs').then((clerk) => {
      setClerkProvider(() => clerk.ClerkProvider)
      setSignInButton(() => clerk.SignInButton)
      setSignUpButton(() => clerk.SignUpButton)
      setSignedIn(() => clerk.SignedIn)
      setSignedOut(() => clerk.SignedOut)
      setUserButton(() => clerk.UserButton)
    })
    
    import('./UserInfo').then((userInfo) => {
      setUserInfo(() => userInfo.default)
    })
    
    // Check if user is in guest mode
    const guestMode = localStorage.getItem('guestMode')
    const username = localStorage.getItem('guestUsername')
    
    if (guestMode === 'true' && username) {
      setIsGuest(true)
      
      // Redirect guest users away from auth pages
      if (pathname === '/sign-in' || pathname === '/sign-up') {
        router.push('/guest-mode-snippets')
      }
    } else {
      setIsGuest(false)
    }
  }, [pathname, router])

  const handleGuestSignOut = () => {
    localStorage.removeItem('guestMode')
    localStorage.removeItem('guestUsername')
    setIsGuest(false)
    router.push('/')
  }

  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!clerkPublishableKey || !ClerkProvider) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800/50">
          <div className="max-w-[1700px] mx-auto px-4 py-6">
            <div className="flex justify-between items-center h-16">
              <ProtectedLink 
                href="/dashboard" 
                className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-400 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-sm font-bold text-white font-montserrat">CS</span>
                  </div>
                  <span className="hidden sm:block">Code Snippet V1</span>
                </div>
              </ProtectedLink>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    )
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-zinc-900/95 via-zinc-800/90 to-zinc-900/95 border-b border-zinc-700/30 shadow-2xl shadow-black/20">
          <div className="max-w-[1700px] mx-auto px-4">
            <div className="flex justify-between items-center h-20">
              {/* Logo Section */}
              <ProtectedLink
                href="/dashboard"
                className="flex items-center gap-3 text-xl font-bold text-white hover:text-indigo-400 transition-all duration-300 group"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50">
                    <span className="text-lg font-bold text-white font-montserrat">CS</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
                </div>
                <div className="hidden sm:block">
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent font-extrabold text-2xl font-montserrat">
                    Code Snippet v1
                  </span>
                  <div className="text-xs text-zinc-400 font-normal font-poppins">Professional Code Management</div>
                </div>
              </ProtectedLink>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-8">
                {isGuest ? (
                  <div className="flex items-center gap-4">
                    <ProtectedLink href="/guest-mode-snippets">
                      <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                        pathname === '/guest-mode-snippets'
                          ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                      }`}>
                        Snippets
                      </button>
                    </ProtectedLink>
                    <button
                      onClick={handleGuestSignOut}
                      className="px-6 py-3 text-sm font-semibold text-red-400 hover:text-red-300 transition-all duration-300 relative group cursor-pointer"
                    >
                      <span className="relative z-10">Sign Out as Guest</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                ) : (
                  <>
                    {SignedOut && (
                      <SignedOut>
                        <div className="flex items-center gap-4">
                          <ProtectedLink href="/choose-username">
                            <button className="px-6 py-3 text-sm font-semibold text-zinc-300 hover:text-white transition-all duration-300 relative group cursor-pointer">
                              <span className="relative z-10">Login as Guest</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/50 to-zinc-600/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                          </ProtectedLink>
                          {SignInButton && (
                            <SignInButton forceRedirectUrl="/dashboard">
                              <button className="px-6 py-3 text-sm font-semibold text-zinc-300 hover:text-white transition-all duration-300 relative group cursor-pointer">
                                <span className="relative z-10">Sign In</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/50 to-zinc-600/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </button>
                            </SignInButton>
                          )}
                          {SignUpButton && (
                            <SignUpButton forceRedirectUrl="/dashboard">
                              <button className="px-8 py-3 text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 cursor-pointer relative overflow-hidden">
                                <span className="relative z-10">Get Started</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                              </button>
                            </SignUpButton>
                          )}
                        </div>
                      </SignedOut>
                    )}
                  </>
                )}
                {SignedIn && (
                  <SignedIn>
                            <div className="flex items-center gap-6">
                              <ProtectedLink 
                                href="/dashboard"
                                prefetch={true}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                                  isActive('/dashboard') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                                </svg>
                                Dashboard
                              </ProtectedLink>
                              <ToolsDropdown isActive={isActive} />
                              <ProtectedLink 
                                href="/user-settings"
                                prefetch={true}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                                  isActive('/user-settings') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                              </ProtectedLink>
                              <ProtectedLink 
                                href="/credits"
                                prefetch={true}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                                  isActive('/credits') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Credits
                              </ProtectedLink>
                      {UserInfo && <UserInfo />}
                      {UserButton && (
                        <UserButton 
                          appearance={{
                            elements: {
                              avatarBox: "w-10 h-10 ring-2 ring-indigo-500/50 hover:ring-indigo-400/70 transition-all duration-150",
                              userButtonPopoverCard: "bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl",
                              userButtonPopoverActionButton: "text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors duration-150",
                              userButtonPopoverActionButtonText: "text-zinc-300",
                              userButtonPopoverFooter: "hidden",
                            }
                          }}
                        />
                      )}
                    </div>
                  </SignedIn>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="relative w-12 h-12 bg-zinc-700/50 rounded-xl flex items-center justify-center hover:bg-zinc-600/70 transition-colors duration-150"
                >
                  <div className="w-6 h-6 flex flex-col justify-center items-center">
                    <span className={`block h-0.5 w-6 bg-white transition-all duration-150 ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
                    <span className={`block h-0.5 w-6 bg-white transition-all duration-150 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                    <span className={`block h-0.5 w-6 bg-white transition-all duration-150 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="py-6 space-y-4 border-t border-zinc-700/30">
                {isGuest ? (
                  <div className="space-y-4">
                    <ProtectedLink href="/guest-mode-snippets">
                      <button className={`w-full px-6 py-4 text-left text-base font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                        pathname === '/guest-mode-snippets'
                          ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                      }`}>
                        Snippets
                      </button>
                    </ProtectedLink>
                    <button
                      onClick={handleGuestSignOut}
                      className="w-full px-6 py-4 text-left text-base font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      Sign Out as Guest
                    </button>
                  </div>
                ) : (
                  <>
                    {SignedOut && (
                      <SignedOut>
                        <div className="space-y-4">
                          <ProtectedLink href="/choose-username">
                            <button className="w-full px-6 py-4 text-left text-base font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700/30 rounded-xl transition-all duration-300 cursor-pointer">
                              Login as Guest
                            </button>
                          </ProtectedLink>
                          {SignInButton && (
                            <SignInButton forceRedirectUrl="/dashboard">
                              <button className="w-full px-6 py-4 text-left text-base font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700/30 rounded-xl transition-all duration-300 cursor-pointer">
                                Sign In
                              </button>
                            </SignInButton>
                          )}
                          {SignUpButton && (
                            <SignUpButton forceRedirectUrl="/dashboard">
                              <button className="w-full px-6 py-4 text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/30 cursor-pointer">
                                Get Started
                              </button>
                            </SignUpButton>
                          )}
                        </div>
                      </SignedOut>
                    )}
                  </>
                )}
                {SignedIn && (
                  <SignedIn>
                            <div className="space-y-4">
                              <ProtectedLink 
                                href="/dashboard"
                                prefetch={true}
                                className={`flex items-center gap-3 px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 cursor-pointer ${
                                  isActive('/dashboard')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                                </svg>
                                Dashboard
                              </ProtectedLink>
                              <ToolsDropdown 
                                isActive={isActive} 
                                onItemClick={() => setIsMobileMenuOpen(false)}
                              />
                              <ProtectedLink 
                                href="/user-settings"
                                prefetch={true}
                                className={`flex items-center gap-3 px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 cursor-pointer ${
                                  isActive('/user-settings')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                              </ProtectedLink>
                              <ProtectedLink 
                                href="/credits"
                                prefetch={true}
                                className={`flex items-center gap-3 px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 cursor-pointer ${
                                  isActive('/credits')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Credits
                              </ProtectedLink>
                      {UserInfo && (
                        <div className="px-6 py-4 border-t border-zinc-700/30">
                          <UserInfo />
                        </div>
                      )}
                    </div>
                  </SignedIn>
                )}
              </div>
            </div>
          </div>
        </header>
        <main>
          {children}
        </main>
        
        {/* Unsaved Changes Alert */}
        <UnsavedChangesAlert
          isOpen={showUnsavedAlert}
          onConfirm={handleUnsavedAlertConfirm}
          onCancel={handleUnsavedAlertCancel}
          onSave={handleAlertSave}
        />
      </div>
    </ClerkProvider>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

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
          <div className="max-w-7xl mx-auto" >
            <div className="flex justify-between items-center h-20">
              <Link 
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
              </Link>
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
          <div className="max-w-7xl mx-auto" style={{ padding: '0 20px' }}>
            <div className="flex justify-between items-center h-16">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-400 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-sm font-bold text-white font-montserrat">CS</span>
                  </div>
                  <span className="hidden sm:block">Code Snippet V1</span>
                </div>
              </Link>
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
        <header className="sticky top-0 z-50 pl-[20px] pr-[20px] backdrop-blur-xl bg-gradient-to-r from-zinc-900/95 via-zinc-800/90 to-zinc-900/95 border-b border-zinc-700/30 shadow-2xl shadow-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center h-20">
              {/* Logo Section */}
              <Link
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
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-8">
                {isGuest ? (
                  <div className="flex items-center gap-4">
                    <Link href="/guest-mode-snippets">
                      <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                        pathname === '/guest-mode-snippets'
                          ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                      }`}>
                        Snippets
                      </button>
                    </Link>
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
                          <Link href="/choose-username">
                            <button className="px-6 py-3 text-sm font-semibold text-zinc-300 hover:text-white transition-all duration-300 relative group cursor-pointer">
                              <span className="relative z-10">Login as Guest</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/50 to-zinc-600/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                          </Link>
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
                              <Link 
                                href="/dashboard"
                                prefetch={true}
                                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                                  isActive('/dashboard') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                Dashboard
                              </Link>
                              <Link 
                                href="/snippets"
                                prefetch={true}
                                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                                  isActive('/snippets') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                Snippets
                              </Link>
                              <Link 
                                href="/organize"
                                prefetch={true}
                                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                                  isActive('/organize') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                Organize
                              </Link>
                              <Link 
                                href="/user-settings"
                                prefetch={true}
                                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                                  isActive('/user-settings') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                Settings
                              </Link>
                              <Link 
                                href="/credits"
                                prefetch={true}
                                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                                  isActive('/credits') 
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30' 
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                } rounded-lg`}
                              >
                                Credits
                              </Link>
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
            <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="py-6 space-y-4 border-t border-zinc-700/30">
                {isGuest ? (
                  <div className="space-y-4">
                    <Link href="/guest-mode-snippets">
                      <button className={`w-full px-6 py-4 text-left text-base font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                        pathname === '/guest-mode-snippets'
                          ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                      }`}>
                        Snippets
                      </button>
                    </Link>
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
                          <Link href="/choose-username">
                            <button className="w-full px-6 py-4 text-left text-base font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700/30 rounded-xl transition-all duration-300 cursor-pointer">
                              Login as Guest
                            </button>
                          </Link>
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
                              <Link 
                                href="/dashboard"
                                prefetch={true}
                                className={`block px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 ${
                                  isActive('/dashboard')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Dashboard
                              </Link>
                              <Link 
                                href="/snippets"
                                prefetch={true}
                                className={`block px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 ${
                                  isActive('/snippets')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Snippets
                              </Link>
                              <Link 
                                href="/organize"
                                prefetch={true}
                                className={`block px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 ${
                                  isActive('/organize')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Organize
                              </Link>
                              <Link 
                                href="/user-settings"
                                prefetch={true}
                                className={`block px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 ${
                                  isActive('/user-settings')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Settings
                              </Link>
                              <Link 
                                href="/credits"
                                prefetch={true}
                                className={`block px-6 py-4 text-base font-medium rounded-xl transition-colors duration-150 ${
                                  isActive('/credits')
                                    ? 'text-white bg-indigo-500/20 border border-indigo-500/30'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-700/30'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Credits
                              </Link>
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
        <main className="max-w-7xl mx-auto" style={{ padding: '0 20px' }}>
          {children}
        </main>
      </div>
    </ClerkProvider>
  )
}

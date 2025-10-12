import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import UserInfo from './components/UserInfo'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Auth Diary',
  description: 'A diary application with authentication',
}

import Link from 'next/link'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
          <div className="min-h-screen">
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-400 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-sm font-bold text-white">AD</span>
                      </div>
                      <span className="hidden sm:block">Auth Diary</span>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-3">
                    <SignedOut>
                      <SignInButton forceRedirectUrl="/dashboard">
                        <button className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer">
                          Sign In
                        </button>
                      </SignInButton>
                      <SignUpButton forceRedirectUrl="/dashboard">
                        <button className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 cursor-pointer">
                          Sign Up
                        </button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex items-center gap-3">
                        <UserInfo />
                        <UserButton 
                          appearance={{
                            elements: {
                              avatarBox: "w-9 h-9 ring-2 ring-indigo-500/50",
                              userButtonPopoverCard: "bg-zinc-900 border border-zinc-800",
                              userButtonPopoverActionButton: "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                              userButtonPopoverActionButtonText: "text-zinc-300",
                              userButtonPopoverFooter: "hidden",
                            }
                          }}
                        />
                      </div>
                    </SignedIn>
                  </div>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
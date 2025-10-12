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
            <header className="backdrop-blur-sm bg-white/10 border-b border-white/20">
              <div className="max-w-[1600px] mx-auto flex justify-between items-center p-4 gap-4 h-16">
                <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-200 transition-colors">
                  <span>Project</span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                </Link>
                <div className="flex items-center gap-4">
                  <SignedOut>
                    <SignInButton 
                      forceRedirectUrl="/dashboard"
                    />
                    <SignUpButton 
                      forceRedirectUrl="/dashboard"
                    >
                      <button className="bg-white/20 backdrop-blur-sm text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer border border-white/30 hover:bg-white/30 transition-all">
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
                            avatarBox: "w-8 h-8",
                            userButtonPopoverCard: "bg-white/10 backdrop-blur-sm border border-white/20",
                            userButtonPopoverActionButton: "text-white hover:bg-white/10",
                            userButtonPopoverActionButtonText: "text-white",
                            userButtonPopoverFooter: "hidden",
                          }
                        }}
                      />
                    </div>
                  </SignedIn>
                </div>
              </div>
            </header>
            <main className="max-w-[1600px] mx-auto">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
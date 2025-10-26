import { type Metadata } from 'next'
import { Poppins, Montserrat } from 'next/font/google'
import './globals.css'
import ClerkWrapper from './components/ClerkWrapper'
import { Analytics } from '@vercel/analytics/react'
import { ClerkProvider } from '@clerk/nextjs'
import { NavigationProvider } from './contexts/NavigationContext'
import { Toaster } from 'react-hot-toast'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Code Snippet V1',
  description: 'A professional code snippet management application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} antialiased`} suppressHydrationWarning>
        {clerkPublishableKey ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          >
            <NavigationProvider>
              <ClerkWrapper>{children}</ClerkWrapper>
            </NavigationProvider>
          </ClerkProvider>
        ) : (
          <NavigationProvider>
            <ClerkWrapper>{children}</ClerkWrapper>
          </NavigationProvider>
        )}
        <Analytics />
        <Toaster 
          position="top-right"
          containerStyle={{ zIndex: 9999 }}
          toastOptions={{
            style: {
              zIndex: 9999,
            },
          }}
        />
      </body>
    </html>
  )
}
import { type Metadata } from 'next'
import { Poppins, Montserrat } from 'next/font/google'
import './globals.css'
import ClerkWrapper from './components/ClerkWrapper'
import { Analytics } from '@vercel/analytics/react'
import { ClerkProvider } from '@clerk/nextjs'

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
  title: 'Code Snippet Manager',
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
            <ClerkWrapper>{children}</ClerkWrapper>
          </ClerkProvider>
        ) : (
          <ClerkWrapper>{children}</ClerkWrapper>
        )}
        <Analytics />
      </body>
    </html>
  )
}
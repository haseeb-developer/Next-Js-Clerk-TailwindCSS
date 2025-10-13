import { type Metadata } from 'next'
import { Poppins, Montserrat } from 'next/font/google'
import './globals.css'
import ClerkWrapper from './components/ClerkWrapper'

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} antialiased`} suppressHydrationWarning>
        <ClerkWrapper>{children}</ClerkWrapper>
      </body>
    </html>
  )
}
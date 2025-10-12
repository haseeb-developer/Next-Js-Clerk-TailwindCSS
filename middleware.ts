import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Check if Clerk keys are available
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    console.warn('Clerk environment variables not set, skipping middleware')
    return NextResponse.next()
  }

  try {
    const { userId } = await auth()
    
    // Protect routes that require authentication
    if (isProtectedRoute(req)) {
      if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
      }
    }
    
    // Redirect authenticated users away from auth pages
    if (userId && isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // Redirect authenticated users from home to dashboard
    if (userId && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  } catch (error) {
    console.error('Clerk middleware error:', error)
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
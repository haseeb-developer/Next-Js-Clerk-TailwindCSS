import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/safe-passwords(.*)',
  '/snippets(.*)',
  '/organize(.*)',
  '/dashboard(.*)',
  '/user-settings(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/choose-username',
  '/credits',
  '/guest-mode-snippets',
  '/confirm-auth',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // Redirect to confirm-auth for safe-passwords if user is authenticated
  // But allow access if they have verified their PIN (check query param)
  if (userId && req.nextUrl.pathname === '/safe-passwords') {
    const pinVerified = req.nextUrl.searchParams.get('pinVerified') === 'true';
    if (!pinVerified) {
      return NextResponse.redirect(new URL('/confirm-auth', req.url));
    }
  }
  
  // Redirect to sign-in for protected routes if not authenticated
  if (!userId && isProtectedRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
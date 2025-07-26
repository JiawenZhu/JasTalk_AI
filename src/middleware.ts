import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/auth/callback',
  '/auth/reset-password',
  '/demo',
  '/premium',
  '/questions',
  '/coding-demo',
  '/voice-demo',
  '/api/register-call',
  '/api/register-practice-call',
  '/api/get-call',
  '/api/generate-interview-questions',
  '/api/create-interviewer',
  '/api/analyze-communication',
  '/api/upload-document',
  '/api/generate-questions',
  '/api/analyze-response',
]

const protectedRoutes = [
  '/dashboard',
  '/interviews',
  '/call',
  '/upload',
  '/practice',
  '/analytics',
  '/api/create-interview',
  '/api/delete-interview',
  '/api/manage-agents',
  '/api/sync-retell-agents',
  '/api/audit-agents',
  '/api/execute-code',
  '/api/submit-code',
  '/api/analyze-code',
  '/api/retell-code-review',
  '/api/retell-webhook',
  '/api/response-webhook',
  '/api/generate-insights',
  '/api/seed-coding-questions',
  '/api/create-simple-coding-question',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // If user is not signed in and trying to access a protected route
  if (!session && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set('redirect', pathname)
    
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (session && (pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/forgot-password')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/reset-password',
  '/jastalk-landing',
  '/coding-demo',
  '/voice-demo',
  '/practice/setup',
  '/practice/interview',
  '/practice/complete',
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
  '/questions/generate',
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

  // Safely initialize Supabase only if env vars are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  let session: any = null
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createMiddlewareClient<Database>({ req, res }, {
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
      })
      const {
        data: { session: s },
      } = await supabase.auth.getSession()
      session = s
    } catch (e) {
      // If Supabase init fails, continue without session to avoid middleware crashes
      session = null
    }
  }

  const { pathname } = req.nextUrl

  // Persist referral and UTM params into cookies for 90 days
  const url = new URL(req.url)
  const ref = url.searchParams.get('ref')
  const utmSource = url.searchParams.get('utm_source')
  const utmMedium = url.searchParams.get('utm_medium')
  const utmCampaign = url.searchParams.get('utm_campaign')
  const utmTerm = url.searchParams.get('utm_term')
  const utmContent = url.searchParams.get('utm_content')

  const cookieMaxAge = 60 * 60 * 24 * 90 // 90 days
  const cookieOptions: Parameters<typeof NextResponse.next>[0] | undefined = undefined
  const setCookie = (name: string, value: string) => {
    res.cookies.set(name, value, { maxAge: cookieMaxAge, sameSite: 'lax', path: '/' })
  }

  if (ref) {setCookie('ref', ref)}
  if (utmSource) {setCookie('utm_source', utmSource)}
  if (utmMedium) {setCookie('utm_medium', utmMedium)}
  if (utmCampaign) {setCookie('utm_campaign', utmCampaign)}
  if (utmTerm) {setCookie('utm_term', utmTerm)}
  if (utmContent) {setCookie('utm_content', utmContent)}

  // Special handling for root path - let the client handle the redirect
  if (pathname === '/') {
    return res
  }

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
